import { ErrorPage } from '@/components/common/Error';

export default function Page({ params: { status } }: { params: any }) {
  return <ErrorPage status={+status} />;
}
