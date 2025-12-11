import axios from 'axios';
import config from '../config';
import { Frame, Component, ComponentCreate } from '../types';

const api = axios.create({
  baseURL: config.backendUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Frame APIs
export const getFrames = async (): Promise<Frame[]> => {
  const response = await api.get<Frame[]>('/api/frames');
  return response.data;
};

export const getFrame = async (id: number): Promise<Frame> => {
  const response = await api.get<Frame>(`/api/frames/${id}`);
  return response.data;
};

export const createFrame = async (name: string): Promise<Frame> => {
  const response = await api.post<Frame>('/api/frames', { name });
  return response.data;
};

export const updateFrame = async (id: number, name: string): Promise<Frame> => {
  const response = await api.put<Frame>(`/api/frames/${id}`, { name });
  return response.data;
};

export const deleteFrame = async (id: number): Promise<void> => {
  await api.delete(`/api/frames/${id}`);
};

// Component APIs
export const createComponent = async (component: ComponentCreate): Promise<Component> => {
  const response = await api.post<Component>('/api/components', component);
  return response.data;
};

export const updateComponent = async (
  id: number,
  updates: Partial<Component>
): Promise<Component> => {
  const response = await api.put<Component>(`/api/components/${id}`, updates);
  return response.data;
};

export const deleteComponent = async (id: number): Promise<void> => {
  await api.delete(`/api/components/${id}`);
};

export default api;

