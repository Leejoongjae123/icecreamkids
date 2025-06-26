import { useClickOutside } from '@/hooks/useClickOutside';
import cx from 'clsx';
import React, { SelectHTMLAttributes, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  [key: string]: string | number;
}

export type FormSize = 'small' | 'medium' | 'large';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'size'> {
  options: SelectOption[] | (string | number)[];
  onChange?: (value: string | number | (number | string)[]) => void;
  placeholder?: string;
  multiple?: boolean;
  size?: FormSize;
  value?: string | number | string[];
  isError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  textKey?: string;
  valueKey?: string;
  iconKey?: string;
  labelKey?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      onChange,
      size = 'medium',
      options,
      multiple = false,
      placeholder = '선택',
      isError = false,
      disabled = false,
      readOnly = false,
      value,
      name,
      textKey = 'text',
      valueKey = 'value',
      labelKey = 'label',
      iconKey = 'icon',
      style,
      className,
    }: SelectProps,
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);
    const [optionsPos, setOptionsPos] = useState({ top: 0, left: 0 });

    // 옵션 목록 계산 - 의존성 배열 최적화
    const optionList = useMemo(
      () => options.map((d) => (typeof d === 'string' || typeof d === 'number' ? { text: d, value: d } : d)),
      [options],
    );

    // 선택된 값 계산 - 로직 간소화
    const selectedValues = useMemo(
      () =>
        multiple
          ? Array.isArray(value)
            ? value
            : []
          : typeof value === 'string' || typeof value === 'number'
            ? [value]
            : [],
      [value, multiple],
    );

    // 선택된 텍스트 표시 - 반복 계산 최적화
    const selectedItemText = useMemo(() => {
      if (selectedValues.length === 0) return undefined;

      if (multiple) {
        return selectedValues
          .map((val) => {
            const option = optionList.find((opt) => opt[valueKey] === val);
            return option ? option[textKey] : '';
          })
          .filter(Boolean)
          .join(', ');
      }

      const option = optionList.find((opt) => opt[valueKey] === selectedValues[0]);
      return option ? option[textKey] : undefined;
    }, [optionList, selectedValues, multiple, textKey, valueKey]);

    // 옵션 클릭 핸들러 - 불변성 최적화
    const handleClickOption = useCallback(
      (optionValue: string) => {
        if (!onChange) return;

        if (multiple) {
          const newValues = selectedValues.includes(optionValue)
            ? selectedValues.filter((val) => val !== optionValue)
            : [...selectedValues, optionValue];
          onChange(newValues);
        } else {
          onChange(optionValue);
          setIsOpen(false);
        }
      },
      [onChange, selectedValues, multiple],
    );

    // 셀렉트 버튼 클릭 핸들러
    const handleClickSelectButton = useCallback(() => {
      if (!disabled) {
        setIsOpen((prev) => !prev);
      }
    }, [disabled]);

    // 포커스 아웃 시 닫힘 처리
    useClickOutside(boxRef, () => {
      setIsOpen(false);
    });

    // 위치 업데이트 함수 - 이벤트 핸들러 최적화
    const updatePosition = useCallback(() => {
      if (boxRef.current) {
        const rect = boxRef.current.getBoundingClientRect();
        setOptionsPos({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      }
    }, []);

    useEffect(() => {
      if (isOpen) {
        document.body.classList.add('select-open');
        updatePosition();

        // isOpen일 일때만 실행시키기
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);
      } else {
        document.body.classList.remove('select-open');
      }

      return () => {
        document.body.classList.remove('select-open');
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }, [isOpen, updatePosition]);

    const containerClass = useMemo(() => cx('item-text', 'type-select', `type-${size}`, className), [size, className]);
    const innerTextClass = useMemo(
      () =>
        cx('inner-text', {
          open: isOpen,
          disabled,
          error: isError,
          on: !!selectedItemText,
          readonly: readOnly,
        }),
      [isOpen, disabled, isError, selectedItemText, readOnly],
    );

    const optionBoxClass = useMemo(
      () =>
        cx('box-option', {
          empty: optionList.length === 0,
        }),
      [optionList.length],
    );

    return (
      <div className={containerClass} style={style}>
        <div ref={boxRef} className={innerTextClass}>
          <strong className="screen_out">선택상자</strong>
          <button
            title={selectedItemText as string}
            type="button"
            className="btn-select"
            onClick={handleClickSelectButton}
            disabled={disabled || readOnly}
          >
            <span className="ico-comm ico-arrow-down2-16">선택됨</span>
            {selectedItemText ?? placeholder}
          </button>
          <input type="hidden" value={value ?? ''} name={name} />

          {/* Portal은 isOpen일 때만 렌더링하여 성능 개선 */}
          {isOpen &&
            createPortal(
              <div
                style={{
                  position: 'absolute',
                  top: optionsPos.top,
                  left: optionsPos.left,
                  width: boxRef.current?.offsetWidth,
                  zIndex: 9999,
                }}
                className={optionBoxClass}
              >
                {optionList.length > 0 ? (
                  <>
                    <em className="screen_out">선택옵션</em>
                    <ul className="list-option">
                      {optionList.map((option) => {
                        const optionValue = option[valueKey] as string;
                        const isSelected = selectedValues.includes(optionValue);
                        const listItemClass = cx({
                          selected: selectedItemText === option[textKey],
                        });

                        return (
                          <li key={optionValue} className={listItemClass}>
                            {multiple ? (
                              <div className="item-choice">
                                <input
                                  type="checkbox"
                                  className="inp-comm"
                                  id={optionValue}
                                  name={optionValue}
                                  checked={isSelected}
                                  value={optionValue}
                                  onChange={() => handleClickOption(optionValue)}
                                />
                                <label htmlFor={optionValue} className="lab-check">
                                  <span className="ico-comm ico-inp-check" />
                                  <span className="txt-check">{option[textKey]}</span>
                                  {option[labelKey] && <span className="txt-label">{option[labelKey]}</span>}
                                </label>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn-option"
                                title={option[textKey] as string}
                                onClick={() => handleClickOption(optionValue)}
                              >
                                {option[iconKey] && <span className={cx('ico-comm', `ico-${option[iconKey]}`)} />}
                                <span className="txt-option">{option[textKey]}</span>
                                {option[labelKey] && <span className="txt-label">{option[labelKey]}</span>}
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {multiple && (
                      <div className="group-btn">
                        <button type="button" className="btn btn-small btn-gray" onClick={() => setIsOpen(false)}>
                          선택
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="txt-empty">검색된 내용이 없습니다.</p>
                )}
              </div>,
              document.body,
            )}
        </div>
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
