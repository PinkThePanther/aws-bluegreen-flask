# ECS Image Deployment and CloudWatch Logging Runbook

This document records the September 23, 2026 deployment that proved the
BlueGreen Flask application's request logs reach Amazon CloudWatch Logs. It is
both a record of what changed and a repeatable learning guide for future
deployments.

## The result

The final test produced CloudWatch events like these:

```text
message=request_completed method=GET path=/health status=200 duration_ms=0.24
message=request_completed method=GET path=/health status=200 duration_ms=0.14
```

The complete events also contained a valid OpenTelemetry `trace_id` and
`span_id`. This proved the complete logging path:

```text
ECS container health check
  -> Flask GET /health
  -> application writes a structured log to stderr/stdout
  -> ECS awslogs log driver
  -> CloudWatch log group /ecs/bluegreen-flask
```

After verification, both ECS services were returned to a desired count of
zero. No Fargate tasks were left running.

## The concepts to remember

### Source code is not a running container

Editing files on a laptop does not update an ECS task. A Docker image is an
immutable snapshot containing the application code and dependencies that
existed when `docker build` ran.

The original ECS task definition used this image:

```text
973940554982.dkr.ecr.us-east-1.amazonaws.com/bluegreen-flask:3
```

That image successfully started Gunicorn, and its Gunicorn lifecycle messages
reached CloudWatch. However, it did not emit the new `request_completed`
application event. The local repository did emit that event, indicating that
the deployed image was older than the local observability code.

The deployment relationship is:

```text
source code
  -> docker build
  -> Docker image
  -> push to ECR
  -> ECS task-definition revision
  -> ECS service or standalone task
  -> running container
```

Any application-code, dependency, or Dockerfile change requires a new image.
Changing an ECS setting such as desired task count does not rebuild an image.

### ECR stores images; ECS runs them

Amazon Elastic Container Registry (ECR) stores versioned container images.
Amazon Elastic Container Service (ECS) reads a task definition that identifies
the exact image and describes how to run it.

The new image used an immutable Git-based tag:

```text
bluegreen-flask:2f3aa1c
```

`2f3aa1c` is the short Git commit ID of the source used for the build. This is
preferable to repeatedly overwriting a tag such as `3` or `latest`, because the
tag explains exactly which source revision is inside the image and makes
rollback and diagnosis much easier.

### A task definition is a versioned runtime specification

Registering a task definition creates a new numbered revision. Existing
revisions are preserved.

During this deployment:

- Revision 3 referenced the old `:3` image.
- Revision 4 referenced the new `:2f3aa1c` image.
- Revision 5 referenced the same new image and added a container health check.

Revision 5 became the green service's active task definition.

### A task is the running container

An ECS task is a live instance of a task definition. A service's desired count
controls how many tasks ECS should keep running.

```text
desired count 1 -> ECS tries to keep one task running
desired count 0 -> ECS stops all service tasks
```

The service must have a running task before Flask can receive a request.
Returning the desired count to zero after a temporary test prevents continuing
Fargate runtime charges.

### The ALB and task have different jobs

The task runs the application. An Application Load Balancer (ALB) provides a
stable endpoint, health-based routing, TLS termination, and blue/green traffic
switching.

An ALB is not inherently required to run a task or make an internal request.
It is normally required for safe, stable public traffic. The task security
group should ordinarily accept application traffic from the ALB security
group, not from the entire internet.

At deployment time, the green ECS service referenced a target group whose ALB
had already been deleted. ECS therefore rejected the initial task-definition
update with this condition:

```text
The target group does not have an associated load balancer.
```

The stale green load-balancer attachment was removed. When the ALB is rebuilt,
the new green target group must be attached to the green service again.

### CloudWatch Logs and OpenTelemetry spans are separate paths

The ECS `awslogs` driver captures process output from the container and sends it
to CloudWatch Logs:

```text
application stdout/stderr -> awslogs -> CloudWatch Logs
```

OpenTelemetry creates trace context for Flask requests. The application logger
adds the active trace and span IDs to its log lines. That makes logs
correlatable with traces.

