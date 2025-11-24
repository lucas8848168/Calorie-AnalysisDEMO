import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number;
    item: T;
    offsetTop: number;
  }>;
  totalHeight: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollToIndex: (index: number) => void;
}

export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
): VirtualScrollResult<T> {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    if (items[i]) {
      virtualItems.push({
        index: i,
        item: items[i],
        offsetTop: i * itemHeight,
      });
    }
  }

  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    },
    [itemHeight]
  );

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
  };
}
