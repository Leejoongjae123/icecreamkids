"use client";
import React, { useRef, useState, useEffect } from 'react';
import { IoClose } from "react-icons/io5";
import { TextStickerItem } from './types';
import { useTextStickerStore } from '@/hooks/store/useTextStickerStore';
import { cn } from '@/lib/utils';

interface DraggableTextStickerProps {
  sticker: TextStickerItem;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableTextSticker: React.FC<DraggableTextStickerProps> = ({ sticker, containerRef }) => {
  const stickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const [resizeHandle, setResizeHandle] = useState<string>('');

  const { 
    updateTextStickerPosition, 
    updateTextStickerSize,
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
    if (textLength === 0) return baseSize;
    
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
    
    if (!containerRef.current || !stickerRef.current || isEditing) return;

    bringTextStickerToFront(sticker.id);
    setIsSelected(true);
    setIsDragging(true);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    setDragStart({ x: mouseX, y: mouseY });
    setInitialPosition(sticker.position);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current || !stickerRef.current) return;

    bringTextStickerToFront(sticker.id);
    setIsSelected(true);
    setIsResizing(true);
    setResizeHandle(handle);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    setDragStart({ x: mouseX, y: mouseY });
    setInitialSize(sticker.size);
    setInitialPosition(sticker.position);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if ((!isDragging && !isResizing) || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    const deltaX = mouseX - dragStart.x;
    const deltaY = mouseY - dragStart.y;

    if (isResizing) {
      // 리사이즈 로직
      let newWidth = initialSize.width;
      let newHeight = initialSize.height;
      let newX = initialPosition.x;
      let newY = initialPosition.y;

      const minSize = 50; // 최소 크기
      const maxSize = 300; // 최대 크기

      switch (resizeHandle) {
        case 'se': // 남동쪽 (오른쪽 아래)
          newWidth = Math.max(minSize, Math.min(maxSize, initialSize.width + deltaX));
          newHeight = Math.max(minSize, Math.min(maxSize, initialSize.height + deltaY));
          break;
        case 'sw': // 남서쪽 (왼쪽 아래)
          newWidth = Math.max(minSize, Math.min(maxSize, initialSize.width - deltaX));
          newHeight = Math.max(minSize, Math.min(maxSize, initialSize.height + deltaY));
          newX = initialPosition.x + (initialSize.width - newWidth);
          break;
        case 'ne': // 북동쪽 (오른쪽 위)
          newWidth = Math.max(minSize, Math.min(maxSize, initialSize.width + deltaX));
          newHeight = Math.max(minSize, Math.min(maxSize, initialSize.height - deltaY));
          newY = initialPosition.y + (initialSize.height - newHeight);
          break;
        case 'nw': // 북서쪽 (왼쪽 위)
          newWidth = Math.max(minSize, Math.min(maxSize, initialSize.width - deltaX));
          newHeight = Math.max(minSize, Math.min(maxSize, initialSize.height - deltaY));
          newX = initialPosition.x + (initialSize.width - newWidth);
          newY = initialPosition.y + (initialSize.height - newHeight);
          break;
      }

      // 컨테이너 경계 체크
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      
      newX = Math.max(0, Math.min(newX, containerWidth - newWidth));
      newY = Math.max(0, Math.min(newY, containerHeight - newHeight));

      updateTextStickerSize(sticker.id, { width: newWidth, height: newHeight });
      updateTextStickerPosition(sticker.id, { x: newX, y: newY });
    } else {
      // 드래그 로직
      const newX = initialPosition.x + deltaX;
      const newY = initialPosition.y + deltaY;
      
      // 컨테이너 경계 체크
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      
      const clampedX = Math.max(0, Math.min(newX, containerWidth - sticker.size.width));
      const clampedY = Math.max(0, Math.min(newY, containerHeight - sticker.size.height));
      
      updateTextStickerPosition(sticker.id, { x: clampedX, y: clampedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

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
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, initialPosition, initialSize, resizeHandle]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleContainerClick);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleContainerClick);
    };
  }, [isSelected, isEditing]);

  // 텍스트 스타일 함수 - 텍스트 타입에 따라 고정된 폰트 크기와 굵기 적용
  const getTextStyle = () => {
    if (sticker.type === 'basic') {
      switch (sticker.textType) {
        case 'title': {
          return {
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#333',
          };
        }
        case 'subtitle': {
          return {
            fontSize: '24px',
            fontWeight: '600', // semibold
            color: '#555',
          };
        }
        case 'body': {
          return {
            fontSize: '20px',
            fontWeight: '500', // medium
            color: '#666',
          };
        }
        default: {
          return {
            fontSize: '20px',
            fontWeight: '500',
            color: '#333',
          };
        }
      }
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
    cursor: isDragging ? 'grabbing' : (isResizing ? 'resize' : (isEditing ? 'text' : 'grab')),
    userSelect: 'none',
    pointerEvents: 'auto',
    outline: isSelected ? '2px solid #fbbf24' : 'none',
    outlineOffset: '2px',
    transition: isDragging ? 'none' : 'all 0.2s ease',
    opacity: 1,
    backgroundColor: 'transparent',
  };

  const textStyle = getTextStyle();

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

      {/* 선택된 상태일 때 리사이즈 핸들들 */}
      {isSelected && !isEditing && (
        <>
          {/* 북서쪽 핸들 (왼쪽 위) */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-amber-400 border border-amber-500 cursor-nw-resize"
            style={{ zIndex: sticker.zIndex + 1 }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          
          {/* 북동쪽 핸들 (오른쪽 위) */}
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border border-amber-500 cursor-ne-resize"
            style={{ zIndex: sticker.zIndex + 1 }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          
          {/* 남서쪽 핸들 (왼쪽 아래) */}
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-amber-400 border border-amber-500 cursor-sw-resize"
            style={{ zIndex: sticker.zIndex + 1 }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          
          {/* 남동쪽 핸들 (오른쪽 아래) */}
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 border border-amber-500 cursor-se-resize"
            style={{ zIndex: sticker.zIndex + 1 }}
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />
        </>
      )}
    </div>
  );
};

export default DraggableTextSticker; 