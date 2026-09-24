# ChatGPT Teaching Context: AWS Blue/Green Flask Project

## How to use this document

Upload this file to ChatGPT on the web at the start of a study session. Then ask it to follow the teaching instructions below.

Suggested opening prompt:

> Read this context completely. Test my mental model of source code, Docker images, ECR, task definitions, tasks, and ECS services. Ask one question at a time. Correct my reasoning, then give me one small code-reading exercise. Do not make real AWS changes until I can explain the deployment chain back to you.

This is a teaching brief, not a place to store credentials. Never paste AWS access keys, passwords, session tokens, or other secrets into a chat.

## Instructions for ChatGPT

Act as a patient technical instructor using this specific project.

- Begin each lesson with the practical outcome in plain language.
- Teach one layer at a time and connect every term to this project.
- Clearly distinguish local simulation from real AWS infrastructure.
- Ask me to predict what a command will do before explaining the answer.
- Explain each command's inputs, output, side effects, and cost implications.
- Prefer short examples, diagrams, code-reading questions, and teach-back questions over long lectures.
- Give exercises as a goal plus acceptance criteria. Let me attempt them before giving a complete solution.
- Correct the underlying mental model, not just the command syntax.
- Never invent current AWS state. Ask for fresh CLI or console output.
- Do not recommend destructive AWS actions without naming the exact resource and consequence.
- After temporary ECS testing, remind me to return desired task counts to zero unless I intentionally want the application running.

## Learner and goal

I am building a portfolio project to understand and demonstrate:

- Flask and React application structure
- Docker images and containers
- Amazon ECR and ECS Fargate
- ECS task definitions, tasks, and services
- ALB Blue/Green routing
- CloudWatch application logs
- OpenTelemetry trace context
- Deployment verification and rollback decisions
- Cost-aware cloud operation

I may understand a topic at the surface level and later forget setup details. Repeat why each step exists and ask me to teach it back. The objective is both a working portfolio and repeatable understanding.

## Project summary

Repository: aws-bluegreen-flask

Stack:

- Backend: Flask, SQLAlchemy, and SQLite
- Frontend: React and Vite
- AWS runtime: Docker with Gunicorn on ECS Fargate
- Registry: Amazon ECR
- Logging: ECS awslogs driver to CloudWatch Logs
- Instrumentation: OpenTelemetry for Flask

Portfolio story:

- Blue is the stable release with no weather widget.
- Green is a candidate release containing a deliberately malfunctioning Windows-era weather widget.
- Pixelated rain escapes the widget and falls across the page.
- Green still returns HTTP 200.
- This demonstrates that infrastructure health does not guarantee an acceptable user experience.
- The correct decision is to roll back to Blue.

## Current repository state

The completed feature work is committed and pushed to origin/main:

~~~text
e6f1f7c Add recruiter blue-green deployment demo
~~~

The detailed AWS deployment record is:

~~~text
docs/ecs-cloudwatch-observability-runbook.md
~~~

Generated local artifacts were intentionally excluded from the commit:

- backend/services/__pycache__/auth_service.cpython-312.pyc
- instance/bluegreen.db

They are runtime data, not application source.

## Implemented features

### Disposable demo account

When DEMO_MODE=true, Flask runs ensure_demo_user() during startup. It creates the sample account if missing or refreshes its known credentials if it already exists.

The login page has a Use demo account button. It supplies disposable credentials, but login still passes through the real /login endpoint and password-hash verification.

Mental model: the convenience button does not bypass authentication; it fills credentials for the normal authentication flow.

SQLite is acceptable for this disposable demonstration. A production multi-task ECS service would normally keep persistent accounts in an external managed database such as Amazon RDS. Replacing a task or image should not erase production users.

### Recruiter walkthrough

After login, a full-width walkthrough appears below the social application. It contains:

- The scenario
- Blue baseline, Green candidate, and release-decision steps
- Example task revision and health data
- A collapsed View example trace and CloudWatch log section
- The reason Green should be rolled back
- View Blue, Preview Green, and Roll back to Blue controls

These browser buttons are a simulation. They do not start tasks, update ECS, call AWS, or move ALB traffic. This keeps the portfolio demonstration understandable and inexpensive.

### Observability

backend/observability.py configures OpenTelemetry and structured request logging.

Each Flask request log includes:

