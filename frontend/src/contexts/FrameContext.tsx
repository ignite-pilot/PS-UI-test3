import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Frame, Component } from '../types';
import * as api from '../services/api';

interface FrameContextType {
  frames: Frame[];
  activeFrameId: number | null;
  openFrameIds: number[];
  selectedComponentId: number | null;
  loading: boolean;
  refreshFrames: () => Promise<void>;
  setActiveFrame: (frameId: number) => void;
  openFrame: (frameId: number) => void;
  closeFrame: (frameId: number) => void;
  createFrame: (name: string) => Promise<Frame>;
  updateFrame: (id: number, name: string) => Promise<void>;
  deleteFrame: (id: number) => Promise<void>;
  createComponent: (component: Omit<Component, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateComponent: (id: number, updates: Partial<Component>) => Promise<void>;
  deleteComponent: (id: number) => Promise<void>;
  setSelectedComponentId: (componentId: number | null) => void;
}

const FrameContext = createContext<FrameContextType | undefined>(undefined);

export const FrameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [activeFrameId, setActiveFrameId] = useState<number | null>(null);
  const [openFrameIds, setOpenFrameIds] = useState<number[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshFrames = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedFrames = await api.getFrames();
      setFrames(fetchedFrames);
    } catch (error) {
      console.error('Failed to fetch frames:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFrames();
  }, [refreshFrames]);

  const setActiveFrame = useCallback((frameId: number) => {
    setActiveFrameId(frameId);
    if (!openFrameIds.includes(frameId)) {
      setOpenFrameIds([...openFrameIds, frameId]);
    }
  }, [openFrameIds]);

  const openFrame = useCallback((frameId: number) => {
    if (!openFrameIds.includes(frameId)) {
      setOpenFrameIds([...openFrameIds, frameId]);
    }
    setActiveFrameId(frameId);
  }, [openFrameIds]);

  const closeFrame = useCallback((frameId: number) => {
    setOpenFrameIds(openFrameIds.filter(id => id !== frameId));
    if (activeFrameId === frameId) {
      const remaining = openFrameIds.filter(id => id !== frameId);
      setActiveFrameId(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  }, [openFrameIds, activeFrameId]);

  const createFrame = useCallback(async (name: string): Promise<Frame> => {
    const newFrame = await api.createFrame(name);
    await refreshFrames();
    return newFrame;
  }, [refreshFrames]);

  const updateFrame = useCallback(async (id: number, name: string): Promise<void> => {
    await api.updateFrame(id, name);
    await refreshFrames();
  }, [refreshFrames]);

  const deleteFrame = useCallback(async (id: number): Promise<void> => {
    await api.deleteFrame(id);
    await refreshFrames();
    closeFrame(id);
  }, [refreshFrames, closeFrame]);

  const createComponent = useCallback(async (
    component: Omit<Component, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> => {
    await api.createComponent({
      frame_id: component.frame_id,
      name: component.name,
      type: component.type,
      x: component.x,
      y: component.y,
      width: component.width,
      height: component.height,
      properties: component.properties || {},
    });
    await refreshFrames();
  }, [refreshFrames]);

  const updateComponent = useCallback(async (
    id: number,
    updates: Partial<Component>
  ): Promise<void> => {
    await api.updateComponent(id, updates);
    await refreshFrames();
  }, [refreshFrames]);

  const deleteComponent = useCallback(async (id: number): Promise<void> => {
    await api.deleteComponent(id);
    await refreshFrames();
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
  }, [refreshFrames, selectedComponentId]);

  return (
    <FrameContext.Provider
      value={{
        frames,
        activeFrameId,
        openFrameIds,
        selectedComponentId,
        loading,
        refreshFrames,
        setActiveFrame,
        openFrame,
        closeFrame,
        createFrame,
        updateFrame,
        deleteFrame,
        createComponent,
        updateComponent,
        deleteComponent,
        setSelectedComponentId,
      }}
    >
      {children}
    </FrameContext.Provider>
  );
};

export const useFrames = () => {
  const context = useContext(FrameContext);
  if (context === undefined) {
    throw new Error('useFrames must be used within a FrameProvider');
  }
  return context;
};

