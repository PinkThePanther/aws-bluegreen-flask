# BlueGreen

A Flask and React social application used to demonstrate an AWS ECS blue/green
deployment and a modern observability baseline.

## Local backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

The API listens on `http://localhost:8080`.

## Observability

The Flask application is instrumented with OpenTelemetry. Requests produce a
span and structured logs for completion, slow responses, unhandled errors, and
login outcomes. Every log includes a `trace_id` and `span_id`.

Example events:

```text
request_completed method=GET path=/health status=200 duration_ms=1.20
request_slow method=GET path=/posts status=200 duration_ms=2104.32
login_failed reason=invalid_credentials
request_error method=POST path=/posts error_type=IntegrityError
```

Login identifiers, passwords, request bodies, and exception messages are not
logged.

Locally, each request writes one concise log line. To also send its span to an
OTLP-compatible collector or hosted backend, configure an OTLP/HTTP endpoint:

```bash
export OTEL_SERVICE_NAME=bluegreen-flask
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
python app.py
```

See `.env.example` for the supported project settings. Standard OpenTelemetry
environment variables, including `OTEL_EXPORTER_OTLP_HEADERS`, are read by the
OTLP exporter.

The instrumentation deliberately avoids recording request bodies, passwords,
email addresses, query strings, and other user-provided values in application
logs.

## Deployment learning guide

See [`docs/ecs-cloudwatch-observability-runbook.md`](docs/ecs-cloudwatch-observability-runbook.md)
for the complete image-build, ECR, ECS task-definition, health-check, and
CloudWatch verification workflow used for this project.
