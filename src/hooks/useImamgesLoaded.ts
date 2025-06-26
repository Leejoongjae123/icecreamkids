import { useEffect, useState } from 'react';

interface IUseImagesLoaded<T> {
  containerId?: string;
  timeout?: number;
  watchTrigger?: T;
}

/**
 * 커스텀 훅: containerId에 해당하는 요소 내부의 모든 img 태그가
 * 브라우저에서 완전히 디코딩될 때까지, 그리고 watchTrigger가 활성화된 시점부터 대기
 * @param options.containerId - 이미지들을 감시할 컨테이너 요소의 id
 * @param options.timeout - 최대 대기 시간(ms), 기본값 10000
 * @param options.watchTrigger - 이미지가 삽입된 후 훅을 재실행하기 위한 트리거 값
 */
const useImagesLoaded = <T>({ containerId, timeout = 10000, watchTrigger }: IUseImagesLoaded<T>) => {
  const [allVisibleAndDecoded, setAllVisibleAndDecoded] = useState(false);

  useEffect(() => {
    // 상태 초기화
    setAllVisibleAndDecoded(false);

    // 기본 빈 cleanup 함수
    let cleanup = (): void => {};

    // 컨테이너 요소 찾기
    const container = containerId ? document.getElementById(containerId) : document;

    if (!container) {
      // 컨테이너가 없으면 바로 완료
      setAllVisibleAndDecoded(true);
    } else {
      // img 요소들 수집
      const imgElements = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
      if (imgElements.length === 0) {
        // 이미지 없으면 timeout 후 완료
        const delayId = window.setTimeout(() => {
          setAllVisibleAndDecoded(true);
        }, timeout);
        cleanup = () => {
          clearTimeout(delayId);
        };
      } else {
        // 타임아웃 설정
        let timedOut = false;
        const timeoutId = window.setTimeout(() => {
          timedOut = true;
          setAllVisibleAndDecoded(true);
        }, timeout);

        // 디코드 대기 프로미스
        const decodePromises = imgElements.map((img) => {
          if (img.complete) {
            return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
          }
          return new Promise<void>((resolve) => {
            const onLoad = (): void => {
              if (img.decode) {
                img
                  .decode()
                  .catch(() => {})
                  .then(resolve);
              } else {
                resolve();
              }
            };
            img.addEventListener('load', onLoad, { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        });

        // 모든 디코드 또는 timeout 중 먼저 완료되는 쪽 처리
        Promise.race([
          Promise.all(decodePromises),
          new Promise<void>((resolve) => {
            setTimeout(resolve, timeout);
          }),
        ]).then(() => {
          if (!timedOut) {
            clearTimeout(timeoutId);
          }
          setAllVisibleAndDecoded(true);
        });

        cleanup = () => {
          clearTimeout(timeoutId);
        };
      }
    }

    //  항상 cleanup 함수 반환
    return cleanup;
  }, [containerId, timeout, watchTrigger]);

  return allVisibleAndDecoded;
};

export default useImagesLoaded;
