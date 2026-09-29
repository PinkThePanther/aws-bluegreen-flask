FROM node:22-alpine AS frontend-build

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ARG VITE_DEPLOYMENT_COLOR=blue
ARG VITE_API_URL=
ENV VITE_DEPLOYMENT_COLOR=${VITE_DEPLOYMENT_COLOR}
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build


FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY backend ./backend
COPY --from=frontend-build /frontend/dist ./frontend/dist
RUN mkdir -p instance

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
  CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.getenv('PORT', '8080') + '/health', timeout=5)" || exit 1

CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT:-8080} app:app"]
