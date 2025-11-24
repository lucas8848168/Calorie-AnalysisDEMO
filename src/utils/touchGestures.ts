/**
 * Touch gesture utilities for mobile optimization
 */

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
}

export interface TouchGestureOptions {
  onSwipe?: (event: SwipeEvent) => void;
  onTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
}

export class TouchGestureHandler {
  private element: HTMLElement;
  private options: TouchGestureOptions;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private longPressTimer: number | null = null;

  constructor(element: HTMLElement, options: TouchGestureOptions = {}) {
    this.element = element;
    this.options = {
      swipeThreshold: 50,
      longPressDelay: 500,
      ...options,
    };

    this.init();
  }

  private init() {
    this.element.addEventListener('touchstart', this.handleTouchStart);
    this.element.addEventListener('touchend', this.handleTouchEnd);
    this.element.addEventListener('touchmove', this.handleTouchMove);
  }

  private handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();

    // Start long press timer
    if (this.options.onLongPress) {
      this.longPressTimer = window.setTimeout(() => {
        this.options.onLongPress?.(e);
      }, this.options.longPressDelay);
    }
  };

  private handleTouchMove = () => {
    // Cancel long press if user moves
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    // Cancel long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const duration = endTime - this.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Detect tap (short duration, small distance)
    if (duration < 200 && distance < 10) {
      this.options.onTap?.(e);
      return;
    }

    // Detect swipe
    if (distance >= (this.options.swipeThreshold || 50)) {
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      let direction: 'left' | 'right' | 'up' | 'down';

      if (angle >= -45 && angle < 45) {
        direction = 'right';
      } else if (angle >= 45 && angle < 135) {
        direction = 'down';
      } else if (angle >= -135 && angle < -45) {
        direction = 'up';
      } else {
        direction = 'left';
      }

      this.options.onSwipe?.({
        direction,
        distance,
        duration,
      });
    }
  };

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }
}

/**
 * Prevent default touch behaviors for better control
 */
export function preventDefaultTouch(element: HTMLElement) {
  element.addEventListener('touchstart', (e) => {
    e.preventDefault();
  }, { passive: false });
}

/**
 * Enable smooth scrolling on iOS
 */
export function enableSmoothScrolling(element: HTMLElement) {
  // @ts-ignore - webkitOverflowScrolling is a non-standard property
  element.style.webkitOverflowScrolling = 'touch';
  element.style.overflowY = 'auto';
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  };
}
