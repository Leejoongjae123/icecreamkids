'use client';

import { useRouter } from 'next/navigation';
import useUserStore from '@/hooks/store/useUserStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { Thumbnail } from '@/components/common';
import GroupRenderEmpty from '@/components/common/GroupRenderEmpty';
import { prefix } from '@/const';
import { photoFolderTreeList } from '../../(protected)/recent-work-history/type';

interface QuickWorkAIProps {
  photoFolderTree?: photoFolderTreeList;
}

function QuickWorkAI({ photoFolderTree = {} }: QuickWorkAIProps) {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { showAlert } = useAlertStore();

  // 빠른 업무 AI
  const quickWorkAIPaths = [
    {
      id: 1,
      thumbImageUrl: 'thumb_ai1.png',
      title: '사진 분류',
      description: 'AI가 자동으로 아이별로 사진을\n분류해 줍니다.',
      route: 'image-sort',
      taskType: '',
    },
    {
      id: 2,
      thumbImageUrl: 'thumb_ai2.png',
      title: '아이 합성',
      description: '얼굴을 배경과 분리하고\n이미지와 자연스럽게 합성합니다.',
      route: 'image-merge',
      taskType: '',
    },
    {
      id: 3,
      thumbImageUrl: 'thumb_ai3.png',
      title: '초상권 해결',
      description: '수업 중 촬영한 수많은 사진의 아이들 얼굴을 AI가 자동으로 마스킹 합니다.',
      route: 'image-face-privacy',
      taskType: '',
    },
    {
      id: 4,
      thumbImageUrl: 'thumb_ai4.png',
      title: '컬러링 도안 생성',
      description: '도안에 컬러링을 하여 창의적인 콘텐츠를 생성합니다.',
      route: '',
      taskType: 'SKETCH_CREATION',
    },
    {
      id: 5,
      thumbImageUrl: 'thumb_ai5.png',
      title: '아이 사진 정리',
      description: '1년 동안의 사진을 한 눈에 \n정리하여 보여줍니다.',
      route: '',
      taskType: 'PHOTO_ALBUM',
    },
  ];

  const handleTumbnailMove = ({ route, taskType }: { title: string; route: string; taskType: string }) => {
    if (taskType) {
      const smartFolderId = photoFolderTree?.[taskType as keyof typeof photoFolderTree];
      if (smartFolderId) {
        router.push(`material-board/photo/${smartFolderId}`);
        return;
      }
      if (!userInfo) {
        router.push(prefix.login);
        return;
      }
    }
    if (!route) {
      showAlert({ message: '서비스 준비 중입니다.' });
      return;
    }
    router.push(`/work-board/${route}`);
  };

  return (
    <div className="inner-content">
      <h4 className="tit-content">빠른 업무 AI</h4>
      {quickWorkAIPaths && quickWorkAIPaths.length > 0 ? (
        <ul className="list-thumbnail">
          {quickWorkAIPaths?.map((work) => {
            return (
              <li key={work.id}>
                <Thumbnail
                  style={{ cursor: 'pointer' }}
                  hover
                  floatingType="none"
                  className="type-ai"
                  thumbUrl={`/images/${work.thumbImageUrl}`}
                  fileName={work.title}
                  desc={work.description}
                  fileType="IMAGE"
                  onClick={() => handleTumbnailMove(work)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <GroupRenderEmpty errorMessage="빠른 업무 AI가 없습니다." icon="ico-illust4" />
      )}
    </div>
  );
}

export default QuickWorkAI;
