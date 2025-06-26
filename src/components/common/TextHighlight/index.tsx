import { ITextHighlight } from '@/components/common/TextHighlight/types';
import { FunctionComponent } from 'react';

/**
 * 검색결과 하이라이트 텍스트
 * @param {string} text 원본텍스트
 * @param {string} highlight 강조 텍스트
 * @param {Color} color 기본 색상
 * @param {Color} highlightColor 강조 색상
 */
export const TextHighlight: FunctionComponent<ITextHighlight> = ({
  text,
  highlight,
  color = 'gray',
  highlightColor = 'black',
  className,
  ...props
}) => {
  if (!highlight) {
    return (
      <span className={className} style={{ color }} {...props}>
        {text}
      </span>
    );
  }

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span
      className={className}
      style={{
        color,
      }}
      {...props}
    >
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span
            key={`${part}_bold`}
            style={{
              color: highlightColor,
            }}
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
};
