import React, { useRef, useState, useMemo } from 'react';
import { Mesh, Vector3, Shape, ShapeGeometry } from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Component } from '../types';

interface ComponentRendererProps {
  component: Component;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Component>) => void;
  onDelete: () => void;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const meshRef = useRef<Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector3 | null>(null);

  // Position is now set directly in renderShape, so we don't need useFrame for position

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    if (e.nativeEvent) {
      setDragStart(new Vector3(e.nativeEvent.clientX, e.nativeEvent.clientY, 0));
    }
    onSelect();
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging && dragStart && meshRef.current && e.nativeEvent) {
      const deltaX = (e.nativeEvent.clientX - dragStart.x) * 0.5;
      const deltaY = -(e.nativeEvent.clientY - dragStart.y) * 0.5; // Invert Y
      onUpdate({
        x: component.x + deltaX,
        y: component.y + deltaY,
      });
      setDragStart(new Vector3(e.nativeEvent.clientX, e.nativeEvent.clientY, 0));
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleRename = () => {
    const newName = prompt('Enter new component name:', component.name);
    if (newName && newName.trim()) {
      onUpdate({ name: newName.trim() });
    }
  };

  const triangleGeometry = useMemo(() => {
    if (component.type !== 'triangle') return null;
    const shape = new Shape();
    const width = component.width;
    const height = component.height;
    shape.moveTo(0, height / 2);
    shape.lineTo(-width / 2, -height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.lineTo(0, height / 2);
    return new ShapeGeometry(shape);
  }, [component.type, component.width, component.height]);

  const renderShape = () => {
    // 도형이 잘 보이도록 색상을 더 진하게 조정
    const color = isSelected ? '#4a90e2' : '#333333'; // 더 진한 회색으로 변경
    const width = component.width;
    const height = component.height;
    const posX = component.x;
    // Y 좌표는 이미 올바르게 계산되었으므로 반전하지 않음
    const posY = component.y;

    // 크기와 위치 검증
    if (width <= 0 || height <= 0) {
      console.warn('Component has invalid size:', { width, height, component });
      return null;
    }

    console.log('Rendering component:', component.type, 'at', posX, posY, 'size', width, height, 'color:', color);

    // 격자보다 앞에 보이도록 Z 위치를 더 높게 설정
    // 격자가 Z=0에 있으므로 도형은 Z=1.0 이상에 위치해야 함
    const zPosition = 1.0;
    
    // 디버깅: 도형 정보 출력
    console.log('Component render details:', {
      type: component.type,
      position: [posX, posY, zPosition],
      size: [width, height],
      color,
      id: component.id
    });

    switch (component.type) {
      case 'circle':
        // circleGeometry는 XY 평면에 생성되지만, orthographic 카메라가 Z축을 향하므로
        // 카메라가 보기 위해서는 YZ 평면으로 회전해야 함
        return (
          <mesh ref={meshRef} position={[posX, posY, zPosition]} rotation={[0, 0, 0]}>
            <circleGeometry args={[width / 2, 32]} />
            <meshBasicMaterial color={color} side={2} transparent={false} opacity={1} />
          </mesh>
        );
      case 'triangle':
        if (!triangleGeometry) return null;
        // ShapeGeometry는 이미 XY 평면에 있으므로 회전 불필요
        return (
          <mesh ref={meshRef} position={[posX, posY, zPosition]} geometry={triangleGeometry}>
            <meshBasicMaterial color={color} side={2} />
          </mesh>
        );
      case 'rectangle':
        // planeGeometry는 기본적으로 XY 평면에 있으므로 회전 불필요
        return (
          <mesh ref={meshRef} position={[posX, posY, zPosition]}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial color={color} side={2} />
          </mesh>
        );
      case 'connection':
        // Connection lines will be handled separately
        return null;
      default:
        return null;
    }
  };

  return (
    <group
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        // Context menu will be handled by FrameView
        const event = new CustomEvent('component-context-menu', {
          detail: { componentId: component.id, x: e.nativeEvent?.clientX || 0, y: e.nativeEvent?.clientY || 0 }
        });
        window.dispatchEvent(event);
      }}
    >
      {renderShape()}
    </group>
  );
};

export default ComponentRenderer;

