'use client';

import cx from 'clsx';
import { useEffect, useState, useRef, ReactNode, PropsWithChildren, forwardRef } from 'react';
import Image from 'next/image';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { useRouter } from 'next/navigation';
import useUserStore from '@/hooks/store/useUserStore';
import AppLayout from '@/components/layout/AppLayout';
import PreviewImage from '@/components/common/PreviewImageLayer';
import { prefix } from '@/const';
// eslint-disable-next-line import/no-extraneous-dependencies
import { QRCodeSVG } from 'qrcode.react';

// Swiper CSS 임포트
import 'swiper/css';
import 'swiper/css/navigation';
import { TopButton } from '@/components/common';

type MainLikProps = {
  id: string;
  title: string;
  subTitle?: string;
  text?: string;
  content?: string;
  contentClass?: string;
  href?: string;
  image?: string;
  floatingImage?: string;
  swiperImage?: string[];
  isReverse?: boolean;
};

interface MainGropLikProps {
  id: string;
  title: string;
  subTitle?: string;
  text?: string;
  content?: string;
  contentClass?: string;
  href?: string;
  swiperImage?: string[];
  isReverse?: boolean;
  onClickItem?: (title?: string) => void;
}

type MainIntroduceAction = {
  href?: string;
  className?: string;
  tagType?: string;
  children?: ReactNode;
  onClickItem?: (title?: string) => void;
};

const TemporaryAction = ({
  href,
  className = 'link-main',
  tagType = 'a',
  children,
  onClickItem,
}: PropsWithChildren<MainIntroduceAction>) => {
  const { showAlert } = useAlertStore();
  const { userInfo } = useUserStore();
  const router = useRouter();
  // href 경로가 없는 경우 alert 노출
  const onAlert = async () => {
    if (!href) showAlert({ message: '서비스 준비 중입니다.' });
  };
  // 버튼 클릭 이벤트
  const pageMove = async () => {
    if (onClickItem) {
      onClickItem();
      return;
    }

    if (!href) {
      onAlert();
      return;
    }
    if (!userInfo) {
      // showAlert({
      //   // message: '회원 가입이 필요한 페이지입니다.<br/>회원가입 페이지로 이동합니다.',
      //   message: '로그인이 필요한 페이지입니다.<br/>로그인 페이지로 이동합니다.',
      //   onConfirm: async () => {
      //     // router.push('/signup');
      //     router.push('/login');
      //   },
      // });
      router.push(prefix.login);
      return;
    }
    await router.push(href);
  };
  if (tagType === 'a') {
    return (
      <a href={href || '#none'} className={className} onClick={onAlert}>
        {children}
      </a>
    );
  }
  if (tagType === 'button') {
    return (
      <button type="button" className={className} onClick={pageMove}>
        {children}
      </button>
    );
  }
  return (
    <button className={className} onClick={pageMove}>
      {children}
    </button>
  );
};

function TemporaryGroupLink({ title, text, href, image, tagType, contentType, onClickItem }: any) {
  return (
    contentType && (
      <TemporaryAction href={href} className="link-main line-main-up" tagType={tagType} onClickItem={onClickItem}>
        <span className="thumb-img">
          <Image src={image} alt={title} width={160} height={107} className="img-g" />
          {/* <img src={image} alt="" className="img-g" /> */}
        </span>
        <strong className="tit-link">{title}</strong>
        <p className="txt-link">{text}</p>
      </TemporaryAction>
    )
  );
}

function TemporaryfloatingBar({ id, title, floatingIcon, onClickItem }: any) {
  return (
    <button className="link-move" onClick={onClickItem}>
      <span className={cx('ico-comm', `ico-${floatingIcon}`)} />
      {title}
    </button>
  );
}

