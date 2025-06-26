import type React from 'react';
import { forwardRef, type ReactNode } from 'react';
import cx from 'clsx';

export type RadioOption = {
  id?: string;
  image?: string;
  text: string;
  value: string | number | undefined;
  custom?: ReactNode;
  labHidden?: boolean;
  className?: string;
  tooltip?: {
    contents: string;
  };
};

interface RadioProps extends React.HTMLProps<HTMLInputElement> {
  className?: string;
  options: RadioOption[];
  isError?: boolean;
  name: string;
  readOnly?: boolean;
  disabled?: boolean;
  value?: number | string;
  isLabel?: boolean;
  isCustom?: boolean;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ options, name, id, isLabel = true, isCustom = false, ...props }, ref) => {
    return (
      <div className={cx('group-choice', props.className)}>
        {options?.map((option: RadioOption, index) => {
          return (
            <div className={cx('item-choice', option.className)} key={`${option.value}-radio`}>
              <input
                type="radio"
                id={name + index}
                name={name}
                className="inp-comm"
                value={option.value}
                checked={props.value === option.value}
                onChange={props.onChange}
                readOnly={props.readOnly}
                disabled={props.disabled}
                ref={ref}
              />
              <label htmlFor={name + index} className="lab-radio">
                <span className="ico-comm ico-inp-radio" />
                {isLabel && <span className={cx(option.labHidden ? 'screen_out' : 'txt-radio')}>{option.text}</span>}
                {isCustom && option.custom}
                {/* {option.tooltip && <Tooltip {...option.tooltip} />} */}
              </label>
            </div>
          );
        })}
      </div>
    );
  },
);

Radio.displayName = 'Radio';
