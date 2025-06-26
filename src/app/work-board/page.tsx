'use client';

import React, { useMemo, useState } from 'react';
import { clsx as cx } from 'clsx';
import { useGetExample1 as useGetExampleOpenApi } from '@/service/core/coreStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import useUserStore from '@/hooks/store/useUserStore';
import { useGetPhotoFolderTree } from '@/service/file/fileStore';
import { SmartFolderTreeResult, SmartFolderTreeResultSmartFolderApiType } from '@/service/file/schemas';
import type { TaskExampleResult } from '@/service/core/schemas/taskExampleResult';
import AppLayoutWithoutSNB from '@/components/layout/withoutSnb/AppLayoutWithoutSNB';
import { Thumbnail } from '@/components/common';
import PreviewImage from '@/components/common/PreviewImageLayer';
import GroupRenderEmpty from '@/components/common/GroupRenderEmpty';
import { AuthRequired } from './_components/AuthRequired';
import RecentTasks from './_components/main/RecentTasks';
import QuickWorkAI from './_components/main/QuickWorkAI';
import { RecentTaskResultTaskTypeList } from './(protected)/recent-work-history/type';

type QuickPathProps = {
  route?: string;
  categoryName: string;
  iconName: string;
};

function TemporaryQuickPath({ route, categoryName, iconName }: QuickPathProps) {
  const { showAlert } = useAlertStore();
  // route 경로가 없는 경우 alert 노출
  const onAlert = async () => {
    if (!route) showAlert({ message: '서비스 준비 중입니다.' });
  };
  return (
    <a href={route ? `/work-board/${route}` : '#none'} className="link-main" onClick={onAlert}>
      {iconName && (
        <span className={cx('ico-comm', `${iconName}`)} id={iconName}>
          {categoryName}
        </span>
      )}
      <p className="desc-content">{categoryName}</p>
    </a>
  );
}

