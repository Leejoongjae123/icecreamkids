"use client";
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { IoClose, IoRefresh } from "react-icons/io5";
import { TextStickerItem } from './types';
import { useTextStickerStore } from '@/hooks/store/useTextStickerStore';
import { cn } from '@/lib/utils';

interface DraggableTextStickerProps {
  sticker: TextStickerItem;
  containerRef: React.RefObject<HTMLDivElement>;
}

// 리사이즈 핸들 타입 정의
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';

const DraggableTextSticker: React.FC<DraggableTextStickerProps> = ({ sticker, containerRef }) => {
  const stickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [initialStickerState, setInitialStickerState] = useState({
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 },
    rotation: 0,
  });
  const [rotationStart, setRotationStart] = useState({ x: 0, y: 0 });
  const [initialRotation, setInitialRotation] = useState(0);

  const { 
    updateTextStickerPosition, 
    updateTextStickerSize,
    updateTextStickerRotation,
    removeTextSticker, 
    bringTextStickerToFront,
    updateTextStickerText
  } = useTextStickerStore();

  // 텍스트 길이와 스티커 크기에 따른 폰트 사이즈 계산
  const calculateFontSize = (
    textLength: number, 
    stickerWidth: number, 
    stickerHeight: number, 
    baseSize: number
  ): number => {
    // 텍스트 영역의 실제 크기 (말풍선의 경우 60%, 기본의 경우 100%)
    const effectiveWidth = sticker.type === 'bubble' ? stickerWidth * 0.6 : stickerWidth;
    const effectiveHeight = sticker.type === 'bubble' ? stickerHeight * 0.6 : stickerHeight;
    
    // 텍스트가 비어있으면 기본 크기 반환
    if (textLength === 0) {
      return baseSize;
    }
    
    // 영역 기반 폰트 크기 계산 (영역이 클수록 큰 폰트)
    const areaBasedSize = Math.min(effectiveWidth, effectiveHeight) / 8;
    
    // 텍스트 길이 기반 폰트 크기 계산 (텍스트가 길수록 작은 폰트)
    const lengthBasedSize = Math.max(12, Math.min(24, effectiveWidth / (textLength * 0.6)));
    
    // 두 값 중 작은 값을 선택하되, 최소/최대 제한 적용
    const calculatedSize = Math.min(areaBasedSize, lengthBasedSize);
    
    // 최소 10px, 최대 32px로 제한
    return Math.max(10, Math.min(32, calculatedSize));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || !stickerRef.current || isEditing) {
      return;
    }

    bringTextStickerToFront(sticker.id);
    setIsSelected(true);
    setIsDragging(true);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    setDragStart({ x: mouseX, y: mouseY });
    setInitialPosition(sticker.position);
  };

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || !stickerRef.current) {
      return;
    }

    bringTextStickerToFront(sticker.id);
    setIsSelected(true);

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    if (handle === 'rotate') {
      setIsRotating(true);
      const centerX = sticker.position.x + sticker.size.width / 2;
      const centerY = sticker.position.y + sticker.size.height / 2;
      setRotationStart({
        x: mouseX - centerX,
        y: mouseY - centerY,
      });
      setInitialRotation(sticker.rotation);
    } else {
      setIsResizing(true);
      setResizeHandle(handle);
      setResizeStart({ x: mouseX, y: mouseY });
      setInitialStickerState({
        position: sticker.position,
        size: sticker.size,
        rotation: sticker.rotation,
      });
    }
  }, [containerRef, sticker, bringTextStickerToFront]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) {
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    if (isDragging) {
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;

      const newX = initialPosition.x + deltaX;
      const newY = initialPosition.y + deltaY;

      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const clampedX = Math.max(0, Math.min(newX, containerWidth - sticker.size.width));
      const clampedY = Math.max(0, Math.min(newY, containerHeight - sticker.size.height));
      updateTextStickerPosition(sticker.id, { x: clampedX, y: clampedY });
    } else if (isResizing && resizeHandle) {
      handleResize(mouseX, mouseY);
    } else if (isRotating) {
      handleRotation(mouseX, mouseY);
    }
  }, [containerRef, isDragging, isResizing, isRotating, dragStart, initialPosition, resizeHandle, sticker.size.width, sticker.size.height, updateTextStickerPosition, sticker.id]);

  // 리사이즈 처리 함수 (8방향)
  const handleResize = useCallback((mouseX: number, mouseY: number) => {
    if (!resizeHandle) {
      return;
    }

    const deltaX = mouseX - resizeStart.x;
    const deltaY = mouseY - resizeStart.y;

    let newWidth = initialStickerState.size.width;
    let newHeight = initialStickerState.size.height;
    let newX = initialStickerState.position.x;
    let newY = initialStickerState.position.y;

    const minSize = 20;

    switch (resizeHandle) {
      case 'nw':
        newWidth = Math.max(minSize, initialStickerState.size.width - deltaX);
        newHeight = Math.max(minSize, initialStickerState.size.height - deltaY);
        newX = initialStickerState.position.x + (initialStickerState.size.width - newWidth);
        newY = initialStickerState.position.y + (initialStickerState.size.height - newHeight);
        break;
      case 'n':
        newHeight = Math.max(minSize, initialStickerState.size.height - deltaY);
        newY = initialStickerState.position.y + (initialStickerState.size.height - newHeight);
        break;
      case 'ne':
        newWidth = Math.max(minSize, initialStickerState.size.width + deltaX);
        newHeight = Math.max(minSize, initialStickerState.size.height - deltaY);
        newY = initialStickerState.position.y + (initialStickerState.size.height - newHeight);
        break;
      case 'e':
        newWidth = Math.max(minSize, initialStickerState.size.width + deltaX);
        break;
      case 'se':
        newWidth = Math.max(minSize, initialStickerState.size.width + deltaX);
        newHeight = Math.max(minSize, initialStickerState.size.height + deltaY);
        break;
      case 's':
        newHeight = Math.max(minSize, initialStickerState.size.height + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(minSize, initialStickerState.size.width - deltaX);
        newHeight = Math.max(minSize, initialStickerState.size.height + deltaY);
        newX = initialStickerState.position.x + (initialStickerState.size.width - newWidth);
        break;
      case 'w':
        newWidth = Math.max(minSize, initialStickerState.size.width - deltaX);
        newX = initialStickerState.position.x + (initialStickerState.size.width - newWidth);
        break;
    }

    // 컨테이너 경계 체크
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      newX = Math.max(0, Math.min(newX, containerWidth - newWidth));
      newY = Math.max(0, Math.min(newY, containerHeight - newHeight));
    }

    updateTextStickerSize(sticker.id, { width: newWidth, height: newHeight });
    updateTextStickerPosition(sticker.id, { x: newX, y: newY });
  }, [resizeHandle, resizeStart, initialStickerState, containerRef, updateTextStickerSize, updateTextStickerPosition, sticker.id]);

  // 회전 처리 함수
  const handleRotation = useCallback((mouseX: number, mouseY: number) => {
    const centerX = sticker.position.x + sticker.size.width / 2;
    const centerY = sticker.position.y + sticker.size.height / 2;

    const currentX = mouseX - centerX;
    const currentY = mouseY - centerY;

    const initialAngle = Math.atan2(rotationStart.y, rotationStart.x);
    const currentAngle = Math.atan2(currentY, currentX);

    const deltaAngle = (currentAngle - initialAngle) * (180 / Math.PI);
    const newRotation = (initialRotation + deltaAngle) % 360;

    updateTextStickerRotation(sticker.id, newRotation);
  }, [sticker.position.x, sticker.position.y, sticker.size.width, sticker.size.height, rotationStart, initialRotation, updateTextStickerRotation, sticker.id]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    setResizeHandle(null);
  }, []);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTextStickerText(sticker.id, e.target.value);
  };

  const handleTextBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (isSelected && e.key === 'Delete' && !isEditing) {
      removeTextSticker(sticker.id);
    }
    if (isEditing && e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleContainerClick = (e: Event) => {
    if (stickerRef.current && !stickerRef.current.contains(e.target as Node)) {
      setIsSelected(false);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleContainerClick);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleContainerClick);
    };
  }, [isSelected, isEditing]);

  // 텍스트 스타일 함수 - 텍스트 타입/저장된 스타일을 반영
  const getTextStyle = () => {
    if (sticker.type === 'basic') {
      const fallbackFontFamily =
        sticker.textType === 'title'
          ? 'MaplestoryOTFBold'
          : sticker.textType === 'subtitle'
          ? 'Uiyeun'
          : 'Arial';

      const fallbackFontSize =
        sticker.textType === 'title' ? 32 : sticker.textType === 'subtitle' ? 28 : 24;

      return {
        fontSize: `${sticker.fontSize || fallbackFontSize}px`,
        color: sticker.textType === 'subtitle' ? '#555' : sticker.textType === 'body' ? '#666' : '#333',
        fontFamily: sticker.fontFamily || fallbackFontFamily,
      } as React.CSSProperties;
    }
    
    // 말풍선 스타일 - 크기에 맞게 조절 (기존 로직 유지)
    const textLength = sticker.text.length || 1;
    const baseFontSize = 14;
    const calculatedSize = calculateFontSize(textLength, sticker.size.width, sticker.size.height, baseFontSize);
    return {
      fontSize: `${calculatedSize}px`,
      fontWeight: 'normal',
      color: '#333',
    };
  };

  // 스티커 스타일
  const stickerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${sticker.position.x}px`,
    top: `${sticker.position.y}px`,
    width: `${sticker.size.width}px`,
    height: `${sticker.size.height}px`,
    transform: `rotate(${sticker.rotation}deg)`,
    zIndex: sticker.zIndex,
    cursor: isDragging || isResizing || isRotating ? 'grabbing' : (isSelected ? 'move' : (isEditing ? 'text' : 'grab')),
    userSelect: 'none',
    pointerEvents: 'auto',
    border: isSelected ? '2px dashed #3D8BFF' : 'none',
    transition: (isDragging || isResizing || isRotating) ? 'none' : 'all 0.2s ease',
    opacity: 1,
    backgroundColor: 'transparent',
  };

  const textStyle = getTextStyle();

  // 리사이즈 핸들 렌더링
  const renderResizeHandles = () => {
    if (!isSelected || isEditing) {
      return null;
    }

    const handleSize = 7;
    const handles: { position: ResizeHandle; x: number; y: number; cursor: string }[] = [
      { position: 'nw', x: -handleSize/2, y: -handleSize/2, cursor: 'nw-resize' },
      { position: 'n', x: sticker.size.width/2 - handleSize/2, y: -handleSize/2, cursor: 'n-resize' },
      { position: 'ne', x: sticker.size.width - handleSize/2, y: -handleSize/2, cursor: 'ne-resize' },
      { position: 'e', x: sticker.size.width - handleSize/2, y: sticker.size.height/2 - handleSize/2, cursor: 'e-resize' },
      { position: 'se', x: sticker.size.width - handleSize/2, y: sticker.size.height - handleSize/2, cursor: 'se-resize' },
      { position: 's', x: sticker.size.width/2 - handleSize/2, y: sticker.size.height - handleSize/2, cursor: 's-resize' },
      { position: 'sw', x: -handleSize/2, y: sticker.size.height - handleSize/2, cursor: 'sw-resize' },
      { position: 'w', x: -handleSize/2, y: sticker.size.height/2 - handleSize/2, cursor: 'w-resize' },
    ];

    return handles.map((handle) => (
      <div
        key={handle.position}
        className="absolute bg-white border-2 border-[#3D8BFF] rounded-full z-10"
        style={{
          left: `${handle.x}px`,
          top: `${handle.y}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          cursor: handle.cursor,
          zIndex: sticker.zIndex + 2,
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, handle.position)}
      />
    ));
  };

  // 회전 핸들 렌더링
  const renderRotateHandle = () => {
    if (!isSelected || isEditing) {
      return null;
    }

    const handleSize = 20;
    const offsetY = 10;

    return (
      <div
        className="absolute bg-white border-2 border-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-50 z-10"
        style={{
          left: `${sticker.size.width/2 - handleSize/2}px`,
          top: `${sticker.size.height + offsetY}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          zIndex: sticker.zIndex + 2,
        }}
        onMouseDown={(e) => handleResizeMouseDown(e, 'rotate')}
        title="회전"
      >
        <IoRefresh size={12} className="text-blue-500" />
      </div>
    );
  };

  return (
    <div
      ref={stickerRef}
      style={stickerStyle}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        e.stopPropagation();
        setIsSelected(true);
        bringTextStickerToFront(sticker.id);
      }}
    >
      {/* 말풍선 배경 이미지 */}
      {sticker.type === 'bubble' && sticker.backgroundUrl && (
        <img
          src={sticker.backgroundUrl}
          alt="말풍선 배경"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: -1,
          }}
          draggable={false}
        />
      )}
      
      {/* 텍스트 영역 */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={sticker.text}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          style={{
            position: 'absolute',
            top: sticker.type === 'bubble' ? '20%' : '0',
            left: sticker.type === 'bubble' ? '20%' : '0',
            width: sticker.type === 'bubble' ? '60%' : '100%',
            height: sticker.type === 'bubble' ? '60%' : '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            resize: 'none',
            textAlign: 'center',
            padding: '4px',
            ...textStyle,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: sticker.type === 'bubble' ? '20%' : '0',
            left: sticker.type === 'bubble' ? '20%' : '0',
            width: sticker.type === 'bubble' ? '60%' : '100%',
            height: sticker.type === 'bubble' ? '60%' : '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '4px',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            ...textStyle,
          }}
        >
          {sticker.text || '텍스트를 입력하세요'}
        </div>
      )}
      
      {/* 선택된 상태일 때 삭제 버튼 */}
      {isSelected && !isEditing && (
        <button 
          className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#F0F0F0] hover:bg-gray-300 text-gray-600"
          style={{ zIndex: sticker.zIndex + 1 }}
          onClick={(e) => {
            e.stopPropagation();
            removeTextSticker(sticker.id);
          }}
          title="텍스트 스티커 삭제"
        >
          <IoClose
            className="bg-white border border-gray-200 rounded-full"
            size={16}
          />
        </button>
      )}

      {/* 리사이즈 핸들 */}
      {renderResizeHandles()}

      {/* 회전 핸들 */}
      {renderRotateHandle()}
    </div>
  );
};

export default DraggableTextSticker; 