- HTTP method
- Request path
- Status code
- Duration
- OpenTelemetry trace ID
- OpenTelemetry span ID

Example event:

~~~text
request_completed method=GET path=/posts status=200 duration_ms=9.38
~~~

Passwords, request bodies, email addresses, query strings, and other sensitive values should not be logged.

## Essential mental models

### Source code is not a deployed container

~~~text
edit source
  -> docker build
  -> immutable image
  -> push image to ECR
  -> register task-definition revision
  -> update ECS service
  -> ECS starts task
  -> running container serves requests
~~~

Editing local files does not update ECS. Changing desired count does not rebuild an image. Code and dependency changes require a new image and a task definition that references it.

### AWS container vocabulary

- ECR repository: stores container images.
- Task definition: versioned runtime recipe for image, CPU, memory, ports, environment, health check, roles, and logging.
- Task: one running instance of a task definition.
- Service: keeps a desired number of tasks running and replaces them.
- Desired count: how many tasks the service should maintain.

Memory aid:

~~~text
ECR stores it -> task definition describes it -> task runs it -> service maintains it
~~~

Registering a task definition does not start a container. A service update or RunTask operation starts work.

### Task versus ALB

The ECS task runs Flask. The ALB provides a stable public endpoint, TLS termination, health-aware routing, and traffic switching.

A task can run and receive an internal container health request without an ALB. For secure public access, the task security group should normally accept application traffic from the ALB security group rather than the entire internet.

~~~text
Internet
  -> HTTPS listener on ALB
  -> target group
  -> ECS task security group
  -> Flask container
~~~

### Logs versus traces

CloudWatch log path:

~~~text
Flask stdout/stderr -> ECS awslogs driver -> CloudWatch Logs
~~~

Trace export path:

~~~text
OpenTelemetry span -> OTLP exporter -> tracing backend
~~~

The application can include trace and span IDs in CloudWatch logs without exporting complete traces. An OTLP endpoint is required to export and view the spans in a tracing backend.

This project enables the exporter only when OTEL_EXPORTER_OTLP_ENDPOINT or OTEL_EXPORTER_OTLP_TRACES_ENDPOINT is configured.

### Health versus correctness

Green may answer /health with 200 while the interface is visibly defective. The health check only proves Flask responds.

Verification layers:

- Container health: is the process responding?
- ALB target health: can the load balancer reach it?
- Logs and traces: what happened inside the request?
- Smoke tests: do key actions work?
- Product or visual checks: is the release acceptable to a user?

## Recorded AWS work

Last verified configuration:

- Region: us-east-1
- ECR repository: bluegreen-flask
- ECS cluster: bluegreen-cluster
- Green service: bluegreen-flask-service-greenv2
- Container: bluegreen-flask
- Container port: 8080
- Fargate CPU: 256
- Fargate memory: 512
- Network mode: awsvpc
- CloudWatch log group: /ecs/bluegreen-flask
- Log stream prefix: ecs

Previously deployed observability image:

~~~text
973940554982.dkr.ecr.us-east-1.amazonaws.com/bluegreen-flask:2f3aa1c
~~~

Recorded image digest:

~~~text
sha256:3f50b89418fecc3a5e7aa6a27c1cd6dabd0011d9966b54eb46e75b3c2038fec3
~~~

Task-definition history:

- Revision 3 used the older :3 image.
- Revision 4 used :2f3aa1c.
- Revision 5 used the same image and added an internal /health container check.

The Green service had a stale target-group attachment after its ALB was deleted. That attachment was removed. The ALB and Blue/Green target groups must be deliberately rebuilt before demonstrating real traffic switching.

After the verification exercise, both ECS services were returned to desired count zero. Future sessions must verify this rather than assume it remains true.

## Why a new image was required

The old container could send Gunicorn lifecycle messages to CloudWatch because awslogs was configured. It could not emit the new request_completed application event because the new Python code was not inside the immutable old image.

The solution was:

1. Build an image containing the new code and dependencies.
2. Push it to ECR.
3. Register a task-definition revision pointing at it.
4. Start a task from that revision.
5. Exercise /health.
6. Inspect CloudWatch.
7. Return desired count to zero.

The image was built for linux/amd64 because the development Mac uses Apple Silicon and the configured Fargate runtime expected AMD64.

## Code-reading curriculum

### Lesson 1: Local application

Read:

