"""
Unit tests for main API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db, engine as app_engine

# Use SQLite file database for testing (in-memory doesn't work well with multiple connections)
import tempfile
import os
test_db_file = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
test_db_path = test_db_file.name
test_db_file.close()

SQLALCHEMY_DATABASE_URL = f"sqlite:///{test_db_path}"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Override the app's engine with test engine before importing app
app_engine.__dict__.update(test_engine.__dict__)

# Import app after engine override
from app.main import app  # noqa: E402
from app import models  # noqa: E402


@pytest.fixture(scope="function")
def db_session():
    """Create a test database session"""
    # Create tables before each test
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    """Clean up test database file after all tests"""
    yield
    if os.path.exists(test_db_path):
        os.unlink(test_db_path)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client"""
    # Ensure tables are created on the same engine
    Base.metadata.create_all(bind=test_engine)
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_frame(client):
    """Test frame creation"""
    response = client.post("/api/frames", json={"name": "Test Frame"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Frame"
    assert "id" in data


def test_get_frames(client):
    """Test getting all frames"""
    # Create a frame first
    client.post("/api/frames", json={"name": "Test Frame 1"})
    client.post("/api/frames", json={"name": "Test Frame 2"})
    
    response = client.get("/api/frames")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


def test_get_frame(client):
    """Test getting a specific frame"""
    # Create a frame
    create_response = client.post("/api/frames", json={"name": "Test Frame"})
    frame_id = create_response.json()["id"]
    
    # Get the frame
    response = client.get(f"/api/frames/{frame_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Frame"
    assert data["id"] == frame_id


def test_update_frame(client):
    """Test frame update"""
    # Create a frame
    create_response = client.post("/api/frames", json={"name": "Test Frame"})
    frame_id = create_response.json()["id"]
    
    # Update the frame
    response = client.put(f"/api/frames/{frame_id}", json={"name": "Updated Frame"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Frame"


def test_delete_frame(client):
    """Test frame deletion"""
    # Create a frame
    create_response = client.post("/api/frames", json={"name": "Test Frame"})
    frame_id = create_response.json()["id"]
    
    # Delete the frame
    response = client.delete(f"/api/frames/{frame_id}")
    assert response.status_code == 200
    
    # Verify it's deleted
    get_response = client.get(f"/api/frames/{frame_id}")
    assert get_response.status_code == 404


def test_create_component(client):
    """Test component creation"""
    # Create a frame first
    frame_response = client.post("/api/frames", json={"name": "Test Frame"})
    frame_id = frame_response.json()["id"]
    
    # Create a component
    component_data = {
        "frame_id": frame_id,
        "name": "Test Component",
        "type": "circle",
        "x": 100,
        "y": 200,
        "width": 50,
        "height": 50,
        "properties": {}
    }
    response = client.post("/api/components", json=component_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Component"
    assert data["type"] == "circle"
    assert "id" in data


def test_get_frame_components(client):
    """Test getting components for a frame"""
    # Create a frame
    frame_response = client.post("/api/frames", json={"name": "Test Frame"})
    frame_id = frame_response.json()["id"]
    
    # Create components
    component_data = {
        "frame_id": frame_id,
        "name": "Component 1",
        "type": "circle",
        "x": 0,
        "y": 0,
        "width": 50,
        "height": 50,
        "properties": {}
    }
    client.post("/api/components", json=component_data)
    
    component_data["name"] = "Component 2"
    client.post("/api/components", json=component_data)
    
    # Get components
    response = client.get(f"/api/frames/{frame_id}/components")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_update_component(client):
    """Test component update"""
    # Create frame and component
    frame_response = client.post("/api/frames", json={"name": "Test Frame"})
    frame_id = frame_response.json()["id"]
    
    component_response = client.post("/api/components", json={
        "frame_id": frame_id,
        "name": "Test Component",
        "type": "circle",
        "x": 0,
        "y": 0,
        "width": 50,
        "height": 50,
        "properties": {}
    })
    component_id = component_response.json()["id"]
    
    # Update component
    response = client.put(f"/api/components/{component_id}", json={
        "name": "Updated Component",
        "x": 100,
        "y": 200
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Component"
    assert data["x"] == 100
    assert data["y"] == 200


def test_delete_component(client):
    """Test component deletion"""
    # Create frame and component
    frame_response = client.post("/api/frames", json={"name": "Test Frame"})
    frame_id = frame_response.json()["id"]
    
    component_response = client.post("/api/components", json={
        "frame_id": frame_id,
        "name": "Test Component",
        "type": "circle",
        "x": 0,
        "y": 0,
        "width": 50,
        "height": 50,
        "properties": {}
    })
    component_id = component_response.json()["id"]
    
    # Delete component
    response = client.delete(f"/api/components/{component_id}")
    assert response.status_code == 200
    
    # Verify it's deleted
    get_response = client.get(f"/api/components/{component_id}")
    assert get_response.status_code == 404

