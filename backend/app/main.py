"""
Main FastAPI application
"""
import logging

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app import crud, schemas, models
from app.database import get_db, engine
from app.config import get_settings

# Create tables
models.Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "plant-simulation-ui-api"}


# Frame endpoints
@app.post("/api/frames", response_model=schemas.FrameResponse)
def create_frame(frame: schemas.FrameCreate, db: Session = Depends(get_db)):
    """Create a new frame"""
    return crud.create_frame(db=db, frame=frame)


@app.get("/api/frames", response_model=list[schemas.FrameResponse])
def read_frames(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all frames"""
    frames = crud.get_frames(db=db, skip=skip, limit=limit)
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

