/**
 * Component preloader utility
 * Preloads lazy-loaded components on user interaction or idle time
 */

// Store preloaded components to avoid duplicate loading
const preloadedComponents = new Set<string>();

/**
 * Preload a lazy component
 */
export function preloadComponent(
  componentLoader: () => Promise<any>,
  componentName: string
): void {
  if (preloadedComponents.has(componentName)) {
    return;
  }

  componentLoader()
    .then(() => {
      preloadedComponents.add(componentName);
      console.log(`✅ Preloaded component: ${componentName}`);
    })
    .catch((error) => {
      console.warn(`Failed to preload component: ${componentName}`, error);
    });
}

/**
 * Preload components on idle
 */
export function preloadOnIdle(
  componentLoader: () => Promise<any>,
  componentName: string
): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponent(componentLoader, componentName);
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      preloadComponent(componentLoader, componentName);
    }, 1000);
  }
}

/**
 * Preload components on hover/focus
 */
export function preloadOnInteraction(
  element: HTMLElement | null,
  componentLoader: () => Promise<any>,
  componentName: string
): void {
  if (!element) return;

  const preload = () => {
    preloadComponent(componentLoader, componentName);
    // Remove listeners after first preload
    element.removeEventListener('mouseenter', preload);
    element.removeEventListener('focus', preload);
  };

  element.addEventListener('mouseenter', preload, { once: true });
  element.addEventListener('focus', preload, { once: true });
}

/**
 * Preload all lazy components
 */
export function preloadAllComponents(): void {
  // This can be called after initial page load to preload all lazy components
  preloadOnIdle(() => import('../components/HistoryList'), 'HistoryList');
  preloadOnIdle(() => import('../pages/DataAnalysis'), 'DataAnalysis');
  preloadOnIdle(() => import('../pages/GoalManagement'), 'GoalManagement');
}
