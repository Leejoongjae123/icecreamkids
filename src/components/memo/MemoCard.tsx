// 'use client';

// import React, { useEffect, useState } from 'react';
// import { MemoEditModal } from '@/components/modal/memo-edit';
// import styles from './MemoCard.module.scss';
// import VocalMemo from './VocalMemo';
// import type { IMemoData } from './types';

// export default function MemoCard() {
//   const [memoData, setMemoData] = useState<IMemoData | null>(null);
//   const [isVocalMemoOpen, setIsVocalMemoOpen] = useState(false);
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [editedContent, setEditedContent] = useState('');
//   const [editedTitle, setEditedTitle] = useState('제목 예시'); // 제목 상태 추가

//   useEffect(() => {
//     // API 호출 (임시 데이터 세팅)
//     setTimeout(() => {
//       const fetchedData: IMemoData = {
//         id: 1,
//         users: [
//           { id: 1, name: '김이름', avatarUrl: '/avatars/avatar1.png' },
//           { id: 2, name: '이이름', avatarUrl: '/avatars/avatar2.png' },
//           { id: 3, name: '박이름' },
//           { id: 4, name: '최이름' },
//         ],
//         content:
//           '이것은 메모 예제입니다. 메모는 최대 500자까지 입력할 수 있으며, 길이가 3줄을 초과하면 스크롤이 적용됩니다.이것은 메모 예제입니다. 메모는 최대 500자까지 입력할 수 있으며, 길이가 3줄을 초과하면 스크롤이 적용됩니다.이것은 메모 예제입니다. 메모는 최대 500자까지 입력할 수 있으며, 길이가 3줄을 초과하면 스크롤이 적용됩니다.이것은 메모 예제입니다. 메모는 최대 500자까지 입력할 수 있으며, 길이가 3줄을 초과하면 스크롤이 적용됩니다.이것은 메모 예제입니다. 메모는 최대 500자까지 입력할 수 있으며, 길이가 3줄을 초과하면 스크롤이 적용됩니다.이것은 메모 예제입니다. 메모는 최대 500자까지 입력할 수 있으며, 길이가 3줄을 초과하면 스크롤이 적용됩니다.',
//       };
//       setMemoData(fetchedData);
//       setEditedContent(fetchedData.content);
//       // 만약 데이터에 제목이 없으면 기존 default 제목 유지, 있다면 fetchedData.title 활용
//     }, 1000);
//   }, []);

//   const toggleVocalMemo = () => {
//     setIsVocalMemoOpen((prev) => !prev);
//   };

//   const openEditModal = () => {
//     setIsEditModalOpen(true);
//   };

//   const closeEditModal = () => {
//     setIsEditModalOpen(false);
//     // 편집 취소 시 원래 내용으로 복원
//     if (memoData) {
//       setEditedContent(memoData.content);
//       setEditedTitle('제목 예시');
//     }
//   };

//   const handleSaveEditedContent = () => {
//     // API 호출 등 편집된 내용을 저장하는 로직 추가
//     if (memoData) {
//       setMemoData({ ...memoData, content: editedContent });
//     }
//     setIsEditModalOpen(false);
//   };

//   if (!memoData) {
//     return <div>로딩 중...</div>;
//   }

//   const { users, content } = memoData;
//   const visibleUsers = users.slice(0, 2);
//   const hiddenUsers = users.slice(2);
//   const hiddenCount = hiddenUsers.length;

//   return (
//     <>
//       <div className={styles.memoCard}>
//         {/* 헤더: 아바타 + 더보기 버튼 */}
//         <div className={styles.header}>
//           <div className={styles.avatars}>
//             {visibleUsers.map((user) => (
//               <div key={user.id} className={styles.avatar}>
//                 {user.avatarUrl && <img src={user.avatarUrl} alt={user.name} className={styles.avatarImage} />}
//                 <span className={styles.avatarName}>{user.name}</span>
//               </div>
//             ))}
//             {hiddenCount > 0 && (
//               <div className={styles.moreWrapper}>
//                 <span className={styles.moreButton}>+{hiddenCount}</span>
//                 <div className={styles.tooltip}>
//                   {hiddenUsers.map((user) => (
//                     <span key={user.id} className={styles.hiddenUser}>
//                       {user.name}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//           <div className={styles.actions}>
//             <button type="button" className={styles.audioButton} onClick={toggleVocalMemo}>
//               ▶️
//             </button>
//             <button type="button" className={styles.editButton} onClick={openEditModal}>
//               ✏️
//             </button>
//           </div>
//         </div>

