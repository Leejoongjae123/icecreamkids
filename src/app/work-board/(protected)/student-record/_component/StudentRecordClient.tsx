'use client';

import { clsx as cx } from 'clsx';
import dayjs, { dateFormat } from '@/lib/dayjs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Button, Loader, Select } from '@/components/common';
import { ObservationReportHistoryModal } from '@/components/modal/observation-report/history';
import { useRouter, useSearchParams } from 'next/navigation';
import useUserStore from '@/hooks/store/useUserStore';
import { useGetEducationalClasses } from '@/service/member/memberStore';
import {
  getStudentRecordHistory,
  useCreateStudentRecord,
  useGetDomains,
  useGetIndicators,
  useGetStudentRecord,
  useUpdateStudentRecord,
} from '@/service/file/fileStore';
import { EducationalClassResult, type EducationalClassResultCourse, StudentResult } from '@/service/member/schemas';
import {
  SmartFolderItemResult,
  type StudentRecordAddRequest,
  StudentRecordCommentResult,
  StudentRecordEvaluationIndicatorScoreForAdd,
  StudentRecordEvaluationIndicatorScoreForUpdate,
  StudentRecordEvaluationIndicatorScoreResult,
  StudentRecordResult,
  type StudentRecordUpdateRequest,
} from '@/service/file/schemas';
import { useAlertStore } from '@/hooks/store/useAlertStore';
import useClassManageStore from '@/hooks/store/useClassManageStore';
import { useCreateObservation, useRecreateObservation } from '@/service/aiAndProxy/aiAndProxyStore';
import type {
  StudentRecordAiRecreateRequestIndicatorScores,
  StudentRecordCreateAiObservationRequestIndicatorScores,
} from '@/service/aiAndProxy/schemas';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useInfiniteQueryWithLimit } from '@/utils/react-query';
import { getFlattenedData, hasReactQueryCompleted, debounce } from '@/utils';
import StudentRecordGraph from '@/app/work-board/(protected)/student-record/_component/StudentRecordGraph';
import RecentPlayRecords from '@/app/work-board/(protected)/student-record/_component/RecentPlayRecords';
import RepresentativePhoto from '@/app/work-board/(protected)/student-record/_component/RepresentativePhoto';
import { useToast } from '@/hooks/store/useToastStore';
import { useBeforeLeavePagePrevent } from '@/hooks/useBeforeLeavePagePrevent';
import StudentRecordComments from '@/app/work-board/(protected)/student-record/_component/StudentRecordComments';
import StudentRecordPreview from '@/app/work-board/(protected)/student-record/_component/StudentRecordPreview';
import AppLayoutWithoutSNB from '@/components/layout/withoutSnb/AppLayoutWithoutSNB';
import useS3FileUpload from '@/hooks/useS3FileUpload';
import { SplitButton } from '@/components/common/SplitButton';
import { DownloadModal } from '@/components/modal';
import { useHandleFile } from '@/hooks/useHandleFile';
import { useFileContext } from '@/context/fileContext';
import { IRegisteredImage } from './type';
import { getAttachedPhotos } from '../utils';

type StudentRecordProps = {
  classId?: number;
  studentId?: number;
  studentRecordId?: number;
};

