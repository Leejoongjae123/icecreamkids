import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { ModalBase } from '@/components/common';
import { createPortal } from 'react-dom';
import { getCdnFilesForDownload } from '@/service/file/fileStore';
import { getBypassCorsUrl } from '@/utils';
import { IP_ADDRESS } from '@/const';

// 캐시처리용
type CacheItem = { url: string; mimeType: string; timestamp: number };
const audioCache = new Map<string, CacheItem>();

export interface AudioFleData {
  ownerId: number;
  ownerProfileId: number;
  driveItemKeys: string;
}
export interface IAudioInterface {
  onCancel: () => void;
  isOpen: boolean;
  title: string;
  data: AudioFleData;
}

export function AudioPlayModal({ onCancel, isOpen, title, data }: IAudioInterface) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const isSafari = useMemo(() => /^((?!chrome|android).)*safari/i.test(navigator.userAgent), []);
  const [source, setSource] = useState<{ url: string; mimeType: string }>({
    url: '',
    mimeType: 'audio/mpeg',
  });

  // 오디오 로딩 함수 분리
  // loadAudio 함수 수정 (33:42 에러 수정)
  const loadAudio = useCallback(async () => {
    if (!data.driveItemKeys) return undefined;

    const key = data.driveItemKeys;
    const now = Date.now();
    const cached = audioCache.get(key);

    try {
      // 30초 이내 열면 캐싱처리
      if (cached && now - cached.timestamp < 30 * 1000) {
        setSource({ url: cached.url, mimeType: cached.mimeType });

        // setTimeout으로 상태 업데이트 후 로딩 실행 보장
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
          }
        }, 100);

        return undefined;
      }

      // 30초 이상이면 API 호출
      const result = await getCdnFilesForDownload({
        ...data,
        driveItemKeys: [key],
        period: 360,
        isForDownload: false,
        forDownload: false,
        ip: IP_ADDRESS,
      });

      if (result.status === 200 && result.result?.[0]) {
        const fileUrl = result.result[0].url || '';
        const mediaType = result.result[0].mediaType || 'audio/m4a';
        const bypassed = getBypassCorsUrl(fileUrl);

        setSource({ url: bypassed, mimeType: mediaType });
        audioCache.set(key, { url: bypassed, mimeType: mediaType, timestamp: now });

        // setTimeout으로 상태 업데이트 후 로딩 실행 보장
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
          }
        }, 100);

        return undefined;
      }
      throw new Error('파일을 불러올 수 없습니다.');
    } catch (err) {
      console.error('오디오 로딩 에러:', err);
      return undefined;
    }
  }, [data, setSource]);

  // 오디오 엘리먼트 이벤트 핸들러
  useEffect(() => {
    const audioElement = audioRef.current;

    const handleCanPlay = () => {
      console.log('오디오 재생 준비 완료');
    };
    const handleError = (e: Event) => {
      console.error('오디오 에러 발생:', e);
    };

    if (audioElement) {
      audioElement.addEventListener('canplay', handleCanPlay);
      audioElement.addEventListener('error', handleError);
    }

    // 항상 cleanup 함수를 반환
    return () => {
      if (audioElement) {
        audioElement.removeEventListener('canplay', handleCanPlay);
        audioElement.removeEventListener('error', handleError);
      }
    };
  }, []);

  // 모달이 열리면 오디오 불러온다!
  useEffect(() => {
    const currentAudio = audioRef.current;
    if (isOpen && data.driveItemKeys) {
      loadAudio();
    }

    // 모달이 닫힐 때 오디오 정지
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [isOpen, data.driveItemKeys, loadAudio]);

  // isOpen이 false면 포탈 렌더링 자체를 스킵
  if (!isOpen) return null;

  return createPortal(
    <ModalBase
      className="modal-audio"
      message={title}
      size="small"
      cancelText=""
      confirmText=""
      isOpen={isOpen}
      onCancel={onCancel}
    >
      <div className="group-audio">
        <audio ref={audioRef} controls preload="auto" className="item-audio">
          {source.url && <source src={source.url} type={isSafari ? source.mimeType : 'audio/mpeg'} />}
          <track kind="captions" src={source.url} srcLang="ko" label="한글 캡션" default />
          지원하지 않는 브라우저입니다.
        </audio>
      </div>
    </ModalBase>,
    document.getElementById('modal-root')!,
  );
}
