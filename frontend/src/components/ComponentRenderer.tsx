import React, { useRef, useState, useEffect } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { Component } from '../types';

// React Three Fiber에서 mesh를 직접 사용할 수 있도록 확인

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
  const { camera } = useThree();
  const debugLoggedRef = useRef(false);


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

  // triangleGeometry와 circleGeometry는 더 이상 사용하지 않음 - planeGeometry로 대체

  const renderShape = () => {
    // 도형이 잘 보이도록 색상을 더 진하게 조정
    const color = isSelected ? '#0000ff' : '#ff0000'; // 빨간색/파란색으로 변경하여 가시성 향상
    let width = component.width;
    let height = component.height;
    let posX = component.x;
    // Y 좌표는 이미 올바르게 계산되었으므로 반전하지 않음
    let posY = component.y;

    // 크기와 위치 검증
    if (width <= 0 || height <= 0) {
      return null;
    }

    // 원본 크기를 그대로 사용 (줌은 카메라가 처리하므로 별도 보정 불필요)
    // 최소 크기만 보장
    width = Math.max(width, 0.1); // 최소 크기 0.1만 보장
    height = Math.max(height, 0.1);

    // 위치는 그대로 사용 (카메라는 줌/팬으로 조정 가능)

    // 격자보다 앞에 보이도록 Z 위치를 더 높게 설정
    // 빨간 테스트 사각형과 동일한 Z 위치 사용 (10.0)
    const zPosition = 10.0;
    switch (component.type) {
      case 'circle':
        // planeGeometry를 사용하여 원을 사각형으로 렌더링
        const circleSize = Math.max(width, height);
        return (
          <mesh 
            key={`circle-${component.id}`}
            ref={meshRef} 
            position={[posX, posY, zPosition]} 
            visible={true}
            renderOrder={1000}
          >
            <planeGeometry args={[circleSize, circleSize]} />
            <meshBasicMaterial color={color} side={2} depthTest={true} />
          </mesh>
        );
      case 'triangle': {
        // planeGeometry를 사용하여 삼각형을 사각형으로 렌더링
        // 나중에 삼각형 모양 텍스처나 다른 방법으로 개선 가능
        return (
          <mesh 
            ref={meshRef} 
            position={[posX, posY, zPosition]} 
            visible={true}
            renderOrder={1000}
          >
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial color={color} side={2} depthTest={true} />
          </mesh>
        );
      }
      case 'rectangle': {
        // planeGeometry는 기본적으로 XY 평면에 있음
        // orthographic 카메라가 Z축을 향하므로 XY 평면의 도형이 보여야 함
        return (
          <mesh 
            ref={meshRef} 
            position={[posX, posY, zPosition]}
            visible={true}
            renderOrder={1000}
          >
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial color={color} side={2} depthTest={true} />
          </mesh>
        );
      }
      case 'connection':
        // Connection lines will be handled separately
        return null;
      default:
        return null;
    }
  };

  const shapeElement = renderShape();
  
  if (!shapeElement) {
    return null;
  }
  
  // shapeElement가 React 요소인지 확인하고 직접 반환
  // 빨간 사각형처럼 직접 렌더링되도록 함
  return shapeElement;
};

export default ComponentRenderer;

