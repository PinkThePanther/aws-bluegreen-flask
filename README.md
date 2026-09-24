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

## Demo account

Enable the disposable portfolio account before starting the backend:

```bash
export DEMO_MODE=true
python app.py
```

The login page's **Use demo account** button fills the seeded account's public
demo credentials. The request still passes through the normal `/login`
authentication flow. Keep `DEMO_MODE` disabled outside disposable demo
environments.

## Blue/green visual demo

The stable blue frontend has no weather widget. The green candidate adds an
intentionally malfunctioning early-web weather widget and animated raindrops,
providing an unmistakable visual reason to roll traffic back even while the
basic health check remains successful.

After signing in, the **Deployment demo** panel lets a portfolio reviewer
preview Blue, preview Green, inspect representative ECS and CloudWatch evidence,
and roll back to Blue. This browser control is explicitly a cost-free
simulation: it does not start tasks or modify AWS resources. The account and
feed remain unchanged between releases so the deployment difference is clear.
The panel walks the reviewer through establishing a stable baseline, previewing
the candidate, and making a rollback decision when application health and user
experience tell different stories.

The ECS and CloudWatch values in this browser panel are labeled example data.
They illustrate the real log fields produced by the application without
pretending that the static portfolio control is a live AWS console.

```bash
# Stable blue release
VITE_DEPLOYMENT_COLOR=blue npm --prefix frontend run dev

# Intentionally defective green release
VITE_DEPLOYMENT_COLOR=green npm --prefix frontend run dev
```

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
