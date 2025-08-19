import { useCallback } from 'react';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { useAlertStore } from '@/hooks/store/useAlertStore';

export default function useSimpleCaptureImage() {
  const { showAlert } = useAlertStore();
  /**
   * 단순하고 확실한 이미지 캡처 함수
   * 보이는 그대로 캡처하는 것에 집중
   */
  const downloadSimpleImage = useCallback(
    async (elementId: string, fileName = 'captured-image.png') => {
      const element = document.getElementById(elementId);
      
      if (!element) {
        showAlert({ message: '캡처할 영역을 찾을 수 없습니다.' });
        return;
      }

      try {
        // 요소가 실제로 화면에 보이는지 확인
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          alert('캡처할 영역이 화면에 보이지 않습니다.');
          return;
        }

        console.log(`캡처 시작: ${elementId}, 크기: ${rect.width}x${rect.height}`);

        // 간단하고 확실한 옵션들만 사용
        const options = {
          backgroundColor: '#ffffff',
          pixelRatio: 1, // 일단 1로 시작해서 확실하게
          quality: 1,
          cacheBust: true,
          useCORS: true,
          allowTaint: true,
          // 스타일 강제 적용으로 배경 이미지 보장
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left',
          },
          // 필터링으로 숨겨진 요소 제외
          filter: (node: Element) => {
            // print-hide 클래스나 display: none인 요소 제외
            if (node.nodeType === 1) { // Element 노드인 경우만
              const element = node as HTMLElement;
              if (element.classList?.contains('print-hide')) {
                return false;
              }
              const style = window.getComputedStyle(element);
              if (style.display === 'none' || style.visibility === 'hidden') {
                return false;
              }
            }
            return true;
          },
        };

        // 이미지 생성
        const dataUrl = await toPng(element, options);
        
        // 생성된 이미지 크기 확인
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataUrl;
        });

        console.log(`캡처 완료: 이미지 크기 ${img.width}x${img.height}`);

        // 이미지가 너무 작으면 경고
        if (img.width < 100 || img.height < 100) {
          showAlert({ message: '캡처된 이미지가 너무 작습니다. 다시 시도하거나 요소를 확인해주세요.' });
        }

        // 다운로드
        await download(dataUrl, fileName);
        
      } catch (_err) {
        showAlert({ message: '이미지 캡처에 실패했습니다. 페이지를 새로고침 후 다시 시도해주세요.' });
      }
    },
    [showAlert]
  );

  /**
   * 미리보기 함수 (테스트용)
   */
  const previewSimpleImage = useCallback(
    async (elementId: string) => {
      const element = document.getElementById(elementId);
      
      if (!element) {
        showAlert({ message: '미리보기 할 영역을 찾을 수 없습니다.' });
        return;
      }

      try {
        const rect = element.getBoundingClientRect();
        console.log(`미리보기 시작: ${elementId}, 크기: ${rect.width}x${rect.height}`);

        const options = {
          backgroundColor: '#ffffff',
          pixelRatio: 1,
          quality: 1,
          cacheBust: true,
          useCORS: true,
          allowTaint: true,
        };

        const dataUrl = await toPng(element, options);
        
        // 새 창에서 미리보기
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>캡처 미리보기</title></head>
              <body style="margin: 0; padding: 20px; background: #f0f0f0;">
                <h3>캡처 결과 미리보기</h3>
                <p>원본 크기: ${rect.width}x${rect.height}</p>
                <img src="${dataUrl}" style="max-width: 100%; border: 1px solid #ccc;" />
              </body>
            </html>
          `);
        }
        
      } catch (_err) {
        showAlert({ message: '미리보기에 실패했습니다.' });
      }
    },
    [showAlert]
  );

  /**
   * 요소 정보 확인 함수 (디버깅용)
   */
  const checkElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    
    if (!element) {
      showAlert({ message: '요소를 찾을 수 없습니다.' });
      return null;
    }

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    const info = {
      id: elementId,
      visible: rect.width > 0 && rect.height > 0,
      dimensions: {
        width: rect.width,
        height: rect.height,
      },
      position: {
        top: rect.top,
        left: rect.left,
      },
      backgroundImage: style.backgroundImage,
      display: style.display,
      visibility: style.visibility,
    };

    console.log('Element info:', info);
    return info;
  }, [showAlert]);

  return {
    downloadSimpleImage,
    previewSimpleImage,
    checkElement,
  };
}
