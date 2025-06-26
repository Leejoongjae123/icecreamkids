'use client';

/**
 * NOTE: TanstackQuery with Client Side 예시 입니다.
 */

import {
  Button,
  Calendar,
  Checkbox,
  Form,
  FormField,
  Tooltip,
  Input,
  Loader,
  ModalBase,
  Radio,
  RangeCalendar,
  Select,
  TextHighlight,
  Thumbnail,
  Textarea,
} from '@/components/common';
import type React from 'react';
import { type ChangeEvent, forwardRef, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from '@/hooks/store/useSnackbarStore';
import { useToast } from '@/hooks/store/useToastStore';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import Image from 'next/image';
import { convertImageFileToBase64 } from '@/utils';
import { FLOATING_BUTTON_TYPE } from '@/const';
import useCaptureImage from '@/hooks/useCaptureImage';
import Link from 'next/link';
import HwpViewer from '@/components/common/HwpViewer/index';
import KeywordInput from '@/components/workBoard/keyword';
import { useInput } from '@/hooks/useInput';
import FloatingMenu from '@/components/common/FloatingMenu';
import type { SmartFolderItemResultFileType } from '@/service/file/schemas';
import useS3FileUpload from '@/hooks/useS3FileUpload';
import PDFViewer from '@/components/common/PreviewLayer/pdfViewer';
import { notFound } from 'next/navigation';

const Field = forwardRef<HTMLButtonElement, any>(({ name, children }, ref) => {
  return (
    <div style={{ padding: '20px 0px 10px 10px' }}>
      <h2>{name}</h2>
      {children}
    </div>
  );
});

Field.displayName = 'Field';

const ExamplePage = () => {
  if (process.env.NODE_ENV === 'production') {
    notFound(); // production 환경이면 404
  }

  const [inputState, setInputState] = useState('');

  const formSchemaMany = z.object({
    exInput: z.string().min(1, {
      message: '에러!!! 한글자 이상 입력해주세요.',
    }),
    exSelected: z.union([z.string(), z.array(z.string())]).refine(
      (value) => {
        // string 일 우 비어있는 값 체크
        if (typeof value === 'string' && value.trim() === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      },
      {
        message: '옵션 선택해라',
      },
    ),
    exSelected2: z.string().min(1, { message: '옵션을 선택해주세요.' }),
    exCheckbox: z.array(z.string()),
    exRadio: z.string(), // Radio 필드 추가
  });

  const form = useForm<z.infer<typeof formSchemaMany>>({
    resolver: zodResolver(formSchemaMany),
    defaultValues: {
      exInput: '123123',
      exSelected: ['value1'],
      exSelected2: '',
      exCheckbox: ['exCheckbox1'],
      exRadio: 'radio1', // Radio의 기본값 설정
    },
    mode: 'onSubmit',
  });

  const onSubmit = (values: z.infer<typeof formSchemaMany>) => {
    console.log('onSubmit', values);
  };

  const checkboxList = [
    { id: 'exCheckbox1', label: '예제 체크박스1' },
    { id: 'exCheckbox2', label: '예제 체크박스2' },
  ];

  const radioOptions = [
    { text: '라디오 옵션 1', value: 'radio1' },
    { text: '라디오 옵션 2', value: 'radio2' },
    { text: '라오 옵션 3', value: 'radio3' },
  ];

  const [image, setImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>();

  const handleInput = async () => {
    if (!inputRef.current?.files) return;
    const base64 = await convertImageFileToBase64(inputRef.current.files[0]);
    setImage(base64);
  };

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isHwpPopOpen, setIsHwpPopOpen] = useState(false);
  const [isModalOpen, setIsModalIOpen] = useState(false);

  const handleClickModal = () => {
    setIsModalIOpen(true);
  };

  const handleConfirm = () => {
    setIsModalIOpen(false);
  };

  const handleCancel = () => {
    setIsModalIOpen(false);
  };

  const { showAlert } = useAlertStore();

  const handleClickAlert1 = () => {
    showAlert({
      message: 'Alert Message',
      onConfirm: () => {},
    });
  };

  const handleClickAlert2 = () => {
    showAlert({
      message: 'Alert Message',
      onConfirm: () => {
        console.log('confirm');
      },
      onCancel: () => {
        console.log('close');
      },
    });
  };

  const addToast = useToast((state) => state.add);
  const handleToast = (toastMessage: string) => {
    addToast({
      message: toastMessage,
    });
  };

  const addSnackbar = useSnackbar((state) => state.add);
  const handleSnackbar = () => {
    addSnackbar({
      message: '스낵바 테스트, 5초간 활성화',
      actionFunc: () => {
        console.log('스낵바 테스트 콘솔');
      },
      actionText: '콘솔 찍기',
    });
  };
  /** 임시 파일 */
  const TestFiles = [
    {
      url: '/sample.hwp',
      name: 'sample.hwp',
      size: 12345,
      fileType: 'DOCUMENT',
    },
    {
      url: '/images/loading_img.svg',
      name: 'loading_img.svg',
      size: 67890,
      fileType: 'IMAGE',
    },
    {
      url: '/images/아이관찰그래프.png',
      name: '아이관찰그래프.png',
      size: 12345678,
      fileType: 'IMAGE',
    },
    {
      url: '/images/thumb_image.png',
      name: 'thumb_image.png',
      size: 54321,
      fileType: 'IMAGE',
    },
    {
      url: '/sample.hwp',
      name: 'sample.hwp',
      size: 12345,
      fileType: 'DOCUMENT',
    },
    /** 에러 이미지 */
    { url: '/error.png', name: 'error.png', size: 54321, fileType: 'IMAGE' },
    /** 활동 카드 */
    {
      url: '/sample.hwp',
      name: 'sample.hwp',
      size: 12345,
      fileType: 'DOCUMENT',
    },
  ];
  /** 체크박스 버튼 컨트롤 */
  const [editStates, setEditStates] = useState<Record<string, boolean>>({});

  /** 드롭 다운 컨트롤 */
  const [openDropDown, setOpenDropDown] = useState<boolean>(false);
  const onDropDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpenDropDown((prev) => !prev);
  };

  /** 드롭 다운 메뉴 */
  const dropDownMenu = {
    save: true,
    list: [
      {
        key: 'share',
        text: '공유 관리',
        action: () => {
          console.log('공유 관리');
        },
      },
      {
        key: 'delete',
        text: '삭제',
        action: () => {
          console.log('삭제');
        },
      },
      {
        key: 'copy',
        text: '복사',
        action: () => {
          console.log('복사');
        },
      },
      {
        key: 'save',
        text: '저장',
        action: () => {
          console.log('저장');
        },
      },
    ],
  };

  // 특정 파일의 edit 상태를 토글
  const handleEditToggle = (fileName: string) => {
    console.log(fileName);

    setEditStates((prev) => ({
      ...prev,
      [fileName]: !prev[fileName], // 해당 파일의 상태만 토글
    }));
  };

  // 툴팁
  const handleMenuClick = (option: string) => {
    console.log('option', option);
  };

  // 이미지 테스트
  const [url, setUrl] = useState<string>('');

  const { downloadImage, previewImage, getImageURL } = useCaptureImage();

  const [isImageModalOpen, setIsImageModalIOpen] = useState(false);

  const handleOpenImageModal = () => {
    setIsImageModalIOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalIOpen(false);
  };

  const handleImageDownload = async () => {
    await downloadImage('capture-area', 'example.png');
  };
  const handleImagePreview = async () => {
    await previewImage('capture-area');
  };
  const handleImagePreviewWithAlert = async () => {
    const imgUrl = await getImageURL('capture-area');
    if (imgUrl) {
      setUrl(imgUrl);
      handleOpenImageModal();
    }
  };
  const handleGetImageLink = async () => {
    const link = await getImageURL('capture-area');
    if (link) {
      showAlert({
        message: link.slice(0, 100), // 너무 길어서 잘랐습니다.
      });
    }
  };
  const sampleData = ['react', 'next', 'vue', 'nuxt'];

  const [query, setQuery] = useState('');
  const results = sampleData.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  const handleGetKeyword = (val: any) => {
    console.log('handleGetKeyword', val);
  };

  const { inputValue, setInputValue, onClear } = useInput('asdasdadasd');

  // 플로팅 메뉴
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);

  const actionButtonList = [
    {
      key: 'copy',
      label: '복사',
      action: () => {
        console.log('복사');
      },
    },
    {
      key: 'update',
      label: '수정',
      action: () => {
        console.log('수정');
      },
    },
    {
      key: 'restore',
      label: '복원',
      action: () => {
        console.log('복원');
      },
    },
    {
      key: 'hard-delete',
      label: '영구삭제',
      action: () => {
        console.log('영구삭제');
      },
    },
  ];

  // 뷰 모드 상태 관리
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'list'>('grid');

  // S3 파일 업로드
  const [fileInfo, setFileInfo] = useState<File | null>(null);

  const { postFile } = useS3FileUpload();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target?.files) return;
    setFileInfo(e.target?.files[0]);
    const result = await postFile({
      file: e.target.files[0],
      fileType: 'IMAGE',
      taskType: 'STORY_BOARD',
      source: 'FILE',
      thumbFile: e.target.files[0],
    });
    if (result) console.log(result);
  };

  return (
    <Form form={form} onSubmit={onSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Field name="Input">
          <Input
            value={inputValue}
            onClear={() => onClear()}
            onChange={(e) => setInputValue(e.target.value)}
            id="asdasd"
            type="search"
          />
          <FormField
            control={form.control}
            name="exInput"
            label="Input 라벨"
            useErrorMessage
            render={({ field }) => (
              <Input
                id="exInput2"
                type="search"
                {...field}
                onFocus={() => {
                  setInputState('focus');
                }}
                onChange={(e) => {
                  field.onChange(e);
                  console.log('custom onchange');
                }}
                onBlur={() => {
                  setInputState('');
                }}
                onKeyDown={() => {
                  setInputState('keydown');
                }}
                onPressEnter={() => {
                  setInputState('enter press');
                }}
                style={{ width: '200px' }}
                placeholder="입력중"
              />
            )}
          />
          <div>{inputState}</div>
        </Field>
        <Field name="Textarea">
          <Textarea maxLength={300} value={inputValue} onChange={(val) => setInputValue(val)} />
        </Field>
        <Field name="Select">
          <FormField
            control={form.control}
            name="exSelected"
            label="select(Multi)"
            useErrorMessage
            render={({ field, fieldState }) => (
              <Select
                {...field}
                style={{ width: '500px' }}
                options={[
                  { text: '옵션 1', value: 'value1' },
                  { text: '옵션 2', value: 'value2' },
                  { text: '옵션 3', value: 'value3' },
                ]}
                multiple
                placeholder="옵션을 선택하세요."
                isError={fieldState.invalid}
                onChange={async (value) => {
                  field.onChange(value);
                  await form.trigger('exSelected');
                }}
              />
            )}
          />
          <FormField
            control={form.control}
            name="exSelected2"
            label="select(Single)"
            useErrorMessage
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { text: '옵션 1', value: 'value1' },
                  { text: '옵션 2', value: 'value2' },
                  { text: '옵션 3', value: 'value3' },
                ]}
                placeholder="옵션을 선택하세요."
              />
            )}
          />
        </Field>
        <Field name="Checkbox">
          <FormField
            control={form.control}
            name="exCheckbox"
            render={({ field }) => (
              <>
                {checkboxList.map((checkbox) => (
                  <Checkbox
                    key={checkbox.id}
                    id={checkbox.id}
                    name="exCheckbox"
                    checked={field.value.includes(checkbox.id)}
                    onChange={(e) => {
                      const { checked } = e.target;
                      const updatedValue = checked
                        ? [...field.value, checkbox.id]
                        : field.value.filter((value) => value !== checkbox.id);
                      field.onChange(updatedValue);
                    }}
                    label={checkbox.label}
                  />
                ))}
              </>
            )}
          />
        </Field>
        <Field name="Radio">
          <FormField
            control={form.control}
            name="exRadio"
            render={({ field }) => (
              <>
                <Radio
                  {...field}
                  ref={field.ref}
                  options={radioOptions}
                  name="exRadio"
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                  }}
                />
                <p>{field.value}</p>
              </>
            )}
          />
        </Field>
        <Field name="File">
          <Input id="file" type="file" onInput={handleInput} />
          {image && <Image src={image} alt="테스트 이미지" width={400} height={400} />}
        </Field>
        <Field name="Loader">{/* <Loader /> */}</Field>
        <Field name="Calendar">
          <Calendar value="2025.01.17" onChange={() => {}} isFocus={false} />
        </Field>
        <Field name="RangeCalendar">
          <RangeCalendar value={{ startDate: '', endDate: '' }} onChange={() => {}} />
        </Field>
        <Field name="Tooltip Click">
          <Tooltip
            id={useId()}
            type="click"
            title="타이틀"
            contents={
              <div>
                일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십일이삼사오육칠팔구십
              </div>
            }
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                textAlign: 'center',
                lineHeight: '100px',
                backgroundColor: '#999',
              }}
            >
              Click
            </div>
          </Tooltip>
        </Field>
        <Field name="Tooltip Hover">
          <Tooltip
            id={useId()}
            contents={
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {['공유관리', '태그관리', '이름변경', '휴지통으로이동'].map((option, index) => (
                  <li
                    key={option}
                    role="menuitem" // ARIA 역할
                    tabIndex={0} // 키보드 접근성
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      borderBottom: index < 2 ? '1px solid #ddd' : undefined,
                    }}
                    onClick={() => handleMenuClick(option)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleMenuClick(option);
                      }
                    }}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            }
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                textAlign: 'center',
                lineHeight: '100px',
                backgroundColor: '#999',
              }}
            >
              Hover
            </div>
          </Tooltip>
        </Field>
        <Field name="Tooltip Right Click">
          <Tooltip
            id={useId()}
            type="rightClick"
            contents={
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {['공유관리', '태그관리', '이름변경', '휴지통으로이동'].map((option, index) => (
                  <li
                    key={option}
                    role="menuitem" // ARIA 역할
                    tabIndex={0} // 키보드 접근성
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      borderBottom: index < 2 ? '1px solid #ddd' : undefined,
                    }}
                    onClick={() => handleMenuClick(option)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleMenuClick(option);
                      }
                    }}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            }
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                textAlign: 'center',
                lineHeight: '100px',
                backgroundColor: '#999',
              }}
            >
              Click
            </div>
          </Tooltip>
        </Field>
        <Field name="Modal">
          {/* <ModalBase
            isOpen={isModalOpen}
            cancelText="닫기"
            confirmText="저장"
            message="모달 테스트"
            onCancel={handleCancel}
            onConfirm={handleConfirm}
          >
            안녕
          </ModalBase> */}
          <Button onClick={handleClickModal}>Modal</Button>
        </Field>
        <Field name="ModalAlert">
          <Button type="button" onClick={handleClickAlert1}>
            Alert
          </Button>
          <Button type="button" onClick={handleClickAlert2}>
            With Confirm
          </Button>
        </Field>
        <Field name="Toast">
          <Button onClick={() => handleToast('토스트 테스트')}>토스트 테스트</Button>
        </Field>
        <Field name="Snackbar">
          <Button onClick={handleSnackbar}>스낵바 테스트</Button>
        </Field>
        <Field name="Button">
          <Button type="submit" size="large">
            Submit
          </Button>
          <Button type="submit" color="gray" size="large">
            Submit
          </Button>
          <Button type="submit" color="line" size="large">
            Submit
          </Button>
        </Field>
        <Field name="이미지 다운로드 테스트">
          <div>
            <div id="capture-area">
              <p>이미지 다운로드에 포함되는 영역입니다.</p>
              <Image width="400" height="100" src="/images/logo.png" alt="" />
            </div>
            <Button onClick={handleImageDownload}>이미지 다운로드 테스트</Button>
            <Button onClick={handleImagePreview}>이미지 미리보기 테스트</Button>
            <Button onClick={handleImagePreviewWithAlert}>이미지 미리보기 얼럿 테스트</Button>
            <Button onClick={handleGetImageLink}>이미지 링크 받기 테스트</Button>
            {/* <ModalBase message="이미지 미리보기" isOpen={isImageModalOpen} onCancel={handleCloseImageModal}>
              <div>{url && <img src={url} alt="Preview" style={{ width: '100%', height: 'auto' }} />}</div>
            </ModalBase> */}
          </div>
        </Field>
        <Field name="Highlight">
          <Input id="text2" placeholder="하이라이트 텍스트 테스트" onChange={(e) => setQuery(e.target.value)} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {results.map((result) => (
              <TextHighlight key={`${result}_p`} text={result} highlight={query} color="black" highlightColor="red" />
            ))}
          </div>
        </Field>
        <Field name="Thumbnail">
          {Object.values(FLOATING_BUTTON_TYPE).map((type) => (
            <Field name={type} key={type}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '5px',
                }}
              >
                {TestFiles.slice(0, 4).map((exampleFile) => (
                  <Thumbnail
                    key={`${type}_${exampleFile.name}`}
                    hover
                    floatingType={type}
                    thumbUrl={exampleFile.url}
                    fileType={exampleFile.fileType as SmartFolderItemResultFileType}
                    floating={Object.entries(editStates).find((state) => state[1]) !== undefined}
                    fileName={`${type}_${exampleFile.name}`}
                    placeholder="blur"
                    dropDown={openDropDown}
                    dropDownMenu={dropDownMenu}
                    onDropDown={(event) => onDropDown(event)}
                    isEditActive={!!editStates[`${type}_${exampleFile.name}`]} // 개별 파일의 상태 전달
                    onEditToggle={() => handleEditToggle(`${type}_${exampleFile.name}`)} // 개별 상태 토글 함수 전달
                    onDownload={() => console.log('onDownload')}
                    onEdit={() => console.log('onEdit')}
                    onClose={() => console.log('onClose')}
                    onFavorite={() => console.log('onFavorite')}
                    width={160}
                    likes={1000}
                    date="2011-10-12"
                    views={1000}
                    onClick={() => console.log('click')}
                  />
                ))}
              </div>
            </Field>
          ))}
          <Field name="확장자가 isdlpr인 경우">
            <Thumbnail
              head="123123123123123"
              fileType={TestFiles[6].fileType as SmartFolderItemResultFileType}
              fileName={TestFiles[6].name}
              placeholder="blur"
              width={236}
              className="type-work"
              tag={{
                type: 'y',
                text: '12123',
              }}
            />
          </Field>
          <Field name="에러 시">
            <Thumbnail
              hover
              fileType="IMAGE"
              thumbUrl="https://picsum.photos/id/"
              fileName={TestFiles[5].name}
              placeholder="blur"
              width={160}
            />
          </Field>
          <Field name="폴더">
            <Thumbnail hover fileType="FOLDER" fileName="테스트 폴더" placeholder="blur" width={160} />
          </Field>
          <Field name="비주얼 폴더">
            <Thumbnail
              hover
              thumbUrl="/11"
              fileType="IMAGE"
              fileName="테스트 폴더"
              placeholder="blur"
              width={160}
              visualClassName="type-folder"
            />
          </Field>
        </Field>
        <Field name="모달 이동">
          <Link
            href="/preview?smartFolderItemId=16&smartFolderApiType=Photo"
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
            scroll={false}
          >
            모달 이동
          </Link>
        </Field>
        <Field name="hwp viewer">
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              marginTop: '20px',
            }}
            type="button"
            onClick={() => setIsHwpPopOpen(true)}
          >
            열려라 hwp 뷰어!
          </button>
          {isHwpPopOpen && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: '100px',
                left: '100px',
                right: '100px',
                height: '70%',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                style={{
                  backgroundColor: 'orange',
                  fontSize: '2vw',
                }}
                onClick={() => setIsHwpPopOpen(false)}
              >
                닫기
              </button>
              <HwpViewer filePath="/sample.hwp" />
            </div>
          )}
        </Field>
        <KeywordInput onUpdateKeyword={handleGetKeyword} />
        <Field name="FloatingMenu">
          <div className="group-content">
            <FloatingMenu
              isAllSelected={isAllSelected}
              handleAllSelected={() => {
                setIsAllSelected(!isAllSelected);
              }}
              floatingActionButton={isAllSelected}
              actionButton={actionButtonList}
              currentViewMode={currentViewMode}
              setCurrentViewMode={setCurrentViewMode}
              filter={
                <Select
                  options={[
                    { text: '전체', value: '' },
                    { text: '공개', value: 'true' },
                    { text: '비공개', value: 'false' },
                  ]}
                  value=""
                  placeholder="옵션을 선택하세요."
                />
              }
            />
          </div>
        </Field>
        <Field name="S3 파일 업로드">
          <div>
            <h2>파일 업로드</h2>
            <input type="file" onChange={handleFileChange} />
            {fileInfo && (
              <div>
                <p>파일명: {fileInfo.name}</p>
                <p>미디어 타입: {fileInfo.type}</p>
                <p>파일 크기: {fileInfo.size} bytes</p>
              </div>
            )}
          </div>
        </Field>
        {/* <Field name="PDF Viewer ">
          <PDFViewer fileUrl="./test11.pdf" />
        </Field> */}
      </div>
    </Form>
  );
};

export default ExamplePage;
