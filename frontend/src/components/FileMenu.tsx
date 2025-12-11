import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useFrames } from '../contexts/FrameContext';
import './FileMenu.css';

interface FileMenuProps {
  onProjectChange?: () => void;
}

const FileMenu: React.FC<FileMenuProps> = ({ onProjectChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showOpenProjectDialog, setShowOpenProjectDialog] = useState(false);
  const [showManageProjectDialog, setShowManageProjectDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renamingProjectId, setRenamingProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.file-menu') && !target.closest('.dialog-overlay')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);
  
  const { 
    currentProject, 
    projects, 
    createProject, 
    updateProject,
    deleteProject,
    loadProject,
    refreshProjects,
    setCurrentProject
  } = useProject();
  const { refreshFrames } = useFrames();

  const handleNewProject = async () => {
    console.log('handleNewProject called, projectName:', projectName);
    const trimmedName = projectName?.trim() || '';
    console.log('Trimmed project name:', trimmedName, 'Length:', trimmedName.length);
    
    if (!trimmedName) {
      console.log('Project name is empty, showing alert');
      alert('프로젝트명을 입력해주세요.');
      return;
    }
    
    try {
      console.log('Creating project:', trimmedName);
      console.log('Calling createProject API...');
      const newProject = await createProject(trimmedName);
      console.log('Project created successfully:', newProject);
      console.log('Loading project:', newProject.id);
      await loadProject(newProject.id);
      console.log('Refreshing frames');
      await refreshFrames();
      console.log('Closing dialog and resetting state');
      setProjectName('');
      setShowNewProjectDialog(false);
      setIsMenuOpen(false);
      onProjectChange?.();
      console.log('Project creation completed');
    } catch (error: any) {
      console.error('Failed to create project - Full error:', error);
      console.error('Error response:', error?.response);
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
        console.error('Error detail from server:', errorMessage);
      } else if (error?.response?.data) {
        errorMessage = JSON.stringify(error.response.data);
        console.error('Error data from server:', error.response.data);
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code === 'ERR_NETWORK') {
        errorMessage = '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      }
      
      alert(`프로젝트 생성에 실패했습니다.\n\n오류: ${errorMessage}\n\n브라우저 콘솔을 확인해주세요.`);
    }
  };

  const handleOpenProject = async (projectId: number) => {
    try {
      await loadProject(projectId);
      await refreshFrames();
      setShowOpenProjectDialog(false);
      setIsMenuOpen(false);
      onProjectChange?.();
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('프로젝트 로드에 실패했습니다.');
    }
  };

  const handleRenameProject = async (projectId?: number) => {
    const targetProjectId = projectId || renamingProjectId || currentProject?.id;
    if (targetProjectId && projectName.trim()) {
      try {
        await updateProject(targetProjectId, projectName.trim());
        setProjectName('');
        setRenamingProjectId(null);
        setShowRenameDialog(false);
        await refreshProjects();
        if (currentProject && currentProject.id === targetProjectId) {
          await loadProject(targetProjectId);
        }
      } catch (error) {
        console.error('Failed to rename project:', error);
        alert('프로젝트 이름 변경에 실패했습니다.');
      }
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm('프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }
    
    try {
      await deleteProject(projectId);
      await refreshProjects();
      if (currentProject && currentProject.id === projectId) {
        // If deleted project was current, clear it
        setCurrentProject(null);
        await refreshFrames();
      }
      onProjectChange?.();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('프로젝트 삭제에 실패했습니다.');
    }
  };

  const handleOpenProjectFromManage = async (projectId: number) => {
    try {
      await loadProject(projectId);
      await refreshFrames();
      setShowManageProjectDialog(false);
      setIsMenuOpen(false);
      onProjectChange?.();
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('프로젝트 로드에 실패했습니다.');
    }
  };

  return (
    <>
      <div className="file-menu">
        <button 
          className={`file-menu-button ${isMenuOpen ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            console.log('File button clicked, isMenuOpen:', isMenuOpen);
            setIsMenuOpen(!isMenuOpen);
          }}
        >
          File
        </button>
        {isMenuOpen && (
          <div 
            className="file-menu-dropdown"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Dropdown clicked');
            }}
          >
            <div 
              className="file-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                console.log('New Project clicked');
                setProjectName(''); // Reset project name when opening dialog
                setShowNewProjectDialog(true);
                setIsMenuOpen(false);
              }}
            >
              New Project
            </div>
            <div 
              className="file-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                refreshProjects();
                setShowOpenProjectDialog(true);
                setIsMenuOpen(false);
              }}
            >
              Open Project
            </div>
            <div 
              className={`file-menu-item ${!currentProject ? 'disabled' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (currentProject) {
                  setRenamingProjectId(currentProject.id);
                  setProjectName(currentProject.name);
                  setShowRenameDialog(true);
                  setIsMenuOpen(false);
                }
              }}
            >
              Rename Project
            </div>
            <div 
              className="file-menu-item"
              onClick={(e) => {
                e.stopPropagation();
                refreshProjects();
                setShowManageProjectDialog(true);
                setIsMenuOpen(false);
              }}
            >
              Manage Project
            </div>
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      {showNewProjectDialog && (
        <div 
          className="dialog-overlay" 
          onClick={(e) => {
            console.log('Dialog overlay clicked');
            setShowNewProjectDialog(false);
          }}
        >
          <div className="dialog" onClick={(e) => {
            e.stopPropagation();
            console.log('Dialog content clicked');
          }}>
            <h3>New Project</h3>
            <input
              type="text"
              placeholder="프로젝트명을 입력하세요"
              value={projectName || ''}
              onChange={(e) => {
                const value = e.target.value;
                console.log('Input changed:', value, 'Length:', value.length);
                setProjectName(value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  console.log('Enter pressed, current projectName:', projectName);
                  e.preventDefault();
                  handleNewProject();
                }
              }}
              autoFocus
            />
            <div className="dialog-buttons">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Create button clicked');
                  handleNewProject();
                }}
              >
                생성
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Cancel button clicked');
                  setShowNewProjectDialog(false);
                  setProjectName('');
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Project Dialog */}
      {showOpenProjectDialog && (
        <div className="dialog-overlay" onClick={() => setShowOpenProjectDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Open Project</h3>
            <div className="project-list">
              {projects.length === 0 ? (
                <div className="empty-project-list">프로젝트가 없습니다.</div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`project-item ${currentProject?.id === project.id ? 'active' : ''}`}
                    onClick={() => handleOpenProject(project.id)}
                  >
                    {project.name}
                  </div>
                ))
              )}
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowOpenProjectDialog(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Project Dialog */}
      {showManageProjectDialog && (
        <div className="dialog-overlay" onClick={() => setShowManageProjectDialog(false)}>
          <div className="dialog manage-project-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Manage Projects</h3>
            <div className="project-list">
              {projects.length === 0 ? (
                <div className="empty-project-list">프로젝트가 없습니다.</div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`project-item-manage ${currentProject?.id === project.id ? 'active' : ''}`}
                  >
                    <div className="project-item-name">{project.name}</div>
                    <div className="project-item-actions">
                      <button
                        className="action-button open-button"
                        onClick={() => handleOpenProjectFromManage(project.id)}
                        title="Open Project"
                      >
                        열기
                      </button>
                      <button
                        className="action-button rename-button"
                        onClick={() => {
                          setRenamingProjectId(project.id);
                          setProjectName(project.name);
                          setShowRenameDialog(true);
                        }}
                        title="Rename Project"
                      >
                        이름변경
                      </button>
                      <button
                        className="action-button delete-button"
                        onClick={() => handleDeleteProject(project.id)}
                        title="Delete Project"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="dialog-buttons">
              <button onClick={() => setShowManageProjectDialog(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Project Dialog */}
      {showRenameDialog && (renamingProjectId || currentProject) && (
        <div className="dialog-overlay" onClick={() => {
          setShowRenameDialog(false);
          setRenamingProjectId(null);
          setProjectName('');
        }}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Rename Project</h3>
            <input
              type="text"
              placeholder="새 프로젝트명을 입력하세요"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleRenameProject();
                }
              }}
              autoFocus
            />
            <div className="dialog-buttons">
              <button onClick={() => handleRenameProject()}>변경</button>
              <button onClick={() => {
                setShowRenameDialog(false);
                setRenamingProjectId(null);
                setProjectName('');
              }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileMenu;
