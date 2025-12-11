"""
Main FastAPI application
"""
import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import crud, schemas, models
from app.database import get_db, engine
from app.config import get_settings

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create tables
try:
    models.Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {str(e)}", exc_info=True)

settings = get_settings()

app = FastAPI(
    title="Plant Simulation UI API",
    description="Backend API for Plant Simulation UI",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "plant-simulation-ui-api"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler to ensure CORS headers are always sent"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers={
            "Access-Control-Allow-Origin": settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )


# Project endpoints
@app.post("/api/projects", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    """Create a new project"""
    try:
        logger.info(f"Creating project with name: {project.name}")
        result = crud.create_project(db=db, project=project)
        logger.info(f"Project created successfully with id: {result.id}")
        return result
    except Exception as e:
        logger.error(f"Failed to create project: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"프로젝트 생성 중 오류가 발생했습니다: {str(e)}")


@app.get("/api/projects", response_model=list[schemas.ProjectResponse])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all projects"""
    projects = crud.get_projects(db=db, skip=skip, limit=limit)
    return projects


@app.get("/api/projects/{project_id}", response_model=schemas.ProjectResponse)
def read_project(project_id: int, db: Session = Depends(get_db)):
    """Get project by ID"""
    project = crud.get_project(db=db, project_id=project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.put("/api/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    """Update project"""
    project = crud.update_project(db=db, project_id=project_id, project_update=project_update)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    """Delete project"""
    success = crud.delete_project(db=db, project_id=project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}


# Frame endpoints
@app.post("/api/frames", response_model=schemas.FrameResponse)
def create_frame(frame: schemas.FrameCreate, db: Session = Depends(get_db)):
    """Create a new frame"""
    return crud.create_frame(db=db, frame=frame)


@app.get("/api/frames", response_model=list[schemas.FrameResponse])
def read_frames(skip: int = 0, limit: int = 100, project_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Get all frames, optionally filtered by project_id"""
    frames = crud.get_frames(db=db, skip=skip, limit=limit, project_id=project_id)
    return frames


@app.get("/api/frames/{frame_id}", response_model=schemas.FrameResponse)
def read_frame(frame_id: int, db: Session = Depends(get_db)):
    """Get frame by ID"""
    frame = crud.get_frame(db=db, frame_id=frame_id)
    if frame is None:
        raise HTTPException(status_code=404, detail="Frame not found")
    return frame


@app.put("/api/frames/{frame_id}", response_model=schemas.FrameResponse)
def update_frame(frame_id: int, frame_update: schemas.FrameUpdate, db: Session = Depends(get_db)):
    """Update frame"""
    frame = crud.update_frame(db=db, frame_id=frame_id, frame_update=frame_update)
    if frame is None:
        raise HTTPException(status_code=404, detail="Frame not found")
    return frame


@app.delete("/api/frames/{frame_id}")
def delete_frame(frame_id: int, db: Session = Depends(get_db)):
    """Delete frame"""
    success = crud.delete_frame(db=db, frame_id=frame_id)
    if not success:
        raise HTTPException(status_code=404, detail="Frame not found")
    return {"message": "Frame deleted successfully"}


# Component endpoints
@app.post("/api/components", response_model=schemas.ComponentResponse)
def create_component(component: schemas.ComponentCreate, db: Session = Depends(get_db)):
    """Create a new component"""
    # Verify frame exists
    frame = crud.get_frame(db=db, frame_id=component.frame_id)
    if frame is None:
        raise HTTPException(status_code=404, detail="Frame not found")
    return crud.create_component(db=db, component=component)


@app.get("/api/components/{component_id}", response_model=schemas.ComponentResponse)
def read_component(component_id: int, db: Session = Depends(get_db)):
    """Get component by ID"""
    component = crud.get_component(db=db, component_id=component_id)
    if component is None:
        raise HTTPException(status_code=404, detail="Component not found")
    return component


@app.get("/api/frames/{frame_id}/components", response_model=list[schemas.ComponentResponse])
def read_frame_components(frame_id: int, db: Session = Depends(get_db)):
    """Get all components for a frame"""
    # Verify frame exists
    frame = crud.get_frame(db=db, frame_id=frame_id)
    if frame is None:
        raise HTTPException(status_code=404, detail="Frame not found")
    return crud.get_components_by_frame(db=db, frame_id=frame_id)


@app.put("/api/components/{component_id}", response_model=schemas.ComponentResponse)
def update_component(
    component_id: int,
    component_update: schemas.ComponentUpdate,
    db: Session = Depends(get_db)
):
    """Update component"""
    component = crud.update_component(
        db=db, component_id=component_id, component_update=component_update
    )
    if component is None:
        raise HTTPException(status_code=404, detail="Component not found")
    return component


@app.delete("/api/components/{component_id}")
def delete_component(component_id: int, db: Session = Depends(get_db)):
    """Delete component"""
    success = crud.delete_component(db=db, component_id=component_id)
    if not success:
        raise HTTPException(status_code=404, detail="Component not found")
    return {"message": "Component deleted successfully"}


# Serve static files (frontend)
# Get the path to the frontend build directory
BASE_DIR = Path(__file__).parent.parent.parent
FRONTEND_BUILD_DIR = BASE_DIR / "frontend" / "build"

logger.info(f"Checking for frontend build at: {FRONTEND_BUILD_DIR}")

# Mount static files if build directory exists
if FRONTEND_BUILD_DIR.exists() and (FRONTEND_BUILD_DIR / "index.html").exists():
    logger.info("Frontend build found. Mounting static files...")
    
    # Serve static assets (JS, CSS, images, etc.)
    static_dir = FRONTEND_BUILD_DIR / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
        logger.info(f"Static files mounted at /static from {static_dir}")
    
    # Serve index.html for root and all non-API routes
    @app.get("/")
    async def serve_root():
        """Serve React app root"""
        index_path = FRONTEND_BUILD_DIR / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        else:
            raise HTTPException(status_code=404, detail="Frontend index.html not found")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve React app for all non-API routes"""
        # Don't serve frontend for API routes
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Check if it's a static file request (should be handled by /static mount)
        if full_path.startswith("static"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Serve index.html for all other routes (React Router)
        index_path = FRONTEND_BUILD_DIR / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        else:
            raise HTTPException(status_code=404, detail="Frontend not built. Run 'npm run build' in frontend directory.")
else:
    logger.warning(f"Frontend build directory not found at {FRONTEND_BUILD_DIR} or index.html missing. Frontend will not be served.")
    logger.warning(f"Please run: cd frontend && npm run build")