function WorkBoardPage() {
  // WorkBoardPage 함수 내부, useState 정의 아래에 추가
  const { userInfo } = useUserStore();
  const isAuthUser = !!userInfo;

  // 사용자 닉네임
  const userName = useMemo(() => {
    return userInfo?.name ? `${userInfo.name} 님, ` : '';
  }, [userInfo]);

  // 상단 페이지 링크 모음
  const workBoardQuickPaths = [
    {
      route: 'playing-plan',
      categoryName: '놀이 계획',
      iconName: 'ico-illust-plan',
    },
    // {
    //   route: 'playing-report',
    //   categoryName: '놀이 보고서',
    //   iconName: 'ico-illust-report',
    // },
    {
      route: 'report',
      categoryName: '놀이 보고서',
      iconName: 'ico-illust-report',
    },
    {
      route: 'student-record',
      categoryName: '아이 관찰 기록',
      iconName: 'ico-illust-record',
    },
    {
      route: '',
      categoryName: 'AI 문장 생성',
      iconName: 'ico-illust-ai',
    },
  ];

  // 자료 보드 메뉴 트리 조회
  const photoFolderTreeResult = useGetPhotoFolderTree({}, { query: { enabled: !!userInfo } });
  const photoFolderTreeData = photoFolderTreeResult?.data;
  const photoFolderTreeList = useMemo(() => {
    const findSmartFolderTreeId = (
      arrayList: SmartFolderTreeResult | undefined,
      name: string = '',
      rootType: string[] = ['AI_IMAGE_TASK'],
    ) => {
      if (!name || !arrayList) return null;
      return arrayList?.subFolders?.find(
        (item: { name: string; rootType: string; userEditable: boolean } | null) =>
          item?.name === name && rootType.includes(item.rootType) && item.userEditable === false,
      )?.id;
    };
    const smartFolder = photoFolderTreeData?.result?.[0];
    if (smartFolder && smartFolder.smartFolderApiType === SmartFolderTreeResultSmartFolderApiType.Photo) {
      const { subFolders } = smartFolder;
      const EDUCATIONAL_CLASS_STUDENT_PHOTO = subFolders?.find(
        (item) => item?.rootType === 'EDUCATIONAL_CLASS_STUDENT_PHOTO' && item.userEditable === false,
      );
      const ACTIVITY_PHOTO = subFolders?.find(
        (item) => item?.rootType === 'ACTIVITY_PHOTO' && item?.userEditable === false,
      );
      const AI_IMAGE_TASK = subFolders?.find(
        (item) => item?.rootType === 'AI_IMAGE_TASK' && item?.userEditable === false,
      );
      return {
        STUDENT_CLASSIFICATION: EDUCATIONAL_CLASS_STUDENT_PHOTO?.id,
        ACTIVITY_CLASSIFICATION: ACTIVITY_PHOTO?.id,
        PHOTO_COMPOSITION: findSmartFolderTreeId(AI_IMAGE_TASK, RecentTaskResultTaskTypeList.PHOTO_COMPOSITION, [
          'AI_IMAGE_TASK',
        ]), // 사진 합성
        PRIVATE_DATA_ENCRYPTION: findSmartFolderTreeId(
          AI_IMAGE_TASK,
          RecentTaskResultTaskTypeList.PRIVATE_DATA_ENCRYPTION,
          ['AI_IMAGE_TASK'],
        ), // 초상권 보호
        PHOTO_ALBUM: findSmartFolderTreeId(AI_IMAGE_TASK, RecentTaskResultTaskTypeList.PHOTO_ALBUM, ['AI_IMAGE_TASK']), // 앨범 사진 정리
        SKETCH_CREATION: findSmartFolderTreeId(AI_IMAGE_TASK, RecentTaskResultTaskTypeList.SKETCH_CREATION, [
          'AI_IMAGE_SKETCH',
          'AI_IMAGE_TASK',
        ]), // 컬러링 동안 생성
      };
    }
    return {};
  }, [photoFolderTreeData]);

  // 작업 예시
  const previewImageTemplate = {
    title: '',
    contents: '',
    thumbImageUrl: '',
    fullImageUrl: '',
  };
  const [isPreviewImgOpen, setIsPreviewImgOpen] = useState(false);
  const [previewImgItem, setPreviewImgItem] = useState<TaskExampleResult>(previewImageTemplate);

  // 작업 예시
  const taskExampleResult = useGetExampleOpenApi();
  const taskExampleData = taskExampleResult.data;

  const taskExampleList = useMemo(() => {
    // result가 있는지 먼저 확인 후 안전하게 map 수행
    return taskExampleData?.result
      ? taskExampleData.result.map((task: TaskExampleResult, idx: number) => ({
          id: `taskEx${idx}`,
          ...task,
        }))
      : [];
  }, [taskExampleData]);

  // 작업 예시 유무
  const hasTaskExample = useMemo(() => {
    // null 병합 연산자(??)와 옵셔널 체이닝 모두 제거하고 더 명확하게 수정
    return taskExampleList && taskExampleList.length > 0;
  }, [taskExampleList]);

  const handleOpenPreviewImg = (task: TaskExampleResult) => {
    setPreviewImgItem(task);
    setIsPreviewImgOpen(true);
  };

  const onCancel = async () => {
    setIsPreviewImgOpen(false);
    setPreviewImgItem(previewImageTemplate);
  };

  return (
    <AppLayoutWithoutSNB>
      <div className="main-content">
        <article id="mainContent" className="content-article">
          <h3 className="screen_out">메인</h3>
          {/* 메인 상단 배너 */}
          <div className="content-main">
            <div className="bg-content">
              <video poster="/images/bg_intro_main.png" autoPlay muted loop playsInline className="video_visual">
                <source src="/video/bg_intro_main.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="inner-content">
              <p className="txt-main">
                {isAuthUser ? (
                  <>
                    <span>{userName}</span>환영합니다.
                    <strong className="txt-emph">무엇을 만들고 싶으세요?</strong>
                  </>
                ) : (
                  <>
                    환영합니다.
                    <strong className="txt-emph">많은 기능을 만들고 싶으시면 회원가입을 해보세요!</strong>
                  </>
                )}
              </p>
              <div className="group-link">
                {workBoardQuickPaths?.map((item) => {
                  return (
                    <TemporaryQuickPath
                      key={item.iconName}
                      route={item.route}
                      categoryName={item.categoryName}
                      iconName={item.iconName}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* 최근작업 > (정책)로그인시에만 노출 */}
          <AuthRequired>
            <RecentTasks photoFolderTree={photoFolderTreeList} />
          </AuthRequired>

          {/* 빠른 업무 AI */}
          <div className="content-ai">
            <QuickWorkAI photoFolderTree={photoFolderTreeList} />
          </div>

          {/* 작업 예시 - Task Example */}
          {hasTaskExample && (
            <div className="content-eg">
              <div className="inner-content">
                <h4 className="tit-content">작업 예시</h4>
                {hasTaskExample ? (
                  <ul className="list-thumbnail">
                    {taskExampleList?.map((taskEx) => {
                      return (
                        <li key={taskEx.id}>
                          <Thumbnail
                            style={{ cursor: 'pointer' }}
                            hover
                            floatingType="none"
                            className="type-eg"
                            thumbUrl={`${taskEx.thumbImageUrl}`}
                            fileName={taskEx.title}
                            desc={taskEx.contents}
                            descWhiteSpace="pre-wrap"
                            fileType="IMAGE"
                            onClick={() => handleOpenPreviewImg(taskEx)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <GroupRenderEmpty errorMessage="등록된 작업예시가 없습니다." />
                )}
              </div>
            </div>
          )}
          <PreviewImage preview={previewImgItem} isOpen={isPreviewImgOpen} onCancel={onCancel} />
        </article>
      </div>
    </AppLayoutWithoutSNB>
  );
}

export default WorkBoardPage;
