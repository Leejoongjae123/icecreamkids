import ReactSelecto from 'react-selecto';
import type { ISelectoGridProps } from './types';

export default function SelectoGrid({ onSelectionChange }: ISelectoGridProps) {
  return (
    <ReactSelecto
      selectableTargets={['.selectable']}
      selectByClick
      selectFromInside={false}
      hitRate={0}
      dragCondition={(e) => {
        if (e.inputEvent.button === 2 || e.inputEvent.metaKey) return false;
        const target = e.inputEvent.target as HTMLElement;
        return !target.closest('.selectable');
      }}
      onSelect={(e) => {
        const ids = e.selected.map((el) => Number(el.dataset.id));
        onSelectionChange(ids);
      }}
    />
  );
}
