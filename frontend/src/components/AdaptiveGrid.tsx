import React, { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useMemo } from 'react';
import { BufferGeometry, BufferAttribute, LineSegments, LineBasicMaterial } from 'three';

const AdaptiveGrid: React.FC = () => {
  const { camera } = useThree();
  const lastZoomRef = useRef<number>(-1);
  const [gridSize, setGridSize] = useState(10);
  const [divisions, setDivisions] = useState(50); // 이미지처럼 더 세밀한 격자를 위해 초기값 증가
  const initializedRef = useRef<boolean>(false);
  const geometryRef = useRef<BufferGeometry | null>(null);
  const lineSegmentsRef = useRef<LineSegments | null>(null);

  // 초기 카메라 값으로 격자 설정
  useEffect(() => {
    if (!camera) {
      console.log('AdaptiveGrid: Camera not available yet');
      return;
    }
    
    const zoom = (camera as any).zoom || 50;
    const orthoCamera = camera as any;
    
    const cameraLeft = orthoCamera.left ?? -5;
    const cameraRight = orthoCamera.right ?? 5;
    const cameraTop = orthoCamera.top ?? 5;
    const cameraBottom = orthoCamera.bottom ?? -5;
    
    const viewWidth = cameraRight - cameraLeft;
    const viewHeight = cameraTop - cameraBottom;
    const baseGridSize = Math.max(viewWidth, viewHeight);
    // 이미지처럼 더 세밀한 격자를 위해 더 많은 분할 사용
    // 줌에 따라 분할 수 조정: 기본 50개, 줌이 클수록 더 많게
    const newDivisions = Math.max(50, Math.min(200, Math.floor(50 + 50 * (zoom / 50))));
    
    console.log('AdaptiveGrid: Initial setup - zoom:', zoom, 'size:', baseGridSize, 'divisions:', newDivisions);
    console.log('AdaptiveGrid: Camera bounds:', { left: cameraLeft, right: cameraRight, top: cameraTop, bottom: cameraBottom });
    
    setGridSize(baseGridSize);
    setDivisions(newDivisions);
    lastZoomRef.current = zoom;
    initializedRef.current = true;
  }, [camera]);

  useFrame(() => {
    if (!camera || !initializedRef.current) {
      return;
    }
    
    const zoom = (camera as any).zoom || 50;
    const orthoCamera = camera as any;
    
    // 카메라의 실제 left/right/top/bottom 값 확인
    const cameraLeft = orthoCamera.left ?? -5;
    const cameraRight = orthoCamera.right ?? 5;
    const cameraTop = orthoCamera.top ?? 5;
    const cameraBottom = orthoCamera.bottom ?? -5;
    
    const viewWidth = cameraRight - cameraLeft;
    const viewHeight = cameraTop - cameraBottom;
    
    // 줌이 너무 작으면 (10 이하) 격자 업데이트 중단하여 성능 문제 방지
    if (zoom < 10) {
      return;
    }
    
    // 줌 변경 감지
    const shouldUpdate = Math.abs(zoom - lastZoomRef.current) > 1;
    
    if (shouldUpdate) {
      lastZoomRef.current = zoom;
      
      // 카메라의 실제 view size를 사용하여 격자 크기 설정
      const baseGridSize = Math.max(viewWidth, viewHeight);
      // 이미지처럼 더 세밀한 격자를 위해 더 많은 분할 사용
      // 줌이 클수록(확대) 더 많은 분할로 세밀한 격자 표시
      const newDivisions = Math.max(50, Math.min(200, Math.floor(50 + 50 * (zoom / 50))));
      
      setGridSize(baseGridSize);
      setDivisions(newDivisions);
      
      console.log('Grid updated - zoom:', zoom, 'size:', baseGridSize, 'divisions:', newDivisions, 'viewWidth:', viewWidth, 'viewHeight:', viewHeight);
    }
  });

  // WebGL 최적화: 모든 선을 하나의 BufferGeometry로 합쳐서 한 번의 draw call로 렌더링
  // 이미지처럼 보조격자와 주격자를 구분하여 렌더링
  const gridGeometry = useMemo(() => {
    if (divisions > 200 || gridSize <= 0) {
      console.log('Grid geometry skipped - divisions:', divisions, 'gridSize:', gridSize);
      return null;
    }
    
    console.log('Creating optimized grid geometry - gridSize:', gridSize, 'divisions:', divisions);
    
    // 기존 geometry 정리
    if (geometryRef.current) {
      geometryRef.current.dispose();
    }
    
    const halfSize = gridSize / 2;
    // 격자 셀 크기를 250배 줄이기 위해 divisions를 250배 늘림 (기존 1000배에서 4배 크게)
    // 실제로 그리는 선의 수도 충분히 늘려서 격자가 보이도록 함
    const effectiveDivisions = divisions * 250;
    const step = gridSize / effectiveDivisions; // 격자 셀 크기가 250배 작아짐 (기존 1000배에서 4배 크게)
    
    // 격자 크기를 4배 크게 하기 위해 renderDivisions를 1/4로 줄임 (renderStep이 자동으로 4배 커짐)
    // 실제로 그릴 선의 수는 성능을 고려하되 충분히 많게 (최대 5000개 선)
    const baseRenderDivisions = Math.min(effectiveDivisions, 5000);
    const renderDivisions = Math.floor(baseRenderDivisions / 4); // 4배 크게 하기 위해 1/4로 줄임
    const renderStep = gridSize / renderDivisions;
    
    console.log('Grid step calculation - effectiveDivisions:', effectiveDivisions, 'renderDivisions:', renderDivisions, 'step:', step, 'renderStep:', renderStep);
    
    const vertices: number[] = [];
    const colors: number[] = []; // 색상을 vertices와 함께 생성
    
    // 격자 라인 색을 더 진하게 조정:
    const minorGridColor = [0.5, 0.5, 0.5]; // #808080 - 진한 회색 (보조격자)
    const majorGridColor = [0.35, 0.35, 0.35]; // #595959 - 더 진한 회색 (주격자)
    const axisColor = [1, 0, 0]; // #ff0000 - 빨간색 (축선)
    
    // 주격자 간격 (10칸마다)
    const majorGridInterval = 10;
    
    // 그리드 선 생성
    // 수직선
    for (let i = 0; i <= renderDivisions; i++) {
      const x = -halfSize + i * renderStep;
      const isMajorGrid = i % majorGridInterval === 0;
      const color = isMajorGrid ? majorGridColor : minorGridColor;
      
      vertices.push(x, -halfSize, 0); // 시작점
      vertices.push(x, halfSize, 0);   // 끝점
      colors.push(...color, ...color); // 각 정점마다 색상
    }
    
    // 수평선
    for (let i = 0; i <= renderDivisions; i++) {
      const y = -halfSize + i * renderStep;
      const isMajorGrid = i % majorGridInterval === 0;
      const color = isMajorGrid ? majorGridColor : minorGridColor;
      
      vertices.push(-halfSize, y, 0); // 시작점
      vertices.push(halfSize, y, 0);   // 끝점
      colors.push(...color, ...color); // 각 정점마다 색상
    }
    
    // X축 선 (빨간색)
    vertices.push(-halfSize, 0, 0);
    vertices.push(halfSize, 0, 0);
    colors.push(...axisColor, ...axisColor);
    
    // Y축 선 (빨간색)
    vertices.push(0, -halfSize, 0);
    vertices.push(0, halfSize, 0);
    colors.push(...axisColor, ...axisColor);
    
    // BufferGeometry 생성
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new BufferAttribute(new Float32Array(colors), 3));
    
    // geometry 계산 범위 설정 (렌더링 최적화)
    geometry.computeBoundingSphere();
    
    geometryRef.current = geometry;
    
    console.log('Grid geometry created - vertices:', vertices.length / 3, 'lines:', vertices.length / 6, 'colors:', colors.length / 3);
    console.log('Grid bounds - halfSize:', halfSize, 'step:', step.toFixed(4), 'first vertex:', vertices.slice(0, 3), 'last vertex:', vertices.slice(-3));
    return geometry;
  }, [gridSize, divisions]);

  // LineSegments 객체 생성 (색상은 이미 geometry에 포함됨)
  const lineSegments = useMemo(() => {
    if (!gridGeometry) return null;
    
    // 기존 LineSegments 정리
    if (lineSegmentsRef.current) {
      const oldMaterial = lineSegmentsRef.current.material as LineBasicMaterial;
      oldMaterial.dispose();
      // geometry는 이미 geometryRef에서 관리되므로 여기서 dispose하지 않음
    }
    
    const vertexCount = gridGeometry.attributes.position.count;
    
    // LineSegments 객체 생성 - vertexColors 사용
    const material = new LineBasicMaterial({ 
      vertexColors: true,
      linewidth: 1, // WebGL에서는 linewidth가 제한적이지만 명시
      transparent: false,
      opacity: 1.0,
    });
    const lines = new LineSegments(gridGeometry, material);
    lineSegmentsRef.current = lines;
    
    // 위치 확인
    lines.position.set(0, 0, 0);
    
    console.log('LineSegments created - vertices:', vertexCount, 'position:', lines.position);
    console.log('Material vertexColors:', material.vertexColors, 'color attribute exists:', !!gridGeometry.attributes.color);
    return lines;
  }, [gridGeometry]);

  if (!lineSegments) {
    if (!initializedRef.current) {
      console.log('AdaptiveGrid: Not initialized yet');
    } else {
      console.log('AdaptiveGrid: No lineSegments to render, gridGeometry:', !!gridGeometry, 'gridSize:', gridSize, 'divisions:', divisions);
    }
    return null;
  }

  // React Three Fiber의 primitive를 사용하여 Three.js 객체 직접 렌더링
  return <primitive object={lineSegments} />;
};

export default AdaptiveGrid;

