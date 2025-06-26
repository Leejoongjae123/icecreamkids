import { createContext, useContext, forwardRef, HTMLAttributes, useId, useMemo, ReactNode } from 'react';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  UseFormReturn,
} from 'react-hook-form';
import cx from 'clsx';

interface FormProps<TFieldValues extends FieldValues> {
  /**
   * form id
   */
  id?: string;
  /**
   * form class
   */
  className?: string;
  /**
   * 폼 공통 에러메시지 (vertical type2)
   */
  errorMessage?: string;
  /**
   * react hook form 객체
   */
  form: UseFormReturn<TFieldValues>; // react-hook-form의 form 객체를 받음
  /**
   * form children node
   */
  style?: React.CSSProperties;
  /**
   * style
   */
  children: ReactNode;
  /**
   * onSubmit 이벤트
   */
  onSubmit?: (values: TFieldValues) => void;
  /**
   * 에러체크용
   */
  onError?: (errors: any) => void; // 추가
}

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>((props, ref) => {
  const id = useId();
  const contextValue = useMemo(() => ({ id }), [id]);

  return <FormItemContext.Provider value={contextValue} {...props} />;
});
FormItem.displayName = 'FormItem';

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);

const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }
  const itemContext = useContext(FormItemContext);
  const { control, formState } = useFormContext();
  const fieldState = control.getFieldState(fieldContext.name, formState);

  const { id } = itemContext;
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

const FormLabel = forwardRef<HTMLLabelElement, HTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => {
  const { formItemId } = useFormField();

  return <label ref={ref} className={cx('lab-form', className)} htmlFor={formItemId} {...props} />;
});
FormLabel.displayName = 'FormLabel';

const FormControl = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <div
      ref={ref}
      id={formItemId}
      className={cx('fieldset-form', props.className)}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormMessage = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : children;

    if (!body) {
      return null;
    }

    return (
      <p ref={ref} id={formMessageId} className={cx(error && 'txt-error', className)} {...props}>
        {body}
      </p>
    );
  },
);
FormMessage.displayName = 'FormMessage';

const Form = <TFieldValues extends FieldValues>({
  style,
  form,
  children,
  onSubmit,
  onError,
  id,
  className,
  errorMessage,
}: FormProps<TFieldValues>) => {
  const handleSubmit = onSubmit ? form.handleSubmit(onSubmit, onError) : undefined;

  return (
    <FormProvider {...form}>
      <form id={id} className={cx('group-form', className)} style={style} onSubmit={handleSubmit}>
        {children}
        {errorMessage && <p className="txt-error">{errorMessage}</p>}
      </form>
    </FormProvider>
  );
};

interface ExtendedControllerProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>
  extends ControllerProps<TFieldValues, TName> {
  label?: string; // label 속성 추가
  labelHidden?: boolean;
  useErrorMessage?: boolean;
  required?: boolean;
  info?: string;
  confirm?: string;
  fieldsetClass?: string;
}

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ExtendedControllerProps<TFieldValues, TName>) => {
  const { label = '', labelHidden = false, useErrorMessage = false, required = false, info = '', confirm = '' } = props;
  const contextValue = useMemo(() => ({ name: props.name }), [props.name]);
  return (
    <FormFieldContext.Provider value={contextValue}>
      <FormItem>
        <FormControl className={cx('fieldset-form', props.fieldsetClass)}>
          {label && (
            <FormLabel className={cx(labelHidden && 'screen_out')}>
              {label}
              {required && <span className="txt-required">필수입력</span>}
            </FormLabel>
          )}
          <Controller {...props} />
          {info && <p className="txt-info">{info}</p>}
          {confirm && <p className="txt-confirm">{confirm}</p>}
          {useErrorMessage && <FormMessage />}
        </FormControl>
      </FormItem>
    </FormFieldContext.Provider>
  );
};

export { Form, FormItem, FormField, FormLabel, FormControl, FormMessage };
