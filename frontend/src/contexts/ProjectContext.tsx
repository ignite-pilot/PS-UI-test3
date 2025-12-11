import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project } from '../types';
import * as api from '../services/api';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  refreshProjects: () => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (name: string) => Promise<Project>;
  updateProject: (id: number, name: string) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  loadProject: (projectId: number) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshProjects = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedProjects = await api.getProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const createProjectHandler = useCallback(async (name: string): Promise<Project> => {
    console.log('ProjectContext: createProjectHandler called with name:', name);
    try {
      const newProject = await api.createProject(name);
      console.log('ProjectContext: Project created:', newProject);
      await refreshProjects();
      console.log('ProjectContext: Projects refreshed');
      return newProject;
    } catch (error) {
      console.error('ProjectContext: createProjectHandler error:', error);
      throw error;
    }
  }, [refreshProjects]);

  const updateProjectHandler = useCallback(async (id: number, name: string): Promise<void> => {
    await api.updateProject(id, name);
    await refreshProjects();
    if (currentProject && currentProject.id === id) {
      const updatedProject = await api.getProject(id);
      setCurrentProject(updatedProject);
    }
  }, [refreshProjects, currentProject]);

  const deleteProjectHandler = useCallback(async (id: number): Promise<void> => {
    await api.deleteProject(id);
    await refreshProjects();
    if (currentProject && currentProject.id === id) {
      setCurrentProject(null);
    }
  }, [refreshProjects, currentProject]);

  const loadProject = useCallback(async (projectId: number): Promise<void> => {
    try {
      const project = await api.getProject(projectId);
      setCurrentProject(project);
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        loading,
        refreshProjects,
        setCurrentProject,
        createProject: createProjectHandler,
        updateProject: updateProjectHandler,
        deleteProject: deleteProjectHandler,
        loadProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
