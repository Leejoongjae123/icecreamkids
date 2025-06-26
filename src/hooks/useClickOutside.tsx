import type { RefObject } from 'react';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

export const useClickOutside = (ref: RefObject<HTMLElement | undefined>, callback: () => void) => {
  useIsomorphicLayoutEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as HTMLElement)) {
        callback();
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
};

export const useClickThumbnailOutside = (ref: React.RefObject<HTMLElement>, callback: (event: MouseEvent) => void) => {
  useIsomorphicLayoutEffect(() => {
    const handleMouseLeave = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.relatedTarget as Node)) {
        callback(event);
      }
    };
    const node = ref.current;

    if (node) {
      node.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (node) {
        node.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [ref, callback]);
};
