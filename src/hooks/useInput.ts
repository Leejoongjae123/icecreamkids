'use client';

import { Dispatch, SetStateAction, useCallback, useState } from 'react';

interface InputInterface {
  inputValue: string;
  setInputValue: Dispatch<SetStateAction<string>>;
  onClear: () => void;
}
export const useInput = (value: string): InputInterface => {
  const [inputValue, setInputValue] = useState(value);

  const onClear = useCallback(() => {
    setInputValue('');
  }, []);

  return {
    inputValue,
    setInputValue,
    onClear,
  };
};