Actual OpenTelemetry spans follow a different route:

```text
OpenTelemetry span -> OTLP exporter -> configured observability backend
```

An OTLP endpoint is not required to send ordinary application logs through the
ECS `awslogs` driver. It is required if the actual spans should be exported to
a tracing backend. In this project, a span exporter is only enabled when
`OTEL_EXPORTER_OTLP_ENDPOINT` or `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is set.

## What was done

### 1. Confirm the source revision and Docker runtime

```bash
git status --short
git rev-parse --short HEAD
docker info --format '{{.ServerVersion}} {{.Architecture}}'
```

The repository was clean at commit `2f3aa1c`. Docker Desktop was running on an
Apple Silicon (`aarch64`) Mac.

### 2. Inspect the existing AWS configuration

The ECR repository and ECS task definition were inspected before making
changes. This established the source configuration to preserve:

- Region: `us-east-1`
- ECR repository: `bluegreen-flask`
- ECS cluster: `bluegreen-cluster`
- Green service: `bluegreen-flask-service-greenv2`
- Container name: `bluegreen-flask`
- Container port: `8080`
- CPU: `256`
- Memory: `512`
- Launch compatibility: Fargate
- Network mode: `awsvpc`
- CloudWatch log group: `/ecs/bluegreen-flask`
- Log stream prefix: `ecs`

Inspecting before changing prevents accidentally dropping IAM roles, port
mappings, logging options, or other runtime settings when registering a new
revision.

### 3. Build an AMD64 image

```bash
docker build \
  --platform linux/amd64 \
  -t 973940554982.dkr.ecr.us-east-1.amazonaws.com/bluegreen-flask:2f3aa1c \
  .
```

`--platform linux/amd64` was important because Docker was running on an ARM Mac
while the existing Fargate configuration expected an AMD64 Linux image.
Without an explicit platform, a locally built ARM image can fail to start on
an AMD64 task runtime with an executable-format error.

The built image was verified as `linux/amd64` before upload.

### 4. Authenticate Docker to ECR

```bash
aws ecr get-login-password --region us-east-1 \
  | docker login \
      --username AWS \
      --password-stdin 973940554982.dkr.ecr.us-east-1.amazonaws.com
```

The AWS CLI obtains a short-lived ECR authorization token. `docker login`
stores it so Docker can push layers to the private repository. The password is
sent through standard input so it is not placed directly in the command line.

### 5. Push the image to ECR

```bash
docker push \
  973940554982.dkr.ecr.us-east-1.amazonaws.com/bluegreen-flask:2f3aa1c
