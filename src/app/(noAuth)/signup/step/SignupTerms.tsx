'use client';

import { useForm } from 'react-hook-form';
import { Children, Key, useEffect } from 'react';
import { TERMS_USE, TERMS_PRIVACY } from '@/const/terms';
import { Form, Checkbox, Button } from '@/components/common';
import { termsContentItem } from '../../terms/type';
import { IAgreeForm, ITermsProps } from './types';

export default function SignupTermsClient({ onNext, onBack }: ITermsProps) {
  const form = useForm<IAgreeForm>({
    defaultValues: {
      allAgree: false,
      ageAgree: false,
      termsAgree: false,
      privacyAgree: false,
    },
    mode: 'onChange',
  });

  const { watch, setValue } = form;

  const allAgree = watch('allAgree');
  const ageAgree = watch('ageAgree');
  const termsAgree = watch('termsAgree');
  const privacyAgree = watch('privacyAgree');

  // 전체 동의 체크박스 핸들러
  const handleAllAgree = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setValue('allAgree', checked);
    setValue('ageAgree', checked);
    setValue('termsAgree', checked);
    setValue('privacyAgree', checked);
  };

  // 각 체크박스 onChange 핸들러
  const handleCheckboxChange = (fieldName: keyof IAgreeForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(fieldName, e.target.checked);
  };

  // 하위 체크박스들의 상태 변화에 따른 전체 동의 동기화
  useEffect(() => {
    const isAll = ageAgree && termsAgree && privacyAgree;
    setValue('allAgree', isAll);
  }, [ageAgree, termsAgree, privacyAgree, setValue]);

  const onSubmit = () => {
    onNext();
  };

  const renderContent = (content: any[] | string) => {
    if (typeof content === 'string') {
      // eslint-disable-next-line react/no-danger
      return <p className="text-type4" key={content} dangerouslySetInnerHTML={{ __html: content }} />;
    }
    return (
      <ul className="list-terms">
        {Children.toArray(
          content.map((item: any[]) => {
            if (typeof item === 'string') {
              // eslint-disable-next-line react/no-danger
              return <li dangerouslySetInnerHTML={{ __html: item }} />;
            }
            return <li className="styleNone">{renderContent(item)}</li>;
          }),
        )}
      </ul>
    );
  };

  const renderList = ({ contentItem }: { contentItem: termsContentItem[] }) => {
    return contentItem.map((item: termsContentItem) => (
      <div className="wrap-terms" key={item.title}>
        {item.title && <strong className="subtitle-type5">{item.title}</strong>}
        {Children.toArray(
          item.contents.map((childItem) => {
            console.log('childItem', childItem);
            return renderContent(childItem);
          }),
        )}
      </div>
    ));
  };

  return (
    <Form form={form} onSubmit={onSubmit} className="wrap-auth wrap-signup">
      <div className="group-terms">
        <div className="head-terms">
          <Checkbox
            name="allAgree"
            id="checkAll"
            className="item-all"
            checked={allAgree}
            label="전체 동의합니다."
            onChange={handleAllAgree}
          />
        </div>
        <div className="cont-terms">
          <Checkbox
            name="ageAgree"
            id="check01"
            checked={ageAgree}
            label={
              <>
                <span className="txt-red">(필수) </span>만 14세 이상입니다.
              </>
            }
            onChange={handleCheckboxChange('ageAgree')}
          />
          <Checkbox
            name="termsAgree"
            id="check02"
            checked={termsAgree}
            label={
              <>
                <span className="txt-red">(필수) </span>
                <span className=" font-semibold">아이스크림 킨더보드 이용약관</span>에 동의합니다.
              </>
            }
            onChange={handleCheckboxChange('termsAgree')}
          />
          <div className="box-terms">
            <h4 className="screen_out">{TERMS_USE.title}</h4>
            {renderList(TERMS_USE)}
          </div>
          <Checkbox
            name="privacyAgree"
            id="check03"
            checked={privacyAgree}
            label={
              <>
                <span className="txt-red">(필수) </span>
                <span className=" font-semibold">개인정보 수집 및 이용</span>에 동의합니다.
              </>
            }
            onChange={handleCheckboxChange('privacyAgree')}
          />
          <div className="box-terms">
            <h4 className="screen_out">{TERMS_PRIVACY.title}</h4>
            {renderList(TERMS_PRIVACY)}
          </div>
        </div>
      </div>

      <Button type="submit" size="xlarge" color="black" disabled={!allAgree}>
        다음으로
      </Button>
    </Form>
  );
}
