import type { ReactNode } from 'react';
import styles from './SelectButton.module.scss';

interface SelectButtonProps {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export const SelectButton = ({ selected, onClick, children, disabled }: SelectButtonProps) => {
  return (
    <button
      type="button"
      className={`${styles.button} ${selected ? styles.selected : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
