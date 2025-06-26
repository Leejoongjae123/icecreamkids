'use client';

import { useParams } from 'next/navigation';
import { useGetDomains, useGetStudentRecord } from '@/service/file/fileStore';
import type { EducationalClassResultCourse } from '@/service/member/schemas';
import StudentRecordPreview from '@/app/work-board/(protected)/student-record/_component/StudentRecordPreview';
import AppLayout from '@/components/layout/AppLayout';

const StudentRecordPreviewPage = () => {
  const params = useParams();
  const paramsId = parseInt(params.id as string, 10);

  const { data: studentRecord } = useGetStudentRecord(
    paramsId,
    { includes: 'scores,comments,photoItems' },
    { query: { enabled: !!paramsId } },
  );

  const { data: domains } = useGetDomains(
    { course: studentRecord?.result?.course as EducationalClassResultCourse },
    { query: { enabled: !!studentRecord } },
  );

  return (
    <AppLayout>
      <StudentRecordPreview
        domains={domains?.result}
        studentName={studentRecord?.result?.studentName}
        modifiedAt={studentRecord?.result?.modifiedAt}
        studentThumbnail={studentRecord?.result?.studentThumbnail}
        educationalClassAge={studentRecord?.result?.educationalClassAge}
        studentBirthday={studentRecord?.result?.studentBirthday}
        summaryScores={studentRecord?.result?.summaryScores}
        observeComments={studentRecord?.result?.observeComments}
        observeSummary={studentRecord?.result?.observeSummary}
        teacherComment={studentRecord?.result?.teacherComment}
        teacherSupport={studentRecord?.result?.teacherSupport}
        parentSupport={studentRecord?.result?.parentSupport}
      />
    </AppLayout>
  );
};

export default StudentRecordPreviewPage;