- app.py
- backend/services/auth_service.py
- backend/observability.py
- frontend/src/pages/login.jsx
- frontend/src/components/feed.jsx
- frontend/src/components/WeatherWidget.jsx
- frontend/src/components/DeploymentDemo.jsx

Questions:

1. Where is the demo user created?
2. Why does the demo button still call /login?
3. Where is Blue or Green initially selected?
4. Which behavior is simulated?
5. Why is the trace example collapsed?

### Lesson 2: Trace one request

Follow GET /posts:

~~~text
React fetch
  -> Flask route
  -> OpenTelemetry Flask instrumentation
  -> SQLAlchemy
  -> JSON response
  -> after_request log
  -> stdout/stderr
  -> awslogs
  -> CloudWatch
~~~

Exercise: draw this without looking. Identify where trace context is created and where IDs are added to the log.

### Lesson 3: Container lifecycle

Explain before running:

- docker build
- docker run
- docker tag
- docker push

For each, identify local changes, network effects, registry effects, and potential cost.

### Lesson 4: ECS runtime

Design a task definition on paper containing:

- Immutable image tag
- CPU and memory
- Container port
- Environment variables
- CloudWatch logging
- Health check
- Architecture

Then explain why registering it does not start a task.

### Lesson 5: Real Blue/Green routing

~~~text
                  -> Blue target group -> Blue ECS tasks
Internet -> ALB
                  -> Green target group -> Green ECS tasks
~~~

Questions:

1. Which component receives the public request first?
2. What is registered as a target?
3. What makes a target healthy?
4. What changes when traffic moves to Green?
5. What must rollback restore?

### Lesson 6: Observability signals

Compare:

- Log
- Trace span
- Metric
- Health check
- Alarm

Choose the best signal for:

- Did a request return 500?
- Which operation was slow?
- Is error rate rising?
- Can the ALB reach the container?
- Did the user see the broken interface?

### Lesson 7: Cost awareness

Before starting AWS resources, check:

- Desired task counts
- Running Fargate tasks
- ALB hourly cost
- NAT Gateway hourly and data costs
- CloudWatch retention
- Networking and public IP choices

After testing, verify that temporary resources have actually stopped.

## Practice exercises

### Beginner

1. Add deployment_color to request logs.
2. Configure slow-request threshold with an environment variable.
3. Add a /version endpoint returning an image version environment variable.
4. Write a test confirming /health returns 200.
5. Explain why passwords must never enter logs.

### Intermediate

1. Test demo-user creation and refresh behavior.
2. Add a request ID response header and compare it with trace ID.
3. Build separate Blue and Green frontend assets.
4. Build an image with an immutable Git commit tag.
5. Inspect a task definition and list every setting that must be preserved.

### AWS practice

Only use fresh state and explicit cost awareness:

1. List ECR image tags and digests.
2. Describe the cluster, services, tasks, and task definitions.
3. Temporarily run one task.
4. Verify its internal health check.
5. Find request_completed in CloudWatch.
6. Identify its trace ID.
7. Return desired count to zero and confirm no task remains.
8. Rebuild an ALB with Blue and Green target groups.
9. Preview Green and perform rollback.

## Hosting requirements for the next session

The goal is a public URL suitable for job applications.

Acceptance criteria:

- Stable HTTPS URL
- Disposable demo login works
- Simulated Blue/Green walkthrough works
- Same feed data in both views
- Green-only visible defect
- Collapsed example trace
- Clear rollback explanation
- No exposed secrets
- Understood cost and persistence behavior

Before choosing a host, compare:

- Static frontend hosting versus full-stack hosting
- Whether Flask must remain continuously available
- SQLite persistence across restarts and deployments
- HTTPS and custom-domain support
- Cold starts or sleep behavior
- Environment variable and secret handling
- Monthly cost and limits

## Teach-back checkpoint

I should eventually answer these without notes:

1. Why does source-code change require a new image?
2. What is the difference between ECR, a task definition, a task, and a service?
3. Why can Flask receive an internal request without an ALB?
4. Why is an ALB useful for real Blue/Green deployment?
5. How does a Flask log reach CloudWatch?
6. What does OpenTelemetry add?
7. Why can Green return 200 and still deserve rollback?
8. Why is the recruiter interface simulated?
9. Why should temporary desired count return to zero?
10. What database concerns matter before public hosting?

