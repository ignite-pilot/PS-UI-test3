import axios from 'axios';
import config from '../config';
import { Project, Frame, Component, ComponentCreate } from '../types';

// Determine base URL for API calls
// In production (unified service), use relative path /api
// In development, use full backend URL with /api
const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  return config.backendUrl ? `${config.backendUrl}/api` : 'http://localhost:8601/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Project APIs
export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get<Project[]>('/projects');
  return response.data;
};

export const getProject = async (id: number): Promise<Project> => {
  const response = await api.get<Project>(`/projects/${id}`);
  return response.data;
};

export const createProject = async (name: string): Promise<Project> => {
  console.log('API: createProject called with name:', name);
  console.log('API: baseURL:', api.defaults.baseURL);
  try {
    const response = await api.post<Project>('/projects', { name });
    console.log('API: createProject response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API: createProject error:', error);
    console.error('API: Error response:', error?.response);
    throw error;
  }
};

export const updateProject = async (id: number, name: string): Promise<Project> => {
  const response = await api.put<Project>(`/projects/${id}`, { name });
  return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

// Frame APIs
export const getFrames = async (projectId?: number): Promise<Frame[]> => {
  const params = projectId ? { project_id: projectId } : {};
  const response = await api.get<Frame[]>('/frames', { params });
  return response.data;
};

export const getFrame = async (id: number): Promise<Frame> => {
  const response = await api.get<Frame>(`/frames/${id}`);
  return response.data;
};

export const createFrame = async (name: string, projectId: number): Promise<Frame> => {
  const response = await api.post<Frame>('/frames', { name, project_id: projectId });
  return response.data;
};

export const updateFrame = async (id: number, name: string): Promise<Frame> => {
  const response = await api.put<Frame>(`/frames/${id}`, { name });
  return response.data;
};

export const deleteFrame = async (id: number): Promise<void> => {
  await api.delete(`/frames/${id}`);
};

// Component APIs
export const createComponent = async (component: ComponentCreate): Promise<Component> => {
  const response = await api.post<Component>('/components', component);
  return response.data;
};

export const updateComponent = async (
  id: number,
  updates: Partial<Component>
): Promise<Component> => {
  const response = await api.put<Component>(`/components/${id}`, updates);
  return response.data;
};

export const deleteComponent = async (id: number): Promise<void> => {
  await api.delete(`/components/${id}`);
};

export default api;

