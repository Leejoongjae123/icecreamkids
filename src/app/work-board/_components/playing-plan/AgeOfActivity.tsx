import { SelectButton } from '../select-button/SelectButton';
import styles from './AgeOfActivity.module.scss';

interface AgeRangeProps {
  selected: string;
  onSelect: (range: string) => void;
}

export function AgeOfActivity({ selected, onSelect }: AgeRangeProps) {
  const ranges = [
    { label: '2세', value: '2' },
    { label: '3세', value: '3' },
    { label: '4세', value: '4' },
    { label: '5세', value: '5' },
    { label: '6세', value: '6' },
    { label: '7세', value: '7' },
  ];
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>놀이연령</h3>
      <div className={styles.buttonGroup}>
        {ranges.map((range) => (
          <SelectButton key={range.value} selected={selected === range.value} onClick={() => onSelect(range.value)}>
            {range.label}
          </SelectButton>
        ))}
      </div>
    </div>
  );
}

export default AgeOfActivity;