//         {/* 메모 내용 */}
//         <div className={styles.content}>
//           <p>{content}</p>
//         </div>

//         {/* 푸터 */}
//         <div className={styles.footer}>
//           <span>{new Date().toLocaleDateString()}</span>
//         </div>
//       </div>

//       {/* 오디오 메모 */}
//       {isVocalMemoOpen && (
//         <div className={styles.vocalMemoWrapper}>
//           <VocalMemo />
//         </div>
//       )}

//       {/* 편집 모달 */}
//       {isEditModalOpen && (
//         <MemoEditModal
//           initialTitle={editedTitle}
//           initialContent={editedContent}
//           onTitleChange={(e) => setEditedTitle(e.target.value)}
//           onChange={(e) => setEditedContent(e.target.value)}
//           onCancel={closeEditModal}
//           onSave={handleSaveEditedContent}
//         />
//       )}
//     </>
//   );
// }

'use client';

import type React from 'react';
import { forwardRef, useState } from 'react';
import cx from 'clsx';

interface MemoProps {
  className?: string;
  profile: [
    {
      key?: string;
      thumb?: string;
      text: string;
    },
  ];
  text: string;
  date: string;
  audio: boolean;
  style?: React.CSSProperties;
}

const MemoCard = forwardRef<HTMLDivElement, MemoProps>(
  ({ className, profile, text, date, audio = false, style }: MemoProps, ref) => {
    const [openMore, setOpenMore] = useState<boolean>(false);
    const [openAudio, setOpenAudio] = useState<boolean>(audio);

    const profileCount = profile.length;
    const profileArr = profileCount > 2 ? profile.slice(0, 2) : profile;
    const renderProfile = (user: any, key: number) => (
      <div className="profile-head" key={key}>
        <span
          className="thumb-profile"
          style={{
            backgroundImage: user.thumb && `url(/images/${user.thumb})`,
          }}
        >
          {!user.thumb && <span className="ico-comm ico-profile-32" />}
        </span>
        <div className="wrap-name">
          <em className="name-profile">{user.text.length > 5 ? `${user.text.slice(0, 5)}...` : user.text}</em>
          <div>툴팁이 있는 위치입니다. ㅎㅎ</div>
          {/* {user.text.length > 5 && <Tooltip sizeType="small" position="top" contents={user.text} />} */}
        </div>
      </div>
    );

    /**
     * * 오디오
     */
    // 예시 오디오 데이터
    const vocalMemo = '/audio/sample.mp3';

    return (
      <div ref={ref} className={cx('item-memo', className)} style={style}>
        <div className="head-memo">
          {profileArr.map((item, idx) => renderProfile(item, idx))}
          {profileCount > 2 && (
            <div className="more-head">
              <button type="button" className="btn-more" onClick={() => setOpenMore(!openMore)}>
                +{profileCount - 2}
              </button>
              <div>메뉴가 있는 위치입니다 ㅎㅎ</div>
              {/* <Menu list={profile.slice(2)} text show={openMore} /> */}
            </div>
          )}
        </div>
        <div className="content-memo">
          <p className="text-content">{text}</p>
        </div>
        <div className="info-memo">
          <dl className="date-info">
            <dt className="screen_out">날짜</dt>
            <dd>{date}</dd>
          </dl>
          <div className="util-info">
            <button type="button" className="btn-audio" onClick={() => setOpenAudio(!openAudio)}>
              <span className="ico-comm ico-audio-20" />
            </button>
            <button type="button" className="btn-modify">
              <span className="ico-comm ico-message-20" />
            </button>
          </div>
        </div>
        {openAudio && (
          <div className="audio-memo">
            <audio className="item-audio" controls>
              <source src={vocalMemo} type="audio/mpeg" />
              <track kind="captions" />
              {/* fallback */}이 문장은 사용자의 웹 브라우저가 audio 요소를 지원하지 않을 때 나타납니다.
            </audio>
          </div>
        )}
      </div>
    );
  },
);
MemoCard.displayName = 'MemoCard';

export default MemoCard;