// 본문 AI 컨벤트 컴포넌트
const TemporaryContentGroupLink = forwardRef<HTMLDivElement, MainGropLikProps>(
  (
    {
      id,
      title,
      subTitle = '',
      text = '',
      content = '',
      contentClass = '',
      href = '',
      swiperImage = [],
      isReverse,
      onClickItem,
    },
    ref,
  ) => {
    const swiperImageCnt = swiperImage?.length || 0;
    const thumbnailUrl = swiperImage?.[0];
    const swiperImageItems = swiperImage?.map((img: string, idx: number) => ({
      id: `swiper_main_${id}_${idx}`,
      src: img,
    }));

    const handleContentItemClick = (itemTitle?: string) => {
      onClickItem?.(itemTitle);
    };

    return (
      <div ref={ref} id={id} className={cx(`group-info`, `${isReverse && 'type-reverse'}`)}>
        {swiperImageCnt > 1 ? (
          <div className="area-slide">
            <Swiper
              className="slide-info"
              modules={[Pagination, Autoplay]}
              effect="coverflow"
              spaceBetween={50}
              slidesPerView={1}
              pagination={{ clickable: true, horizontalClass: 'num-paging' }}
              // autoplay={{ delay: 2000, disableOnInteraction: false }}
              // loop
            >
              {swiperImageItems.map((image: { id: string; src: string }) => (
                <SwiperSlide key={`folder_${image.id}`} className="item-info">
                  <button type="button" className="btn-info" onClick={() => handleContentItemClick(title)}>
                    <span className="thumb-img">
                      <Image src={image.src} alt="" className="img-g" width={540} height={400} />
                      {/* <img src={image.src} alt="" className="img-g" /> */}
                    </span>
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="area-thumb">
            <button type="button" className="btn-info" onClick={() => handleContentItemClick(title)}>
              <span className="thumb-img" style={{ cursor: 'pointer' }}>
                <Image src={thumbnailUrl} alt="" className="img-g" width={540} height={400} />
                {/* <img src={thumbnailUrl} alt="" className="img-g" /> */}
              </span>
            </button>
          </div>
        )}
        <div className={cx(`area-info`, `${contentClass}`)}>
          <strong className="tit-info">
            <span className="txt-tit">{subTitle || `${text}.`}</span>
            <span className="txt-tit emph-tit">
              {title}
              <span className="emph-line" />
            </span>
          </strong>
          {content && (
            // eslint-disable-next-line react/no-danger
            <div className="txt-info" dangerouslySetInnerHTML={{ __html: content }} />
          )}

          <TemporaryAction href={href} tagType="button" className="btn-start">
            시작하기
            <span className="ico-comm ico-arrow-right-20" />
          </TemporaryAction>
        </div>
      </div>
    );
  },
);
TemporaryContentGroupLink.displayName = 'TemporaryContentGroupLink';

const Introduce = () => {
  const refs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // setRef 함수
  const setRef = (key: string) => (element: HTMLDivElement | null) => {
    refs.current[key] = element;
  };

  const MAIN_LINK_LIST = [
    {
      id: 'playingPlan',
      href: '/work-board/playing-plan/plan-list',
      image: '/images/img_intro_main1.png',
      // floatingIcon: 'illust1-36',
      floatingIcon: 'comm-floating ico-comm-playing-plan',
      swiperImage: ['/images/img_slide_play1.png'],
      title: '놀이 계획 작성',
      text: '손쉽게 놀이를 계획하세요',
      subTitle: '손쉽게 놀이를 계획하세요.',
      content: `키워드 하나, 카드 하나로 간편하게 놀이를 계획하고, 맞춤형 활동과 연관 자료를 자동으로 제공받을 수 있습니다.<br/>
                AI가 우리 반에 맞는 활동을 추천해 주어 창의적인 수업 준비가 가능하며,<br/>
                교사는 다양한 수업을 쉽게 계획하고 아이들은 창의력 발달에 도움을 받을 수 있습니다.`,
      isQuick: true,
      contentType: 'apply',
    },
    {
      id: 'playingReport',
      // href: '/work-board/playing-report',
      href: '/work-board/report',
      image: '/images/img_intro_main2.png',
      // floatingIcon: 'illust2-36',
      floatingIcon: 'comm-floating ico-comm-playing-report',
      swiperImage: ['/images/img_slide_report1.png'],
      title: '놀이 보고서',
      text: '포스트잇에 힘들게 적지 마세요',
      subTitle: '보고서 작성을 도와줘요.',
      content: `매주 놀이 보고서를 정리하느라 힘든 교사를 위해 사진, 영상, 음성, 디지털 메모로 놀이 순간을 손쉽게 기록하고 기록한 자료를 AI가 자동으로 분석하여 놀이 보고서 작성에 도움을 줍니다.<br/>
                킨더보드 AI는 수집된 자료를 시간별로 정리하고, 사진 속 아이들의 놀이를 자동으로 분석하여 더 생생하고 구체적인 기록을 생성합니다.`,
      isQuick: true,
      contentType: 'apply',
    },
    {
      id: 'studentRecord',
      href: '/work-board/student-record',
      image: '/images/img_intro_main3.png',
      // floatingIcon: 'illust3-36',
      floatingIcon: 'comm-floating ico-comm-student-record',
      swiperImage: ['/images/img_slide_record1.png'],
      title: '아이 관찰 기록',
      text: '발달 결과가 한 눈에 보여요',
      subTitle: '쉽고 빠르고 정확게 관찰할수 있는',
      content: `교사가 우리 반 아이들의 발달 상황을 빠르고 쉽게 기록하고, 그래프를 조정하여 직관적으로 한눈에 확인할 수 있습니다.<br/>
                또한, 교육부 유치원 생활기록부와 서울시 교육청 유치원 신학기 도움자료 등 지표의 근거로 AI가 교사의 의견과 아이들의 데이터를 종합 분석하여 전문적인 관찰 기록을 
                자동으로 생성합니다.`,
      isQuick: true,
      contentType: 'apply',
    },
    {
      id: 'imageSort',
      href: '/work-board/image-sort',
      image: '/images/img_intro_main4.png',
      // floatingIcon: 'illust4-36',
      floatingIcon: 'comm-floating ico-comm-image-sort',
      swiperImage: ['/images/img_slide_sort1.png', '/images/img_slide_report1.png'],
      title: '사진 분류',
      text: '아이들 사진분류 AI에게 맡기세요',
      subTitle: '아이들 사진 분류 AI에게 맡기세요',
      content: `AI가 아이들 사진을 자동으로 정리하여 교사가 수업에 집중할 수 있도록 돕습니다.<br/>
                사진을 아이별 폴더로 자동으로 분류해 쉽게 공유할 수 있으며, 놀이 활동별로도 정리할 수 있습니다.<br/>
                전용 앱을 통해 사진을 업로드하면 AI가 자동으로 분류하여 문서 작업과 공유를 더욱 편리하게 만들어 줍니다.`,
      isQuick: true,
      contentType: 'fast',
      contentClass: 'info-type2',
    },
    {
      id: 'imageMerge',
      href: '/work-board/image-merge',
      image: '/images/img_intro_main5.png',
      // floatingIcon: 'illust5-36',
      floatingIcon: 'comm-floating ico-comm-image-merge',
      swiperImage: ['/images/img_slide_edit1.png', '/images/img_slide_report1.png'],
      title: '아이 합성',
      text: '얼굴과 배경을 분리해줘요',
      subTitle: '자동으로 얼굴과 배경을 분리해줘요',
      content: `AI가 아이들의 얼굴을 정확히 인식해 배경과 분리하고,<br/>
                자동으로 다양한 이미지와 자연스럽게 합성합니다.<br/>
                학급 소개판 제작이나 아이들 얼굴로 창의적인 콘텐츠 활용이 쉬워져<br/>
                재미있고 다양한 합성 사진을 손쉽게 만들 수 있습니다.`,
      isQuick: true,
      contentType: 'fast',
      contentClass: 'info-type3',
    },
    {
      id: 'imageFacePrivacy',
      href: '/work-board/image-face-privacy',
      image: '/images/img_intro_main6.png',
      // floatingIcon: 'illust6-36',
      floatingIcon: 'comm-floating ico-comm-image-face-privacy',
      swiperImage: ['/images/img_slide_face1.png', '/images/img_slide_report1.png'],
      title: '초상권 해결',
      text: '자동으로 지우거나 가려요',
      subTitle: '자동으로 지우거나 가려요',
      content: `놀이 수업 중 촬영한 수많은 사진의 아이들 얼굴을 킨더보드 AI가<br/>
                자동으로 마스킹 하여 초상권 침해 없이 안전하게 공유할 수 있습니다.<br/>
                번거롭게 직접 수정할 필요 없이, 초상권을 보호하면서도 예쁘고 재미있는<br/>
                사진을 만들 수 있습니다.<br/>
                이름이나 기관 정보도 자동으로 가려주어 정보 보호가 간편해집니다.`,
      isQuick: true,
      contentType: 'fast',
      contentClass: 'info-type4',
    },
    {
      id: 'app',
      href: '',
      // floatingIcon: 'illust7-36',
      floatingIcon: 'comm-floating ico-comm-exclusive-app-for-teachers',
      swiperImage: [],
      title: '교사용 APP',
      isQuick: true,
    },
  ];

  const QUICK_LINK_LIST = MAIN_LINK_LIST.filter((link) => link.isQuick);

  const CONTENT_GROUP_TYPE = [
    {
      title: '업무지원 AI',
      description: '교사가 준비해야 하는 자료들을 자동으로 생성해 줍니다.',
      icon: 'ico-introduce2',
      className: 'content-apply',
      list: MAIN_LINK_LIST.filter((link) => link.contentType === 'apply'),
    },
    {
      title: '빠른업무 AI',
      description: '아이들 사진을 자동으로 관리하세요.',
      icon: 'ico-introduce3',
      className: 'content-fast',
      list: MAIN_LINK_LIST.filter((link) => link.contentType === 'fast'),
    },
  ];

  const APP_STORE_LIST = [
    {
      id: 'apple',
      name: 'APP STORE',
      storeImgSrc: '/images/temp_app_store.png',
      storeLink: 'https://www.apple.com/kr/app-store/',
      target: '_blank',
      qrImgSrc: '/images/temp_app_qr.png',
    },
    {
      id: 'android',
      name: 'Google Play',
      storeImgSrc: '/images/temp_google_play.png',
      storeLink: 'https://play.google.com/store/apps',
      target: '_blank',
      qrImgSrc: '/images/temp_google_qr.png',
    },
  ];

  // 서비스 소개 하단 영역
  const SERVIE_INTRODUCE_FOOTER = [
    {
      id: 'footer_01',
      imgSrc: '/images/img_intro_feature1.png',
      content: '아이들 놀이 계획을 APP에서<br />확인하세요',
    },
    {
      id: 'footer_02',
      imgSrc: '/images/img_intro_feature2.png',
      content: '수업 중 기록 파일을<br />자동으로 정리하세요<br />(사진, 영상, 메모, 음성)',
    },
    {
      id: 'footer_03',
      imgSrc: '/images/img_intro_feature3.png',
      content: '우리 반 아이들을 쉽게<br>관리하세요',
    },
  ];

  // 우측 플로팅 메뉴바 관련
  const [isSticky, setIsSticky] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 작업 예시
  const previewImageTemplate = {
    title: '',
    contents: '',
    thumbImageUrl: '',
    fullImageUrl: '/images/kinder_board_introduce.png',
  };

  const [isPreviewImgOpen, setIsPreviewImgOpen] = useState(false);
  const [previewImgItem, setPreviewImgItem] = useState<typeof previewImageTemplate>(previewImageTemplate);

  const handleOpenPreviewImg = (title: string) => {
    const previewItem = {
      title,
      fullImageUrl: previewImageTemplate.fullImageUrl,
    };
    setPreviewImgItem(previewItem as typeof previewImageTemplate);
    setIsPreviewImgOpen(true);
  };

  const onCancel = async () => {
    setIsPreviewImgOpen(false);
    setPreviewImgItem(previewImageTemplate);
  };

  const handlePageMove = (key: string) => {
    const targetDiv = refs.current[key];
    if (targetDiv) {
      targetDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const topOffset = contentRef.current.getBoundingClientRect().top;
        // setIsSticky(topOffset <= 0);
        setIsSticky(topOffset <= -1000);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <AppLayout>
      {/* 상당 배너 */}
      <h3 className="screen_out">메인</h3>
      <div className="content-main">
        <div className="bg-content">
          <video poster="/images/bg_intro_main.png" autoPlay muted loop playsInline className="video_visual">
            <source src="/video/bg_intro_main.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="inner-content">
          <span className="ico-comm ico-introduce4">AI Service KinderBoard</span>
          <strong className="tit-main">교사의 시간을 교사의 가치로 만들어 드립니다</strong>
          <div className="group-link">
            {/* 상단 그룹 메뉴 */}
            {MAIN_LINK_LIST.map((link) => (
              <TemporaryGroupLink
                key={`topGroupLink${link.id}`}
                {...link}
                tagType="scroll"
                onClickItem={() => handlePageMove(link.id)}
              />
            ))}
          </div>
        </div>
      </div>
      {/* 상당 배너 */}

      {/* floating quick menu */}
      <div className={cx('floating-move', isSticky && 'sticky')} style={{ opacity: `${isSticky ? 1 : 0}` }}>
        <div className="group-move">
          {QUICK_LINK_LIST.map((link) => (
            <TemporaryfloatingBar
              key={`floatingMenu${link.id}`}
              {...link}
              onClickItem={() => handlePageMove(link.id)}
            />
          ))}
        </div>
        <TopButton isIndependent />
      </div>
      {/* floating quick menu */}

      {/* 중간 배너 */}
      <div ref={contentRef} className="content-work">
        <div className="inner-content">
          <div className="group-title">
            <strong className="ico-comm ico-introduce1">
              Kinder Board 하나로 교사가 준비해야하는 업무를 해결합니다.
            </strong>
          </div>
          <div className="thumb-img">
            <Image src="/images/temp_intro_work.png" alt="" className="img-g" width="833" height="540" />
            {/* <img src="/images/temp_intro_work.png" alt="" className="img-g" /> */}
          </div>
        </div>
      </div>
      {/* 중간 배너 */}

      {/* AI 목록 */}
      {CONTENT_GROUP_TYPE.map(
        (content: { className: string; title: string; icon: string; description: string; list: MainLikProps[] }) => {
          return (
            <div key={content.className} className={cx(`content-info`, `${content.className}`)}>
              <div className="inner-content">
                <div className="group-title">
                  <strong className={cx(`ico-comm`, `${content.icon}`)}>{content.title}</strong>
                  <p className="txt-content">{content.description}</p>
                </div>
                {content.list.map((item: MainLikProps, idx: number) => {
                  return (
                    <TemporaryContentGroupLink
                      ref={setRef(item.id)}
                      key={`constentItem_${item.id}_2`}
                      isReverse={idx % 2 === 1}
                      {...item}
                      onClickItem={() => handleOpenPreviewImg(item.title)}
                    />
                  );
                })}
              </div>
            </div>
          );
        },
      )}
      {/* AI 목록 */}

      {/* 하단 리뷰 */}
      <div className="content-review">
        <div className="inner-content">
          <div className="group-title">
            <strong className="tit-content">
              수업 준비에 많은 어려움을 겪고 있는 교사들을 위해
              <br />
              교사를 지원할 서비스가 절실히 필요합니다.
            </strong>
          </div>
          <div className="group-review">
            <div className="item-review">
              <div className="thumb-img">
                <Image src="/images/img_intro_review1.png" alt="" className="img-g" width={400} height={400} />
                {/* <img src="/images/img_intro_review1.png" alt="" className="img-g" /> */}
              </div>
              <div className="box-review">
                <span className="ico-comm ico-tail2" />
                <p className="txt-review">
                  “놀이 계획, 수업 자료 준비, 보고서 작성이 번거롭고 시간이 많이 걸렸는데, 이제 자동으로 준비되어 부담이
                  줄었고 특히 새로운 교육 자료를 찾느라 밤늦게까지 인터넷을 찾던 일이 사라져 훨씬 편해졌어요.”
                </p>
              </div>
            </div>
            <div className="item-review">
              <div className="thumb-img">
                <Image src="/images/img_intro_review2.png" alt="" className="img-g" width={400} height={400} />
                {/* <img src="/images/img_intro_review2.png" alt="" className="img-g" /> */}
              </div>
              <div className="box-review">
                <span className="ico-comm ico-tail2" />
                <p className="txt-review">
                  “아이별로 사진을 분류하고 부모님께 공유하는 과정이 번거롭고 시간이 많이 걸렸는데, 이제 손쉽게 해결할
                  수 있고 특히 아이들 얼굴을 가리거나 편집하는 작업이 자동으로 준비되어 시간을 아낄 수 있어요.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 하단 리뷰 */}

      {/* 하단 app */}
      <div ref={setRef('app')} className="content-app">
        <div className="inner-content">
          {/* application link */}
          <div className="group-title">
            <em className="tit-sub">교사 전용 APP</em>
            <strong className="tit-content">아이스크림 킨더보드 앱</strong>
          </div>
          <div className="group-app">
            {APP_STORE_LIST.map((store) => {
              return (
                <div className="item-app" key={store.id}>
                  <strong className="tit-app">{store.name}</strong>
                  <div className="wrap-store">
                    <a href={store.storeLink} className="link-store" target={store.target}>
                      <Image src={store.storeImgSrc} alt="" className="img-g" width={214} height={80} />
                      {/* <img src={store.storeImgSrc} alt="" className="img-g" /> */}
                    </a>
                    <div className="thumb-qr">
                      <QRCodeSVG
                        value={store.storeLink}
                        size={60}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="L" // 'L', 'M', 'Q', 'H'
                      />
                      {/* <Image src={store.qrImgSrc} alt="" className="img-g" width={60} height={60} /> */}
                      {/* <img src={store.qrImgSrc} alt="" className="img-g" /> */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* application link */}

          <div className="group-subtitle">
            <strong className="sub-content">
              교사가 기록한 활동 자료를 AI가 자동 분석·분류해 Web에 저장해 줍니다.
            </strong>
          </div>
          <div className="group-feature">
            {SERVIE_INTRODUCE_FOOTER &&
              SERVIE_INTRODUCE_FOOTER.map((tooterItem) => (
                <div key={tooterItem.id} className="item-feature">
                  <div className="thumb-img">
                    <img src={tooterItem.imgSrc} alt="" className="img-g" />
                  </div>
                  <p className="txt-feature" dangerouslySetInnerHTML={{ __html: tooterItem.content }} />
                </div>
              ))}
          </div>
        </div>
      </div>
      <PreviewImage preview={previewImgItem} isOpen={isPreviewImgOpen} onCancel={onCancel} />
      {/* app */}
    </AppLayout>
  );
};

export default Introduce;
