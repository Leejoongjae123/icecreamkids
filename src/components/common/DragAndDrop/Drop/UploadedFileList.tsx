/**
 * * 파일 업로드 목록 컴포넌트
 * TODO: 타입 변경 및 코드 리팩토링을 통해 확장성 향상
 * @param {IUploadedFileListProps} { files, onRemove }
 * @returns {ReactNode}
 */
import getIndoorOrOutdoorIcon from '@/utils/DragAndDrop/getIndoorOrOutdoorIcon';
import cx from 'clsx';
import { Loader } from '@/components/common';
import type { IUploadedFileListProps } from './types';

export const UploadedFileList = function FileList({ files, onRemove }: IUploadedFileListProps) {
  const getColorByCreationType = (creationType?: string) => {
    switch (creationType) {
      case 'TYPE_B':
        return 'card-type02';
      case 'TYPE_C':
        return 'card-type03';
      default:
        return '';
    }
  };

  return (
    <div className="group-list">
      <div className="inner-list">
        {files.map((file, idx) => {
          if (!file) return false;

          const {
            aiGenerationFocusType,
            indoorOrOutdoor,
            recommendedPlayingCardSubject,
            lecturePlan,
            parsedRecommendedPlayingCardData,
          } = file;

          // 중복된 널 병합 로직
          const focusType =
            aiGenerationFocusType ??
            lecturePlan?.aiGenerationFocusType ??
            parsedRecommendedPlayingCardData?.aiGenerationFocusType;

          const indoorType =
            indoorOrOutdoor ?? lecturePlan?.indoorType ?? parsedRecommendedPlayingCardData?.indoorOrOutdoor;
          const subject =
            recommendedPlayingCardSubject ??
            lecturePlan?.subject ??
            parsedRecommendedPlayingCardData?.recommendedPlayingCardSubject;

          // file.id 가 있으면 사용, 없으면 idx(Fallback) 사용
          const uniqueKey = file.id ?? idx;

          if (!subject) return <Loader key={uniqueKey} loadingMessage="" />;

          return (
            <div key={uniqueKey} title={subject} className={cx('item-list', getColorByCreationType(focusType))}>
              <div className="thumb-list">
                <span className={cx('ico-comm', getIndoorOrOutdoorIcon(indoorType, 20))} />
              </div>
              <span className="txt-list">{subject}</span>
              <button type="button" className="btn-list-del" onClick={() => onRemove(file.id!)}>
                <span className="ico-comm ico-close-16-g">삭제</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
