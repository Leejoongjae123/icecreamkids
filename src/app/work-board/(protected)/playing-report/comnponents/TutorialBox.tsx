"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type TutorialBoxPosition = 'right' | 'left' | 'top' | 'bottom';

interface TutorialBoxProps {
  position?: TutorialBoxPosition;
  title?: string;
  text?: string;
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
  targetRef?: React.RefObject<HTMLElement | HTMLDivElement | null>;
  offset?: number;
  onClose?: () => void;
  onClickButton?: () => void;
  buttonText?: string;
  visible?: boolean; // 외부에서 노출 제어
}

export default function TutorialBox({
  position = 'right',
  title = '아이 사진 등록',
  text = '얼굴 합성 도안에 넣을 아이 사진을 등록해주세요.',
  top,
  left,
  bottom,
  right,
  targetRef,
  offset = 8,
  onClose,
  onClickButton,
  buttonText = '다음',
  visible: visibleProp = true,
}: TutorialBoxProps) {
  // 내부 상태로도 닫기 가능, 외부 visible이 false면 무조건 숨김
  const [internalVisible, setInternalVisible] = useState(true);
  const visible = visibleProp && internalVisible;
  const [mounted, setMounted] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [computedStyle, setComputedStyle] = useState<Pick<React.CSSProperties, 'top' | 'left' | 'bottom' | 'right'>>({});

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // 위치별 class (기본 고정 배치만 유지)
  let boxPosition = '';
  let trianglePosition = '';
  let triangleRotate = '';
  let style: React.CSSProperties = {};

  switch (position) {
    case 'right':
      boxPosition = 'fixed';
      trianglePosition = 'absolute -left-2 top-1/2 -translate-y-1/2';
      triangleRotate = 'rotate-0';
      break;
    case 'left':
      boxPosition = 'fixed';
      trianglePosition = 'absolute -right-2 top-1/2 -translate-y-1/2';
      triangleRotate = 'rotate-180';
      break;
    case 'top':
      boxPosition = 'fixed';
      trianglePosition = 'absolute left-1/2 -bottom-2 -translate-x-1/2';
      triangleRotate = 'rotate-90';
      break;
    case 'bottom':
      boxPosition = 'fixed';
      trianglePosition = 'absolute left-1/2 -top-2 -translate-x-1/2';
      triangleRotate = '-rotate-90';
      break;
    default:
      boxPosition = 'fixed';
      trianglePosition = 'absolute -left-2 top-1/2 -translate-y-1/2';
      triangleRotate = 'rotate-0';
  }

  // 직접 위치 지정이 들어오면 style에 반영
  if (top !== undefined) {
    style.top = top;
  }
  if (left !== undefined) {
    style.left = left;
  }
  if (bottom !== undefined) {
    style.bottom = bottom;
  }
  if (right !== undefined) {
    style.right = right;
  }

  // 앵커 기준 위치 계산
  useEffect(() => {
    const updatePosition = () => {
      if (!targetRef?.current || !boxRef.current) {
        setComputedStyle({});
        return;
      }

      const rect = targetRef.current.getBoundingClientRect();
      const boxWidth = boxRef.current.offsetWidth || 0;
      const boxHeight = boxRef.current.offsetHeight || 0;

      const viewportPadding = 8;
      let nextTop: number | undefined = undefined;
      let nextLeft: number | undefined = undefined;

      if (position === 'top') {
        nextTop = rect.top - boxHeight - offset;
        nextLeft = rect.left + rect.width / 2 - boxWidth / 2;
      } else if (position === 'bottom') {
        nextTop = rect.bottom + offset;
        nextLeft = rect.left + rect.width / 2 - boxWidth / 2;
      } else if (position === 'left') {
        nextTop = rect.top + rect.height / 2 - boxHeight / 2;
        nextLeft = rect.left - boxWidth - offset;
      } else {
        nextTop = rect.top + rect.height / 2 - boxHeight / 2;
        nextLeft = rect.right + offset;
      }

      if (typeof nextTop === 'number') {
        nextTop = Math.max(viewportPadding, nextTop);
      }
      if (typeof nextLeft === 'number') {
        nextLeft = Math.max(viewportPadding, nextLeft);
      }

      setComputedStyle({ top: nextTop, left: nextLeft });
    };

    const raf = requestAnimationFrame(updatePosition);
    const handle = () => updatePosition();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle as EventListener);
    };
  }, [position, targetRef, visible, mounted]);

  const resolvedTop = typeof top === 'number' ? Math.max(8, top) : computedStyle.top;
  const resolvedLeft = typeof left === 'number' ? Math.max(8, left) : computedStyle.left;
  const resolvedBottom = typeof bottom === 'number' ? Math.max(8, bottom) : computedStyle.bottom;
  const resolvedRight = typeof right === 'number' ? Math.max(8, right) : computedStyle.right;

  if (!visible || !mounted) {
    return null;
  }

  const content = (
    <div
      ref={boxRef}
      className={`flex w-[280px] z-[1000] p-5 flex-col items-end gap-3 rounded-xl bg-[#F78A5A] ${boxPosition}`}
      style={{
        ...style,
        top: resolvedTop !== undefined ? resolvedTop : style.top,
        left: resolvedLeft !== undefined ? resolvedLeft : style.left,
        bottom: resolvedBottom !== undefined ? resolvedBottom : style.bottom,
        right: resolvedRight !== undefined ? resolvedRight : style.right,
      }}
    >
      <div className="flex flex-col items-start gap-1 w-full">
        <div className="flex items-center w-full">
          <div className="flex-1 text-white font-bold text-base leading-6">
            {title}
          </div>
          <button
            onClick={() => {
              setInternalVisible(false);
              onClose?.();
            }}
            className="flex p-1 items-center -mr-2 -mt-3 hover:bg-white/10 rounded transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>
        <div className="text-white font-semibold text-[13px] leading-[19.5px] tracking-[-0.5px] mt-1">
          {text}
        </div>
      </div>

      <svg
        className={`${trianglePosition} ${triangleRotate}`}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 0L0 8L8 16L16 8L8 0Z"
          fill="#F78A5A"
        />
      </svg>

      <div className="flex justify-end w-full mt-2">
        <button
          onClick={() => {
            setInternalVisible(false);
            onClickButton?.();
          }}
          className="w-[72px] h-[34px] px-4 flex justify-center items-center rounded-full bg-white hover:bg-gray-50 transition-colors"
        >
          <span className="text-[#EF6A2F] text-center font-semibold text-[13px] leading-[13px] tracking-[-0.5px]">
            {buttonText}
          </span>
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