const StudentRecordClient = ({ classId, studentId, studentRecordId }: StudentRecordProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialIsSaved = searchParams.get('isSaved') === 'true';

  const [selectedClass, setSelectedClass] = useState<EducationalClassResult | null>();
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>();
  const [studentRecordInfo, setStudentRecordInfo] = useState<StudentRecordResult | null>();
  const [historyList, setHistoryList] = useState<StudentRecordResult[]>();
  const [addFormData, setAddFormData] = useState<StudentRecordAddRequest>();
  const [updateFormData, setUpdateFormData] = useState<StudentRecordUpdateRequest>();
  const [attachedPhotoItemList, setAttachedPhotoItemList] = useState<IRegisteredImage[]>();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isChangedRecord, setIsChangedRecord] = useState(false); // 평가 수정 여부
  const [isSavedRecord, setIsSavedRecord] = useState(initialIsSaved);
  const [isEmptyStudent, setIsEmptyStudent] = useState(false); // 등록된 아이 없음 노출 처리
  const [currentActionItem, setCurrentActionItem] = useState<StudentRecordResult>();
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isRecentPlayRecord, setIsRecentPlayRecord] = useState<boolean>(false); // 최근 놀이 기록 api 호출 처리

  const showHistoryAlert = useRef(false);
  const showClassManageAlert = useRef(false);

  const { userInfo } = useUserStore();
  const { postFile } = useS3FileUpload();
  const { handleCopy } = useHandleFile();

  /**
   * SNB 내 컴퓨터 버튼 핸들러
   */
  const { isPreviewModalOpen: isLNBOpenPreiew } = useFileContext();

  const {
    data: classList,
    refetch: refetchClasses,
    status: classListStatus,
  } = useGetEducationalClasses(`${userInfo?.id}`, { includes: 'students' }, { query: { enabled: !!userInfo?.id } });

  const LIMIT = 5;
  const {
    data: history,
    fetchNextPage: historyNextPage,
    hasNextPage: historyHasNext,
    isFetchingNextPage: historyFetchingNextPage,
    isLoading: historyLoading,
    isPending: isPendingHistory,
    refetch: refetchHistory,
  } = useInfiniteQueryWithLimit({
    queryKey: [studentId, 'history'],
    queryFn: (pageParam) => getStudentRecordHistory(studentId as number, { offsetWithLimit: `${pageParam},${LIMIT}` }),
    limit: LIMIT,
    enabled: !!studentId,
  });

  const { data: studentRecord, refetch: refetchStudentRecord } = useGetStudentRecord(
    studentRecordId as number,
    { includes: 'scores,comments,photoItems' },
    { query: { enabled: false } }, // 이중 호출 문제로 1회만 호출 처리를 위한 enabled false 처리
  );

  const { data: domains } = useGetDomains(
    { course: selectedClass?.course as EducationalClassResultCourse },
    { query: { enabled: !!selectedClass } },
  );

  const { data: indicators } = useGetIndicators(
    { age: `${selectedClass?.age}` },
    { query: { enabled: !!selectedClass } },
  );

  const {
    mutateAsync: createObservation,
    isPending: isPendingCreateObservation,
    isError: isErrorCreateObservation,
    error: errorCreateObservation,
  } = useCreateObservation();

  const {
    mutateAsync: reCreateObservation,
    isPending: isPendingRecreateObservation,
    isError: isErrorReCreateObservation,
    error: errorReCreateObservation,
  } = useRecreateObservation();

  const {
    mutateAsync: createStudentRecord,
    error: createStudentRecordError,
    isPending: isPendingCreateStudentRecord,
  } = useCreateStudentRecord();
  const {
    mutateAsync: updateStudentRecord,
    error: updateStudentRecordError,
    isPending: isPendingUpdateStudentRecord,
  } = useUpdateStudentRecord();

  const loadingState = [
    {
      isLoading: isPendingCreateObservation || isPendingRecreateObservation,
      name: 'AI 결과 생성',
      message: 'AI 결과 생성중입니다.',
      priority: 1,
    },
  ];

  const { isLoading, message: loadingMessage } = useLoadingState(loadingState);

  const { showAlert } = useAlertStore();
  const addToast = useToast((state) => state.add);
  const { openModal: openClassManageModal, isModalOpen: isClassManageModalOpen } = useClassManageStore();

  if (createStudentRecordError) {
    showAlert({ message: `${createStudentRecordError}` });
  }

  if (updateStudentRecordError) {
    showAlert({ message: `${createStudentRecordError}` });
  }

  if (isErrorCreateObservation) {
    showAlert({ message: `AI 결과 생성에 실패하였습니다. <br/>${errorCreateObservation}` });
  }

  if (isErrorReCreateObservation) {
    showAlert({ message: `AI 결과 생성에 실패하였습니다. <br/>${errorReCreateObservation}` });
  }

  const getSummaryScoresByString = (scores: Record<string, number>) => {
    return Object.entries(scores)
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
  };

  const handleOpenClassManageModal = () => {
    showClassManageAlert.current = true;
    openClassManageModal('children', selectedClass?.id as number);
  };

  useEffect(() => {
    const currentClassInfo = classList?.result?.find((item) => item.id === classId);
    setSelectedClass(currentClassInfo);
  }, [classId, classList?.result]);

  useEffect(() => {
    const currentStudentInfo = selectedClass?.students?.find((item) => item.id === studentId);
    setSelectedStudent(currentStudentInfo);
  }, [selectedClass, studentId]);

  useEffect(() => {
    const currentClassInfo = classList?.result?.find((item) => item.id === classId);
    if (!currentClassInfo) return;

    const { students } = currentClassInfo;
    const hasStudents = students && students.length > 0;

    if (studentId) {
      if (!hasStudents) {
        router.replace(`/work-board/student-record/${classId}`);
      }
    } else {
      if (hasStudents) {
        router.replace(`/work-board/student-record/${classId}/${students[0].id}`);
        return;
      }
      showAlert({
        message: '등록된 아이가 없습니다. <br/> 나의반관리 > 우리반관리에서 아이를 등록해 주세요.',
        onConfirm: () => {
          showClassManageAlert.current = true;
          openClassManageModal('children', selectedClass?.id as number);
          setIsEmptyStudent(true);
        },
      });
    }
    setTimeout(() => {
      sessionStorage.setItem('openWorkboardSnB', 'true');
    }, 200);
  }, [classId, classList?.result, openClassManageModal, router, selectedClass, showAlert, studentId]);

  useEffect(() => {
    if (showClassManageAlert.current && !isClassManageModalOpen) {
      refetchClasses();
    }
  }, [isClassManageModalOpen, refetchClasses, userInfo?.id]);

  useEffect(() => {
    setHistoryList(getFlattenedData(history?.pages));
  }, [history, history?.pages]);

  useEffect(() => {
    if (studentRecordId) {
      setTimeout(() => {
        setIsRecentPlayRecord(true);
      }, 100);
      return;
    }

    if (historyList && historyList?.length > 0 && !showHistoryAlert.current) {
      const lastHitoryItem = historyList[0];
      const historyId = lastHitoryItem.id;
      showAlert({
        isConfirm: true,
        message: '최근 히스토리 작업이 있습니다. <br/> 최근 작업에서 관찰기록을 작성하시겠습니까?',
        // onConfirm: () => setIsHistoryModalOpen(true),
        onConfirm: () => {
          if (historyId) {
            router.replace(`/work-board/student-record/${classId}/${studentId}/${historyId}`);
          } else {
            setIsHistoryModalOpen(true);
          }
        },
        onCancel: () => {
          setIsRecentPlayRecord(true);
        },
      });
      showHistoryAlert.current = true;
    }

    if (historyList && historyList.length === 0) {
      if (!isPendingHistory) {
        setTimeout(() => {
          setIsRecentPlayRecord(true);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyList]);

  useEffect(() => {
    setStudentRecordInfo(studentRecord?.result);
  }, [studentRecord, studentRecord?.result]);

  const debounceStudentRecordId = useMemo(() => {
    const callBack = () => refetchStudentRecord();
    return debounce(callBack, 200);
  }, [refetchStudentRecord]);

  useEffect(() => {
    if (studentRecordId) {
      debounceStudentRecordId();
    }
  }, [debounceStudentRecordId, studentRecordId]);

  useEffect(() => {
    showHistoryAlert.current = false;
  }, [studentId]);

  // 초기 FormData 설정
  useEffect(() => {
    const { id, accountId } = userInfo ?? {};
    const { age, course } = selectedClass ?? {};
    const { name: studentName } = selectedStudent ?? {};
    const { summaryScores } = studentRecord?.result ?? {};
    const {
      indicatorScores,
      attachedPhotos = [],
      observeComments,
      observeSummary,
      teacherSupport,
      parentSupport,
      teacherComment,
    } = studentRecordInfo ?? {};

    if (studentRecordId) {
      setUpdateFormData({
        id: studentRecordId as number,
        creatorProfileId: id as number,
        summaryScores,
        indicatorScores: indicatorScores?.map((item: StudentRecordEvaluationIndicatorScoreResult) => {
          return {
            indicatorScoreId: item.id,
            indicatorDepth: item.indicatorDepth,
            indicatorCode: item.indicatorCode,
            score: item.score,
          };
        }),
        attachedPhotos,
        observeComments: observeComments?.map((item: StudentRecordCommentResult) => {
          return {
            studentRecordCommentId: item.id,
            evaluationDomainCode: item.evaluationDomainCode,
            evaluationDescription: item.evaluationDescription,
            userEdited: item.userEdited,
          };
        }),
        observeSummary,
        teacherSupport,
        parentSupport,
        teacherComment,
        creatorIp: '',
      });
    } else {
      const defaultSummaryScores =
        domains?.result?.reduce((accumulator, value) => {
          return { ...accumulator, [value.code]: 3 };
        }, {}) ?? {};

      const defaultIndicatorScores =
        indicators?.result
          ?.flatMap((item) => item.subIndicators ?? [])
          ?.map((item) => {
            return {
              indicatorDepth: item?.depth,
              indicatorCode: item?.indicatorCode,
              score: 3,
            };
          }) ?? [];

      setAddFormData({
        creatorAccountId: accountId as number,
        creatorProfileId: id as number,
        educationalClassId: classId as number,
        studentId: studentId as number,
        studentName: studentName as string,
        studentAge: age as number,
        course: course as EducationalClassResultCourse,
        summaryScores: getSummaryScoresByString(defaultSummaryScores),
        indicatorScores: defaultIndicatorScores,
        attachedPhotos: [],
        observeComments: [],
        observeSummary: '',
        teacherSupport: '',
        parentSupport: '',
        teacherComment: '',
        creatorIp: '',
      });
    }
  }, [
    classId,
    studentRecordId,
    studentRecordInfo,
    domains?.result,
    indicators,
    selectedClass,
    selectedStudent,
    studentId,
    studentRecord?.result,
    userInfo,
  ]);

  // 반 변경
  const handleChangeClass = (value: string | number | (number | string)[]) => {
    const studentIdInClass = classList?.result?.find((item) => item.id === value)?.students?.[0]?.id;
    if (studentIdInClass) {
      router.replace(`/work-board/student-record/${value}/${studentIdInClass}`);
      return;
    }

    router.replace(`/work-board/student-record/${value}`);
    setHistoryList(undefined);
    setStudentRecordInfo(undefined);
  };

  // 학생 변경
  const handleChangeStudent = async (value: string | number | (number | string)[]) => {
    await setIsRecentPlayRecord(false);
    await setHistoryList(undefined);
    await router.replace(`/work-board/student-record/${classId}/${value}`);
    setStudentRecordInfo(undefined);
  };

  // 우리반 관리 버튼
  const handleClickClassManageButton = () => {
    showClassManageAlert.current = true;
    openClassManageModal('', selectedClass?.id as number);
  };

  // 히스토리 버튼
  const handleClickHistoryButton = async () => {
    setIsHistoryModalOpen(true);
  };

  // 히스토리 선택
  const handleClickStudentRecord = async (item: StudentRecordResult) => {
    const { id } = item;
    if (id === studentRecordId) {
      window.location.reload();
      return;
    }

    router.replace(`/work-board/student-record/${classId}/${studentId}/${id}`);
  };

  // 미리보기 버튼
  const handleClickDetailButton = () => {
    if (isChangedRecord) {
      setIsPreviewOpen(true);
    } else {
      router.push(`/work-board/student-record/preview/${studentRecordId}`);
    }
  };

  // AI 결과 생성
  const handleClickCreateObservation = () => {
    const formIndicatorScores = studentRecordId ? updateFormData?.indicatorScores : addFormData?.indicatorScores;
    if (formIndicatorScores && formIndicatorScores?.length < 1) {
      showAlert({ message: '아이 관찰 상세 평가 데이터 없습니다. <br/> AI 결과를 생성할 수 없습니다.' });
      return;
    }

    showAlert({
      message: 'AI 추천 문장은 보조 자료일 뿐, <br/>실제 활용 전 교사의 확인과 수정이 필요합니다.',
      onConfirm: () => {
        setTimeout(async () => {
          const indicatorScores =
            formIndicatorScores?.reduce((acc, value) => {
              return { ...acc, [value?.indicatorCode as string]: value?.score as number };
            }, {}) ?? {};

          const data = {
            profileId: userInfo?.id as number,
            educationalClassId: selectedClass?.id as number,
            studentId: selectedStudent?.id as number,
            indicatorScores: indicatorScores as StudentRecordCreateAiObservationRequestIndicatorScores,
          };

          const { result, error } = await createObservation({ data });

          if (!result) {
            setTimeout(() => {
              showAlert({ message: `AI 결과 생성에 실패하였습니다. <br/>${error}` });
            }, 300);
            return;
          }

          addToast({ message: 'AI 결과 생성이 완료되었습니다.' });

          if (studentRecordId) {
            setUpdateFormData((prev) => {
              const observationCommentMadeByAi = result?.evaluationContents.map((evaluationContent) => {
                const prevStudentRecordComment = prev?.observeComments?.find(
                  (item) => item?.evaluationDomainCode === evaluationContent.evaluationDomainCode,
                );

                return {
                  ...(prevStudentRecordComment && {
                    studentRecordCommentId: prevStudentRecordComment.studentRecordCommentId,
                  }),
                  evaluationDomainCode: evaluationContent.evaluationDomainCode,
                  evaluationDescription: evaluationContent.contents,
                  userEdited: false,
                };
              });

              return {
                ...(prev as StudentRecordUpdateRequest),
                observeSummary: result?.observeSummary,
                observeComments: observationCommentMadeByAi,
                parentSupport: result?.parentSupport,
                teacherComment: result?.teacherComment,
                teacherSupport: result?.teacherSupport,
              };
            });
          } else {
            setAddFormData((prev) => {
              const observationCommentMadeByAi = result?.evaluationContents.map((item) => {
                return {
                  evaluationDomainCode: item.evaluationDomainCode,
                  evaluationDescription: item.contents,
                  userEdited: false,
                };
              });

              return {
                ...(prev as StudentRecordAddRequest),
                observeSummary: result?.observeSummary,
                observeComments: observationCommentMadeByAi,
                parentSupport: result?.parentSupport,
                teacherComment: result?.teacherComment,
                teacherSupport: result?.teacherSupport,
              };
            });
          }
          setIsChangedRecord(true);
          setIsSavedRecord(false);
        });
      },
    });
  };

  // AI 결과 재성성
  const handleReCreateObservation = async (
    code: string,
    indicatorScores: StudentRecordAiRecreateRequestIndicatorScores,
  ) => {
    const data = {
      profileId: userInfo?.id as number,
      educationalClassId: selectedClass?.id as number,
      studentId: selectedStudent?.id as number,
      indicatorScores,
    };
    const { result, error } = await reCreateObservation({ data });

    if (!result) {
      setTimeout(() => {
        showAlert({ message: `AI 결과 생성에 실패하였습니다. <br/>${error}` });
      }, 300);
      return;
    }

    addToast({ message: 'AI 결과 생성이 완료되었습니다.' });

    if (studentRecordId) {
      setUpdateFormData((prev) => {
        const prevStudentRecordComment = prev?.observeComments?.find((item) => item?.evaluationDomainCode === code);
        const newObservationComment =
          prev?.observeComments?.filter((item) => item?.evaluationDomainCode !== code) ?? [];

        newObservationComment.push({
          ...(prevStudentRecordComment && {
            studentRecordCommentId: prevStudentRecordComment.studentRecordCommentId,
          }),
          evaluationDomainCode: code,
          evaluationDescription: result?.contents as string,
          userEdited: false,
        });

        return {
          ...(prev as StudentRecordUpdateRequest),
          observeComments: newObservationComment,
        };
      });
    } else {
      setAddFormData((prev) => {
        prev?.observeComments?.find((item) => item?.evaluationDomainCode === code);
        const newObservationComment =
          prev?.observeComments?.filter((item) => item?.evaluationDomainCode !== code) ?? [];
        newObservationComment.push({
          evaluationDomainCode: code,
          evaluationDescription: result?.contents as string,
          userEdited: false,
        });

        return {
          ...(prev as StudentRecordAddRequest),
          observeComments: newObservationComment,
        };
      });
    }
    setIsChangedRecord(true);
    setIsSavedRecord(false);
  };

  const save = async () => {
    const attachedPhotoList = attachedPhotoItemList && (await getAttachedPhotos(attachedPhotoItemList, postFile));
    if (studentRecordId) {
      const updateFormDataItem = {
        ...updateFormData,
        attachedPhotos: attachedPhotoList,
      };
      return updateStudentRecord({ data: updateFormDataItem as StudentRecordUpdateRequest });
    }
    const addFormDataItem = {
      ...addFormData,
      attachedPhotos: attachedPhotoList,
    };
    return createStudentRecord({ data: addFormDataItem as StudentRecordAddRequest });
  };

  // 저장 버튼
  const handleClickSaveButton = async () => {
    setIsChangedRecord(false);
    const { result } = await save();

    addToast({
      message: `저장되었습니다. <br />스마트 폴더 &gt; 자료 &gt; 관찰기록`,
    });

    setIsSavedRecord(true);
    router.replace(`/work-board/student-record/${classId}/${studentId}/${result?.id}?isSaved=true`);
    showHistoryAlert.current = true;
    await refetchHistory();
  };

  const handleClickSaveElseWhere = async () => {
    const { result } = await save();

    setCurrentActionItem(result);
    setIsDownloadModalOpen(true);
  };

  const handleConfirmSaveElsewhere = async (folder: SmartFolderItemResult | undefined | null, path?: string) => {
    if (!folder) {
      return;
    }

    await handleCopy(
      folder,
      currentActionItem?.smartFolderItem?.id as number,
      currentActionItem?.smartFolderItem?.smartFolderApiType,
      path,
      '저장되었습니다.',
      '등록중 에러가 발생하였습니다.',
    );

    setIsChangedRecord(false);
    setIsSavedRecord(true);
    showHistoryAlert.current = true;
    setIsDownloadModalOpen(false);
    await refetchHistory();
  };

  // 관찰 기록 편집
  const handleSaveComment = (code: string, newValue: string) => {
    const commonCommentList = ['observeSummary', 'teacherComment', 'teacherSupport', 'parentSupport'];
    // 관찰 요약, 교사 총평, 교사 지원, 부모 지원 수정
    if (commonCommentList.includes(code)) {
      if (studentRecordId) {
        setUpdateFormData((prev) => {
          return {
            ...(prev as StudentRecordUpdateRequest),
            [code]: newValue,
          };
        });
      } else {
        setAddFormData((prev) => {
          return {
            ...(prev as StudentRecordAddRequest),
            [code]: newValue,
          };
        });
      }
    } else if (studentRecordId) {
      setUpdateFormData((prev) => {
        const prevStudentRecordComment = prev?.observeComments?.find((item) => item?.evaluationDomainCode === code);
        const newObservationComment =
          prev?.observeComments?.filter((item) => item?.evaluationDomainCode !== code) ?? [];

        newObservationComment.push({
          ...(prevStudentRecordComment && { studentRecordCommentId: prevStudentRecordComment.studentRecordCommentId }),
          evaluationDomainCode: code,
          evaluationDescription: newValue,
          userEdited:
            prevStudentRecordComment?.userEdited === true
              ? true
              : newValue.length !== prevStudentRecordComment?.evaluationDescription.length,
        });

        return {
          ...(prev as StudentRecordUpdateRequest),
          observeComments: newObservationComment,
        };
      });
    } else {
      setAddFormData((prev) => {
        const prevStudentRecordComment = prev?.observeComments?.find((item) => item?.evaluationDomainCode === code);

        const newObservationComment =
          prev?.observeComments?.filter((item) => item?.evaluationDomainCode !== code) ?? [];
        newObservationComment.push({
          evaluationDomainCode: code,
          evaluationDescription: newValue,
          userEdited:
            prevStudentRecordComment?.userEdited === true
              ? true
              : newValue.length !== prevStudentRecordComment?.evaluationDescription.length,
        });

        return {
          ...(prev as StudentRecordAddRequest),
          observeComments: newObservationComment,
        };
      });
    }

    setIsChangedRecord(true);
    setIsSavedRecord(false);
  };

  const handleChangeStudentRecordGraph = (
    summaryScores: string,
    indicatorScores: StudentRecordEvaluationIndicatorScoreForUpdate[] | StudentRecordEvaluationIndicatorScoreForAdd[],
  ) => {
    if (studentRecordId) {
      setUpdateFormData((prev) => {
        return {
          ...(prev as StudentRecordUpdateRequest),
          summaryScores,
          indicatorScores,
        };
      });
    } else {
      setAddFormData((prev) => {
        return {
          ...(prev as StudentRecordAddRequest),
          summaryScores,
          indicatorScores,
        };
      });
    }

    setIsChangedRecord(true);
    setIsSavedRecord(false);
  };

  // 반 정보 선택
  const classOptions = useMemo(() => {
    if (!hasReactQueryCompleted(classListStatus)) return [];
    const classResultList = classList?.result ? [...classList.result] : [];
    return (
      classResultList
        ?.sort((itemA, ItemB) => {
          if (itemA.year !== ItemB.year) {
            return ItemB.year - itemA.year;
          }
          return ItemB.id - itemA.id;
        })
        .map((item) => {
          const { id, year, name } = item;
          const optionText = year ? `${year}년 ${name}반` : `${name}반`;
          return {
            value: id,
            text: optionText,
          };
        }) ?? []
    );
  }, [classList?.result, classListStatus]);

  // 학생 정보 선택
  const studentOptions = useMemo(() => {
    return (
      selectedClass?.students?.map((student) => {
        return {
          value: student.id,
          text: student.name,
        };
      }) ?? []
    );
  }, [selectedClass]);

  /* 아이활동 작품 관련 */
  // 아이활동 작품 attachedPhotos
  const attachedPhotoItems = useMemo(() => {
    if (studentRecordInfo) return studentRecordInfo?.attachedPhotos;
    return [];
  }, [studentRecordInfo]);

  // 아이활동 작업 사진 데이터 업로드
  const handleChangeRepresentativePhoto = useCallback((items: IRegisteredImage[]) => {
    setAttachedPhotoItemList(items);
    setIsChangedRecord(true);
    setIsSavedRecord(false);
  }, []);

  // 미리보기 페이지에서 뒤로가기 방지
  useEffect(() => {
    if (isPreviewOpen) {
      const handlePopState = () => {
        window.history.pushState(null, '', window.location.href);
        setIsPreviewOpen(false);
      };

      window.addEventListener('popstate', handlePopState);
      window.history.pushState(null, '', window.location.href);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }

    return () => {};
  }, [history, isPreviewOpen]);

  // 페이지 이동 방지
  useBeforeLeavePagePrevent(!isPreviewOpen && isChangedRecord, isLNBOpenPreiew);

  // * 저장 버튼 옵션 (저장, 다른 위치에 저장)
  const saveElsewhereButtonOptions = () => {
    return [
      {
        key: 'save',
        text: '저장',
        action: handleClickSaveButton,
      },
      {
        key: 'saveElseWhere',
        text: '다른 위치에 저장',
        action: handleClickSaveElseWhere,
      },
    ];
  };

  return isPreviewOpen ? (
    <AppLayoutWithoutSNB>
      <div className={cx('main-content')}>
        <article id="mainContent" className="content-article">
          <StudentRecordPreview
            studentName={selectedStudent?.name}
            modifiedAt={dayjs().toString()}
            studentThumbnail={selectedStudent?.thumbUrl}
            educationalClassAge={selectedClass?.age}
            studentBirthday={selectedStudent?.birthday}
            domains={domains?.result}
            summaryScores={studentRecordId ? updateFormData?.summaryScores : addFormData?.summaryScores}
            observeComments={studentRecordId ? updateFormData?.observeComments : addFormData?.observeComments}
            observeSummary={studentRecordId ? updateFormData?.observeSummary : addFormData?.observeSummary}
            teacherComment={studentRecordId ? updateFormData?.teacherComment : addFormData?.teacherComment}
            teacherSupport={studentRecordId ? updateFormData?.teacherSupport : addFormData?.teacherSupport}
            parentSupport={studentRecordId ? updateFormData?.parentSupport : addFormData?.parentSupport}
            onBack={() => setIsPreviewOpen(false)}
          />
        </article>
      </div>
    </AppLayoutWithoutSNB>
  ) : (
    <AppLayout bgColor="type1">
      <h3 className="title-type3">아이 관찰 기록</h3>
      <div className="head-report">
        <div className="util-head util-left">
          <Select
            value={selectedClass?.id || 0}
            className="w-160"
            size="small"
            options={classOptions}
            onChange={handleChangeClass}
          />
          <Select
            value={selectedStudent?.id || 0}
            className="w-120"
            size="small"
            options={studentOptions}
            onChange={handleChangeStudent}
          />
          <Button type="button" size="small" color="line" className="btn-manage" onClick={handleClickClassManageButton}>
            나의 반 관리
          </Button>
        </div>
        <div className="util-head util-right">
          {!!studentId && (
            <>
              <Button size="small" color="line" icon="history-14" onClick={handleClickHistoryButton}>
                히스토리
              </Button>
              <Button
                size="small"
                color="line"
                icon="preview-14"
                disabled={!studentRecordId}
                onClick={handleClickDetailButton}
              >
                미리보기
              </Button>
              <Button
                size="small"
                color="line"
                icon="sparkle-14"
                disabled={isPendingCreateObservation}
                onClick={handleClickCreateObservation}
              >
                AI 결과 생성
              </Button>
              <SplitButton
                size="small"
                color="primary"
                disabled={!isChangedRecord}
                options={saveElsewhereButtonOptions()}
              >
                {isSavedRecord ? '저장 완료' : '저장'}
              </SplitButton>
            </>
          )}
        </div>
      </div>
      {studentId ? (
        <div className="group-report type-columns">
          <div className="inner-group type-large">
            <div className="box-report box-profile">
              <h4 className="screen_out">아이 정보</h4>
              <div
                className="thumb-profile"
                style={{
                  backgroundImage: selectedStudent?.thumbUrl && `url(${selectedStudent?.thumbUrl})`,
                  backgroundColor: selectedStudent?.thumbUrl && 'transparent',
                }}
              >
                {!selectedStudent?.thumbUrl && <span className="ico-comm ico-image-45" />}
              </div>
              <div className="inner-profile">
                <strong className="name-profile">{selectedStudent?.name}</strong>
                <dl className="info-profile">
                  <dt>반/나이</dt>
                  {selectedClass && (
                    <dd>
                      {selectedClass?.name} / {selectedClass?.age}세
                    </dd>
                  )}
                </dl>
                <dl className="info-profile">
                  <dt>생년월일</dt>
                  {selectedStudent && <dd>{dayjs(selectedStudent?.birthday).format(dateFormat.default)}</dd>}
                </dl>
              </div>
            </div>
            <StudentRecordGraph
              domains={domains?.result}
              indicators={indicators?.result}
              summaryScores={studentRecordId ? updateFormData?.summaryScores : addFormData?.summaryScores}
              indicatorScores={studentRecordId ? updateFormData?.indicatorScores : addFormData?.indicatorScores}
              onChangeStudentRecordGraph={handleChangeStudentRecordGraph}
            />
          </div>
          <div className="inner-group">
            <StudentRecordComments
              domains={domains?.result}
              indicators={indicators?.result}
              formData={studentRecordId ? updateFormData : addFormData}
              onRecreateObservation={handleReCreateObservation}
              onSave={handleSaveComment}
            />
          </div>
        </div>
      ) : (
        // 학생이 정보가 없는 경우 노출
        isEmptyStudent && (
          <div className="item-empty type3">
            <span className="ico-comm ico-illust6" />
            <strong className="tit-empty">등록된 아이가 없어요.</strong>
            <div>
              <button className="font-bold link-g" onClick={handleOpenClassManageModal}>
                우리 반 관리 {'>'} 아이 관리
              </button>
              <span style={{ display: 'inline-block', lineHeight: '22px', marginLeft: '2px' }}>
                에서 아이를 등록하면 아이관찰기록을 시작할 수 있어요.
              </span>
            </div>
          </div>
        )
      )}
      {!!studentId && (
        <>
          {/* 아이활동 작품 */}
          <RepresentativePhoto
            attachedPhotos={attachedPhotoItems}
            studentRecordId={studentRecordId}
            onChangeAttachedPhoto={handleChangeRepresentativePhoto}
          />
          {/* 아이활동 작품 */}

          {/* 최근 놀이 기록 */}
          <RecentPlayRecords
            educationalClassId={classId as number}
            educationalClassYear={selectedClass?.year as number}
            selectStudentId={studentId as number}
            callRecentPlayRecord={isRecentPlayRecord}
          />
          {/* 최근 놀이 기록 */}
        </>
      )}
      {/* 최근 놀이 기록 */}
      {isHistoryModalOpen && (
        <ObservationReportHistoryModal
          historyList={historyList}
          studentName={selectedStudent?.name}
          fetchNextPage={historyNextPage}
          hasNextPage={historyHasNext}
          isFetchingNextPage={historyFetchingNextPage}
          isLoading={historyLoading}
          onSelect={handleClickStudentRecord}
          onCancel={() => setIsHistoryModalOpen(false)}
        />
      )}
      {isDownloadModalOpen && (
        <DownloadModal
          isOpen={isDownloadModalOpen}
          itemData={[currentActionItem?.smartFolderItem as SmartFolderItemResult]}
          onCancel={() => setIsDownloadModalOpen(false)}
          onConfirm={handleConfirmSaveElsewhere}
          action="SAVE"
        />
      )}
      {isLoading && <Loader hasOverlay loadingMessage={loadingMessage} />}
    </AppLayout>
  );
};

export default StudentRecordClient;
