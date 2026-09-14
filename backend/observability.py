import logging
import os
import time

from flask import Flask, g, got_request_exception, request
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor


_configured = False


class TraceContextFilter(logging.Filter):
    """Attach the active OpenTelemetry trace context to every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        span_context = trace.get_current_span().get_span_context()
        record.otelTraceID = format(span_context.trace_id, "032x") if span_context.is_valid else "0" * 32
        record.otelSpanID = format(span_context.span_id, "016x") if span_context.is_valid else "0" * 16
        return True


def configure_observability(app: Flask) -> None:
    """Configure vendor-neutral tracing and trace-correlated application logs."""
    global _configured

    if _configured or os.getenv("OTEL_SDK_DISABLED", "false").lower() == "true":
        return

    resource = Resource.create(
        {SERVICE_NAME: os.getenv("OTEL_SERVICE_NAME", "bluegreen-flask")}
    )

    provider = TracerProvider(resource=resource)
    if _has_otlp_endpoint():
        provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))

    trace.set_tracer_provider(provider)
    _configure_logging()
    FlaskInstrumentor().instrument_app(app, tracer_provider=provider)
    _register_request_logging(app)

    _configured = True


def _has_otlp_endpoint() -> bool:
    return bool(
        os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
        or os.getenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT")
    )


def _configure_logging() -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())

    if not any(getattr(handler, "_bluegreen_handler", False) for handler in root_logger.handlers):
        handler = logging.StreamHandler()
        handler._bluegreen_handler = True
        handler.addFilter(TraceContextFilter())
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s level=%(levelname)s logger=%(name)s "
                "trace_id=%(otelTraceID)s span_id=%(otelSpanID)s message=%(message)s"
            )
        )
        root_logger.addHandler(handler)


def _register_request_logging(app: Flask) -> None:
    slow_request_threshold_ms = float(os.getenv("SLOW_REQUEST_THRESHOLD_MS", "2000"))

    @app.before_request
    def start_request_timer() -> None:
        g.request_started_at = time.perf_counter()

    @app.after_request
    def log_request(response):
        duration_ms = (time.perf_counter() - g.request_started_at) * 1000
        log = app.logger.warning if duration_ms >= slow_request_threshold_ms else app.logger.info
        event = "request_slow" if duration_ms >= slow_request_threshold_ms else "request_completed"
        log(
            "%s method=%s path=%s status=%s duration_ms=%.2f",
            event,
            request.method,
            request.path,
            response.status_code,
            duration_ms,
        )
        return response

    @got_request_exception.connect_via(app)
    def log_request_error(sender, exception, **extra) -> None:
        sender.logger.error(
            "request_error method=%s path=%s error_type=%s",
            request.method,
            request.path,
            type(exception).__name__,
        )
