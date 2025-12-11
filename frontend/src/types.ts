export interface Component {
  id: number;
  frame_id: number;
  name: string;
  type: 'circle' | 'triangle' | 'rectangle' | 'connection';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface Frame {
  id: number;
  name: string;
  created_at: string;
  updated_at?: string;
  components: Component[];
}

export interface ComponentCreate {
  frame_id: number;
  name: string;
  type: 'circle' | 'triangle' | 'rectangle' | 'connection';
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: Record<string, any>;
}

