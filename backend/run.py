#!/usr/bin/env python3
"""
Run the FastAPI application
"""
import uvicorn
from app.config import get_settings

settings = get_settings()

if __name__ == "__main__":
    port = int(settings.BACKEND_DOMAIN.split(":")[-1])
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )

