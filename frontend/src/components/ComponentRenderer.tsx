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

  // 디버깅: 매 프레임마다 도형 상태 확인
  useFrame(() => {
    if (meshRef.current && !debugLoggedRef.current) {
      const mesh = meshRef.current;
      const worldPos = new Vector3();
      mesh.getWorldPosition(worldPos);
      
      const orthoCamera = camera as any;
      const cameraLeft = orthoCamera.left ?? -5;
      const cameraRight = orthoCamera.right ?? 5;
      const cameraTop = orthoCamera.top ?? 5;
      const cameraBottom = orthoCamera.bottom ?? -5;
      
      console.log('=== Component Debug Info ===');
      console.log('Component:', component.type, 'ID:', component.id);
      console.log('Component position (x, y):', component.x, component.y);
      console.log('Mesh world position:', worldPos);
      console.log('Mesh local position:', mesh.position);
      console.log('Mesh rotation:', mesh.rotation);
      console.log('Mesh visible:', mesh.visible);
      console.log('Mesh scale:', mesh.scale);
      console.log('Mesh geometry:', mesh.geometry);
      console.log('Mesh material:', mesh.material);
      console.log('Camera position:', camera.position);
      console.log('Camera rotation:', camera.rotation);
      console.log('Camera bounds:', { left: cameraLeft, right: cameraRight, top: cameraTop, bottom: cameraBottom });
      console.log('Component size:', component.width, component.height);
      console.log('Is in view:', 
        component.x >= cameraLeft && component.x <= cameraRight &&
        component.y >= cameraBottom && component.y <= cameraTop
      );
      console.log('===========================');
      
      debugLoggedRef.current = true;
    }
  });

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
    console.log('renderShape called for component:', component.type, component.id);
    // 도형이 잘 보이도록 색상을 더 진하게 조정
    const color = isSelected ? '#0000ff' : '#ff0000'; // 빨간색/파란색으로 변경하여 가시성 향상
    let width = component.width;
    let height = component.height;
    let posX = component.x;
    // Y 좌표는 이미 올바르게 계산되었으므로 반전하지 않음
    let posY = component.y;

    console.log('renderShape - initial values:', { width, height, posX, posY, color });
    
    // 빨간 테스트 사각형과 동일한 방식으로 렌더링하기 위해 위치와 크기를 확인
    console.log('Comparing with test square - test square: position [0, 0, 10], size [4, 4]');
    console.log('This shape: position [', posX, posY, 10, '], size will be calculated');

    // 크기와 위치 검증
    if (width <= 0 || height <= 0) {
      console.warn('Component has invalid size:', { width, height, component });
      return null;
    }

    // 원본 크기를 그대로 사용 (줌은 카메라가 처리하므로 별도 보정 불필요)
    // 최소 크기만 보장
    const originalWidth = width;
    const originalHeight = height;
    width = Math.max(width, 0.1); // 최소 크기 0.1만 보장
    height = Math.max(height, 0.1);
    
    // 디버깅: 크기 정보 항상 출력
    console.log('Component size calculation:', {
      original: [originalWidth, originalHeight],
      final: [width, height],
      componentId: component.id,
      componentType: component.type
    });

    // 위치는 그대로 사용 (카메라는 줌/팬으로 조정 가능)

    // 격자보다 앞에 보이도록 Z 위치를 더 높게 설정
    // 빨간 테스트 사각형과 동일한 Z 위치 사용 (10.0)
    const zPosition = 10.0;
    
    console.log('Final render values:', { posX, posY, zPosition, width, height, color, componentType: component.type });
    
    console.log('renderShape - before switch:', {
      type: component.type,
      position: [posX, posY, zPosition],
      size: [width, height],
      originalSize: [originalWidth, originalHeight],
      color,
      id: component.id
    });

    console.log('renderShape switch - component.type:', component.type, 'width:', width, 'height:', height);
    switch (component.type) {
      case 'circle':
        // planeGeometry를 사용하여 원을 사각형으로 렌더링
        const circleSize = Math.max(width, height);
        console.log('Rendering circle with size:', circleSize, 'at position:', [posX, posY, zPosition], 'color:', color);
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
        console.log('Rendering triangle with size:', [width, height], 'at position:', [posX, posY, zPosition]);
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
        console.log('Rendering rectangle with size:', [width, height], 'at position:', [posX, posY, zPosition]);
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
        console.warn('Unknown component type:', component.type);
        return null;
    }
  };

  const shapeElement = renderShape();
  
  // 도형이 렌더링되지 않는 경우 경고
  useEffect(() => {
    console.log('ComponentRenderer useEffect - shapeElement:', !!shapeElement, 'component:', component.type, component.id);
    console.log('shapeElement type:', shapeElement?.type, 'shapeElement props:', shapeElement?.props);
    if (!shapeElement) {
      console.error('Component shape not rendered - renderShape returned null:', component);
    } else {
      console.log('Component shape element created:', component.type, component.id);
    }
  }, [shapeElement, component]);

  console.log('ComponentRenderer return - shapeElement:', !!shapeElement, 'shapeElement type:', typeof shapeElement, 'component:', component.type, component.id);
  console.log('shapeElement:', shapeElement);
  
  if (!shapeElement) {
    console.error('ComponentRenderer: shapeElement is null, returning null');
    return null;
  }
  
  // shapeElement가 React 요소인지 확인하고 직접 반환
  // 빨간 사각형처럼 직접 렌더링되도록 함
  return shapeElement;
};

export default ComponentRenderer;

