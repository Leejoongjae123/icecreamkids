'use client';

import cx from 'clsx';
import React, {
  useState,
  useRef,
  forwardRef,
  ChangeEventHandler,
  FocusEventHandler,
  KeyboardEvent,
  useImperativeHandle,
  useEffect,
  useMemo,
  Children,
} from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { InputProps } from './types';

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    options = [],
    style,
    type = 'text',
    sizeType = 'small',
    onPressEnter,
    onKeyDown,
    onChange,
    onFocus,
    onBlur,
    onClear,
    onSearch,
    onSelectOption,
    onDeleteOption,
    isError = false,
    disabled = false,
    hasDelBtn = false,
    infoMessage,
    errorMessage,
    time,
    value,
    textKey = 'text',
    valueKey = 'value',
    labelKey = 'label',
    iconKey = 'icon',
    useSearchHistory = false,
    ...restProps
  } = props;

  const [isFocus, setIsFocus] = useState(false);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const boxRef = useRef<HTMLDivElement>(null);

  const internalRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => internalRef.current as HTMLInputElement);

  const optionList = options.map((d) => {
    if (typeof d === 'string' || typeof d === 'number') {
      return { text: d, value: d };
    }
    return d;
  });

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // 포커스 아웃 시 닫힘 처리
  useClickOutside(boxRef, () => {
    setIsOpen(false);
  });

  const handleClickInput = () => {
    if (!disabled && useSearchHistory) {
      setIsOpen(true);
    }
  };

  // 옵션 클릭 핸들러
  const handleClickOption = (optionValue: string) => {
    setQuery(optionValue);
    setIsOpen(false);

    if (onSelectOption) {
      onSelectOption(optionValue as string);
    }
  };

  const handleClickOptionDeleteButton = (option: string | number) => {
    if (onDeleteOption) {
      onDeleteOption(option);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (onPressEnter && e.key === 'Enter') {
      onPressEnter(e);
      setIsOpen(false);
    } else {
      onKeyDown?.(e);
    }
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setQuery(e.target.value);
    onChange?.(e);
  };

  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    onFocus?.(e);
    setIsFocus(true);
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    onBlur?.(e);
    setTimeout(() => {
      setIsFocus(false);
    }, 200);
  };

  const toggleShowPassword = () => setIsShowPassword((prev) => !prev);

  const handleClickSearchButton = () => {
    onSearch?.(query);
  };

  const handleClickClearButton = () => {
    if (internalRef.current) {
      internalRef.current.value = '';
      onClear?.();
    }
    setQuery('');
  };

  // 검색어 하이라이트
  const highlightText = (text: string, optionValue: string) => {
    if (!optionValue) return text;
    const parts = text.split(new RegExp(`(${optionValue})`, 'gi'));
    return Children.toArray(
      parts.map((part, idx) =>
        part.toLowerCase() === optionValue.toLowerCase() ? <span className="font-bold">{part}</span> : part,
      ),
    );
  };

  const currentOptionList = useMemo(() => {
    return optionList.filter((option) =>
      (option.text as string).toLowerCase().includes((query as string).toLowerCase()),
    );
  }, [optionList, query]);

  return (
    <div
      className={cx('item-text', {
        [`type-${sizeType}`]: true,
        'type-password': type === 'password',
        'type-search': type === 'search',
      })}
      style={style}
    >
      <div
        ref={boxRef}
        className={cx('inner-text', {
          focus: isFocus,
          disabled: props.disabled,
          readonly: props.readOnly,
          error: isError,
        })}
      >
        <input
          ref={internalRef}
          type={type === 'password' && isShowPassword ? 'text' : type}
          value={query}
          autoComplete={type === 'search' ? 'off' : 'on'}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={props.disabled}
          onClick={handleClickInput}
          {...restProps}
          className={cx('inp-text', props.className)}
        />
        {type === 'password' && (
          <button type="button" className="btn-show" onClick={toggleShowPassword}>
            <span className="ico-comm ico-eye-off-16">입력한 비밀번호 보기/가리기</span>
          </button>
        )}
        {type === 'search' && (
          <>
            <button type="button" className="btn-clear" onClick={handleClickClearButton}>
              <span className="ico-comm ico-delete-18">입력내용 초기화</span>
            </button>
            <button type="button" className="btn-search" onClick={handleClickSearchButton}>
              <span className="ico-comm ico-search-18">검색하기</span>
            </button>
            {isOpen && (
              <div
                className={cx(
                  'box-option',
                  (optionList.length === 0 || (currentOptionList.length === 0 && query)) && 'empty',
                )}
                style={{ minHeight: 'unset' }}
              >
                {(!query && optionList.length > 0) || (query && currentOptionList.length !== 0) ? (
                  <>
                    <em className="screen_out">선택옵션</em>
                    <ul className="list-option">
                      {currentOptionList.map((option, idx) => {
                        return (
                          <li key={option[valueKey] as string}>
                            <button
                              type="button"
                              className="btn-option"
                              onClick={() => handleClickOption(option[valueKey] as string)}
                            >
                              {option[iconKey] && <span className={cx('ico-comm', `ico-${option[iconKey]}`)} />}
                              <span className="txt-option">
                                {highlightText(option[textKey] as string, query as string)}
                              </span>
                              {option[labelKey] && <span className="txt-label">{option[labelKey]}</span>}
                            </button>
                            {hasDelBtn && (
                              <button
                                type="button"
                                className="btn-del"
                                onClick={() => handleClickOptionDeleteButton(option[valueKey])}
                              >
                                <span className="ico-comm ico-delete-12">삭제</span>
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <p className="txt-empty">검색된 내용이 없습니다.</p>
                )}
              </div>
            )}
          </>
        )}
        {time && (
          <span
            style={{
              padding: '0 20px',
              marginTop: 0,
              fontSize: '14px',
            }}
            className="txt-error"
          >
            {time}
          </span>
        )}
      </div>
      {infoMessage && <p className="txt-info">{infoMessage}</p>}
      {isError && errorMessage && <p className="txt-error">{errorMessage}</p>}
    </div>
  );
});

Input.displayName = 'Input'; // To avoid issues with forwardRef's name in the devtools
