# Multi-stage build for backend and frontend

# Backend stage
FROM python:3.11-slim as backend

WORKDIR /app/backend

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8601

CMD ["python", "run.py"]

