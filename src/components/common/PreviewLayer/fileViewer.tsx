'use client';

import React, { FunctionComponent, useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { EXTENSIONS, YOUTUBE_URL_PATTERN } from '@/const';
import { IFileViewer, IRenderMap } from '@/components/common/PreviewLayer/types';
import { extractUrlFromContent, extractYouTubeVideoId, getFileExtension } from '@/utils';
import { SmartFolderItemResultFileType, StoryBoardAddRequest, StudentRecordResult } from '@/service/file/schemas';
import StoryBoardForm from '@/app/(auth)/my-board/[tab]/(story-board)/_components/StoryBoardForm';
import { getStoryBoardInitBlocks } from '@/app/(auth)/my-board/utils';
import { useForm } from 'react-hook-form';
import { IBlockData } from '@/app/(auth)/my-board/[tab]/(story-board)/_components/StoryBoardForm/types';
import { Button } from '@/components/common/Button';
import { Loader, TooltipContent } from '@/components/common';
import cx from 'clsx';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import StudentRecordPreview from '@/app/work-board/(protected)/student-record/_component/StudentRecordPreview';
import { useGetDomains } from '@/service/file/fileStore';
import type { EducationalClassResultCourse } from '@/service/member/schemas';
import { useReportStore } from '@/hooks/store/useReportStore';
import PreviewReportClient from '@/app/work-board/(protected)/playing-report/_components/PreviewReport';
import ActivityCardDetailBody from '@/app/work-board/(protected)/playing-plan/_components/ActivityCardDetailBody';

// 동적 로드로 PDF 뷰어 추가
const PDFViewer = dynamic(() => import('./pdfViewer'), { ssr: false });

const FileViewer: FunctionComponent<IFileViewer> = ({
  file,
  style,
  onClick,
  cdnFile,
  isFailCdnFile,
  handleDownload,
}) => {
  const [extractedUrl, setExtractedUrl] = useState<string | null>(null);
  const fileExtension = getFileExtension(file.name);
  const [src, setSrc] = useState('');
  const [hasScrollTooltip, setHasScrollTooltip] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileViewerRef = useRef<HTMLDivElement>(null);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const [isShowTooltip, setIsShowTooltip] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // 초기화
    videojs(videoEl, {
      controls: true,
      preload: 'auto',
      controlBar: true,
      poster: file.thumbUrl ?? '/images/poster_video.png',
    });
  }, [src, file.thumbUrl]);

  useEffect(() => {
    setIsShowTooltip(true);
    const timer = setTimeout(() => setIsShowTooltip(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = fileViewerRef.current;

    const checkScroll = () => {
      if (!el) return;

      const hasScroll = el.scrollHeight > el.clientHeight;
      setHasScrollTooltip(hasScroll);
    };

    const observer = new ResizeObserver(() => {
      checkScroll();
    });

    if (el) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, file.thumbUrl]);

  // 기본 파일 세팅
  useEffect(() => {
    if (!cdnFile?.url) return;
    const url = cdnFile.url.replace(process.env.NEXT_PUBLIC_S3_URL!, '/s3');
    setSrc(url); // cors 우회 할당
  }, [cdnFile]);

  // url 확장자 세팅
  useEffect(() => {
    if (!cdnFile?.url) return;
    if (fileExtension && EXTENSIONS.URL.includes(fileExtension)) {
      fetch(cdnFile.url)
        .then((response) => response.text())
        .then((content) => setExtractedUrl(extractUrlFromContent(content)))
        .catch((error) => console.error('Error reading .url file:', error));
    } else {
      setExtractedUrl(null);
    }
  }, [fileExtension, cdnFile]);

  // 유튜브 URL 확인
  const isYouTubeUrl = extractedUrl && YOUTUBE_URL_PATTERN.test(extractedUrl);
  const videoId = isYouTubeUrl ? extractYouTubeVideoId(extractedUrl as string) : null;

  // 스토리 보드 대응
  // 폼 관리
  const form = useForm<StoryBoardAddRequest>({
    defaultValues: {},
    mode: 'onChange',
  });

  const initBlocks = useMemo<IBlockData[]>(() => {
    return getStoryBoardInitBlocks(file.storyBoard) ?? [];
  }, [file.storyBoard]);

  // 각 블록(타입)의 데이터를 배열로 관리.
  const [blocks, setBlocks] = useState<IBlockData[]>(initBlocks);

  useEffect(() => {
    if (file.fileType === 'STORY_BOARD') setBlocks(initBlocks);
  }, [file, initBlocks]);

  // 아이 관찰 기록
  const { data: domains } = useGetDomains(
    { course: file?.studentRecord?.course as EducationalClassResultCourse },
    { query: { enabled: !!file.studentRecord } },
  );

  const [studentRecord] = useState<StudentRecordResult | undefined>(file?.studentRecord);

  // 놀이 계획
  const { reportData, setReportData } = useReportStore((state) => ({
    reportData: state.reportData,
    setReportData: state.setReportData,
  }));

  useEffect(() => {
    setReportData(file.lecturePlanReport);
  }, [reportData, file.lecturePlanReport, setReportData]);

  // 파일 확장자에 따른 렌더링 매핑 객체
  const renderMap: Record<IRenderMap, JSX.Element | null> = {
    [SmartFolderItemResultFileType.IMAGE]: <img src={src} alt={`${file.name} thumbnail`} />,
    [SmartFolderItemResultFileType.AUDIO]: (
      <>
        <span className="ico-comm ico-illust-audio2" />
        <audio controls preload="auto" className="item-audio">
          <source src={src} type={cdnFile?.mediaType === 'audio/m4a' ? 'audio/mp4' : cdnFile?.mediaType} /> {/**  */}
          <track kind="captions" src={src} srcLang="ko" label="한글 캡션" default />
          Your browser does not support the audio element.
        </audio>
      </>
    ),
    [SmartFolderItemResultFileType.VIDEO]: (
      <video ref={videoRef} className="video-js vjs-default-skin item-video">
        <track kind="captions" src={src} srcLang="ko" label="한글 캡션" default />
        <source src={src} type={isSafari ? cdnFile?.mediaType : 'video/mp4'} />
        {/* <source src={src} type={cdnFile?.mediaType} /> * 사파리 이외에는 video/quicktime이 인식이 안됨 */}
        Your browser does not support the video tag.
      </video>
    ),
    PDF: <PDFViewer fileUrl={src} />,
    [SmartFolderItemResultFileType.DOCUMENT]: (
      <div className="item-content">
        <em className="tit-item">이 자료 유형은 지원되지 않습니다.</em>
        <p className="txt-item">
          이 자료 유형은 미리보기가 지원되지 않아요.
          <br />
          다운로드로 확인해 주세요.
        </p>
        <Button size="small" color="line" icon="download-14-b" onClick={handleDownload}>
          다운로드
        </Button>
      </div>
    ),
    YOUTUBE: (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    ),
    [SmartFolderItemResultFileType.URL]: (
      <div className="item-content">
        <em className="tit-item">웹 바로가기 파일입니다.</em>
        <p
          className="txt-link"
          style={{
            color: '#8f8f8f',
            textDecoration: 'none',
          }}
        >
          {extractedUrl}
        </p>
        <Button
          size="small"
          color="line"
          onClick={() => {
            if (extractedUrl) {
              window.open(extractedUrl, '_blank');
            }
          }}
        >
          사이트로 이동
        </Button>
      </div>
    ),
    ARCHIVE: null,
    STORY_BOARD: (
      <StoryBoardForm
        data={file.storyBoard}
        isEdit={false}
        form={form}
        onSubmit={async () => {}}
        blocks={blocks}
        setBlocks={setBlocks}
        previewMode
      />
    ),
    LECTURE_PLAN_REPORT:
      reportData && file?.lecturePlanReport ? (
        <div className="doc-playreport">
          <PreviewReportClient
            className="previewLayerReport"
            previewData={{
              ...file.lecturePlanReport,
              cards: file.lecturePlanReport.lectureReportCards?.map((item) => {
                return {
                  ...item,
                  title: item.title ?? '',
                  contents: item.contents ?? '',
                };
              }),
              objective: file.lecturePlanReport.learningPoint,
              support: file.lecturePlanReport.teacherSupport,
            }}
            showHeader={false}
            onBackEdit={() => {}}
          />
        </div>
      ) : null,
    FOLDER: null,
    LECTURE_PLAN: file.lecturePlan ? (
      <div className="doc-playplan">
        <ActivityCardDetailBody
          isEditMode={false}
          lecturePlanCardSections={file?.lecturePlan}
          displayTitle={file?.lecturePlan?.subject as string}
          displayPeriod={`${file?.lecturePlan?.startsAt} ~ ${file?.lecturePlan?.endsAt}`}
          displayAge={file?.lecturePlan?.studentAge as number}
          displayTime={file?.lecturePlan?.activityTimeStr as string}
        />
      </div>
    ) : null,
    STUDENT_RECORD: (
      <div className="doc-observation">
        <StudentRecordPreview
          studentName={studentRecord?.studentName}
          modifiedAt={studentRecord?.modifiedAt}
          studentThumbnail={studentRecord?.studentThumbnail}
          educationalClassAge={studentRecord?.educationalClassAge}
          studentBirthday={studentRecord?.studentBirthday}
          summaryScores={studentRecord?.summaryScores}
          domains={domains?.result}
          observeComments={studentRecord?.observeComments}
          observeSummary={studentRecord?.observeSummary}
          teacherComment={studentRecord?.teacherComment}
          teacherSupport={studentRecord?.teacherSupport}
          parentSupport={studentRecord?.parentSupport}
          showUtilButtons={false}
        />
      </div>
    ),
    STUDENT_CLASSIFICATION: null,
    ACTIVITY_CLASSIFICATION: null,
    PHOTO_COMPOSITION: null,
    PRIVATE_DATA_ENCRYPTION: null,
    SKETCH_CREATION: null,
    PHOTO_ALBUM: null,
    AI_WRITING: null,
    STUDENT_AND_ACTIVITY_CLASSIFICATION: null,
    ETC: null,
    TEXT_MEMO: null,
  };

  // 확장자 타입에 따라 해당하는 렌더링 요소 선택
  const fileType = (): IRenderMap => {
    if (isYouTubeUrl) return 'YOUTUBE';
    if (extractedUrl) return 'URL';

    const fileTypeMap = new Map<string, IRenderMap>(
      Object.entries(EXTENSIONS)
        .flatMap(
          ([mappedType, extensions]) =>
            extensions.map((ext) => [ext, mappedType as IRenderMap] as [string, IRenderMap]), // 명확한 튜플 지정
        )
        .concat([['pdf', 'PDF'] as [string, IRenderMap]]),
    );

    return fileExtension ? fileTypeMap.get(fileExtension) || 'ETC' : 'ETC';
  };

  return (
    <>
      <div
        ref={fileViewerRef}
        className={cx(
          'inner-body',
          isYouTubeUrl && 'type-youtube',
          file.fileType === 'VIDEO' && 'type-video',
          file.fileType === 'AUDIO' && 'type-audio',
        )}
        style={style}
        role="button"
        tabIndex={0}
        aria-label="확대"
        onClick={() => onClick?.()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClick?.();
        }}
      >
        {/* 비디오 태그의 기본 재생 버튼 삭제, 포스터 사이즈 조정 */}
        <style>
          {`
          .video-js .vjs-poster picture.vjs-poster img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          ${
            !file.thumbUrl
              ? `
            .vjs-big-play-button {
              display: none !important;
            }
          `
              : ''
          }
        `}
        </style>
        {file.fileType !== 'STORY_BOARD' &&
        file.fileType !== 'STUDENT_RECORD' &&
        file.fileType !== 'LECTURE_PLAN' &&
        file.fileType !== 'LECTURE_PLAN_REPORT' &&
        !src ? (
          isFailCdnFile ? (
            <div className="item-content">
              <p className="txt-item">자료 조회에 실패하였습니다.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Loader />
            </div>
          )
        ) : (
          renderMap[fileType()] || (
            <div className="item-content">
              <em className="tit-item">이 자료 유형은 지원되지 않습니다.</em>
              <p className="txt-item">
                이 자료 유형은 미리보기가 지원되지 않아요.
                <br />
                다운로드로 확인해 주세요.
              </p>
              <Button size="small" color="line" icon="download-14-b" onClick={handleDownload}>
                다운로드
              </Button>
            </div>
          )
        )}
      </div>
      {file.fileType !== 'ETC' &&
        file.fileType !== 'URL' &&
        file.fileType !== 'AUDIO' &&
        file.fileType !== 'VIDEO' &&
        isShowTooltip &&
        hasScrollTooltip && (
          <TooltipContent
            isShow
            colorType="dark"
            sizeType="small"
            position="left"
            contents="자료내용을 스크롤을 통해서 더 자세히 확인하세요"
          />
        )}
    </>
  );
};
FileViewer.displayName = 'FileViewer';
export default FileViewer;
