"""
Migration script to add projects table and update frames table
"""
import sys
from sqlalchemy import text
from app.database import engine

def migrate():
    """Run migration to add projects table"""
    with engine.connect() as conn:
        try:
            # Check if projects table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'projects'
                );
            """))
            projects_exists = result.scalar()
            
            if not projects_exists:
                print("Creating projects table...")
                # Create projects table
                conn.execute(text("""
                    CREATE TABLE projects (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE
                    );
                """))
                
                # Create index on name
                conn.execute(text("CREATE INDEX ix_projects_name ON projects(name);"))
                
                # Create index on id
                conn.execute(text("CREATE INDEX ix_projects_id ON projects(id);"))
                
                print("Projects table created successfully.")
            else:
                print("Projects table already exists.")
            
            # Check if frames table has project_id column
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'frames' 
                    AND column_name = 'project_id'
                );
            """))
            project_id_exists = result.scalar()
            
            if not project_id_exists:
                print("Adding project_id column to frames table...")
                
                # First, create a default project if none exists
                result = conn.execute(text("SELECT COUNT(*) FROM projects;"))
                project_count = result.scalar()
                
                if project_count == 0:
                    print("Creating default project...")
                    conn.execute(text("""
                        INSERT INTO projects (name) VALUES ('Default Project');
                    """))
                    conn.commit()
                
                # Get the first project ID
                result = conn.execute(text("SELECT id FROM projects LIMIT 1;"))
                default_project_id = result.scalar()
                
                # Add project_id column with default value
                conn.execute(text(f"""
                    ALTER TABLE frames 
                    ADD COLUMN project_id INTEGER;
                """))
                
                # Set default project_id for existing frames
                conn.execute(text(f"""
                    UPDATE frames 
                    SET project_id = {default_project_id} 
                    WHERE project_id IS NULL;
                """))
                
                # Make project_id NOT NULL and add foreign key constraint
                conn.execute(text("""
                    ALTER TABLE frames 
                    ALTER COLUMN project_id SET NOT NULL;
                """))
                
                conn.execute(text("""
                    ALTER TABLE frames 
                    ADD CONSTRAINT fk_frames_project_id 
                    FOREIGN KEY (project_id) REFERENCES projects(id);
                """))
                
                # Create index on project_id
                conn.execute(text("CREATE INDEX ix_frames_project_id ON frames(project_id);"))
                
                print("project_id column added to frames table successfully.")
            else:
                print("project_id column already exists in frames table.")
            
            conn.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"Migration failed: {str(e)}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    migrate()