```

The published image digest was:

```text
sha256:3f50b89418fecc3a5e7aa6a27c1cd6dabd0011d9966b54eb46e75b3c2038fec3
```

The tag is a convenient human-readable version. The digest identifies the
exact immutable image contents.

### 6. Register new task-definition revisions

Revision 4 changed the image reference from `:3` to `:2f3aa1c` while
preserving the established Fargate and CloudWatch settings.

The first attempt to update the green service revealed the stale target-group
attachment. No new task was launched by that rejected update.

Revision 5 added this container health check:

```json
{
  "healthCheck": {
    "command": [
      "CMD-SHELL",
      "python -c \"import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health', timeout=5)\" || exit 1"
    ],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 10
  }
}
```

This health check runs inside the container and calls Flask through the
container's loopback interface. It has several useful properties:

- It verifies that Gunicorn and Flask can answer requests.
- It does not require a public IP or temporary public security-group rule.
- Each successful check exercises the request instrumentation.
- ECS can mark the container unhealthy after repeated failures.

### 7. Remove the stale green load-balancer attachment

The green service referenced a target group that was no longer associated with
an ALB. The stale attachment was removed while deploying revision 5.

This was not a replacement for the final ALB design. It made the service
internally runnable until the ALB and blue/green target groups are recreated.

### 8. Run one green task

The green service was temporarily set to desired count 1. During the rolling
transition, ECS briefly showed both the old revision-3 task and the new
revision-5 task. The revision-5 task was identified by task-definition ARN,
not merely by taking the first task returned from `list-tasks`.

The revision-5 task reached:

```text
lastStatus: RUNNING
healthStatus: HEALTHY
containerHealth: HEALTHY
```

That status proved the internal `/health` call succeeded.

### 9. Verify the exact CloudWatch stream

The verified task ID was:

```text
76cdc7142461418a9f70fdbea108e738
```

With the configured prefix and container name, its stream was:

```text
ecs/bluegreen-flask/76cdc7142461418a9f70fdbea108e738
```

Inside log group `/ecs/bluegreen-flask`, filtering this stream for
`request_completed` returned two events. Both had:

- `method=GET`
- `path=/health`
- `status=200`
- request duration
- a 32-character trace ID
- a 16-character span ID

This is the definitive proof that the application—not merely Gunicorn—was
logging successfully through ECS to CloudWatch.

### 10. Scale back to zero and verify cleanup

After verification, the green service was returned to desired count zero.
Both services were checked, and the cluster was checked for running tasks.

Final runtime state:

```text
bluegreen-flask-service-blue:    desired 0, running 0, pending 0
bluegreen-flask-service-greenv2: desired 0, running 0, pending 0
cluster running tasks:           none
```

The green service remains configured with task definition revision 5 and no
load-balancer attachment. No temporary public ingress rule remains.

## Repeatable deployment checklist

Use this sequence whenever application code changes:

1. Confirm the intended Git revision and review `git status`.
2. Choose a new immutable image tag, preferably the Git commit ID.
3. Build for the ECS runtime platform.
4. Run a local container smoke test when practical.
5. Authenticate Docker to ECR.
6. Push the new image and verify that the tag exists in ECR.
7. Register a new task-definition revision without dropping existing settings.
8. Update the non-production/green service to the new revision.
9. Run one task and wait for `RUNNING` and `HEALTHY`.
10. Generate or wait for a known request such as `GET /health`.
11. Inspect the exact task's CloudWatch log stream.
12. Confirm the application event, status, trace ID, and span ID.
13. Scale back to zero when the environment is only needed temporarily.
14. Verify `desired=0`, `running=0`, and no running task ARNs.
15. Commit the task-definition and documentation changes if they are intended
    to remain part of the repository.

## Diagnostic guide

### CloudWatch has no stream

Check:

- The task actually started.
- The task execution role can create streams and put log events.
- The log group exists in the configured region.
- The task definition uses the `awslogs` driver.

### CloudWatch has Gunicorn logs but no application request logs

Check:

- The deployed image contains the current application code.
- The request actually reached Flask.
- The task is using the expected task-definition revision.
- The application logging handler writes to stdout or stderr.
- The search filter and time window include the request time.

This was the exact symptom caused by the old `:3` image.

### The image works locally but the ECS task will not start

Check:

- Image CPU architecture (`amd64` versus `arm64`).
- ECR tag and region.
- Task execution role permissions.
- Container command and exposed/listening port.
- ECS stopped-task reason and service events.

### ECS refuses to update a service because of a target group

Check whether the target group still has an associated ALB. Either rebuild the
ALB/listener relationship before updating, or remove the stale service
attachment if the service is intentionally being tested without a load
balancer.

### The task is healthy but traces are absent from a tracing backend

CloudWatch application logs and OTLP span export are separate. Configure a
valid `OTEL_EXPORTER_OTLP_ENDPOINT` and any required headers if spans must be
exported. Do not interpret trace IDs in log lines alone as proof that spans
were received by a tracing backend.

## Current repository and AWS state

At the end of this session:

- ECR contains `bluegreen-flask:2f3aa1c`.
- ECS task definition revision 5 uses that image.
- Revision 5 includes an internal `/health` container health check.
- The green service uses revision 5.
- The green service has no load balancer attached.
- The blue service still retains its previous target-group configuration.
- Both ECS services have desired count zero.
- No ECS tasks are running.
- `task-definition.json` reflects the verified image and health check.
- Actual OTLP span export is still optional and requires an OTLP endpoint.

