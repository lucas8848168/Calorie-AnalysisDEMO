// Service Worker registration utility

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function register(config?: ServiceWorkerConfig) {
  if ('serviceWorker' in navigator) {
    // Wait for page load
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;

      registerValidSW(swUrl, config);
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('[SW] Back online');
      config?.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('[SW] Gone offline');
      config?.onOffline?.();
    });
  }
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('[SW] Service Worker registered:', registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              console.log('[SW] New content available; please refresh.');
              config?.onUpdate?.(registration);
            } else {
              // Content cached for offline use
              console.log('[SW] Content cached for offline use.');
              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Error during service worker registration:', error);
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] Error unregistering service worker:', error);
      });
  }
}

export function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.update();
      })
      .catch((error) => {
        console.error('[SW] Error checking for updates:', error);
      });
  }
}

export function isOnline(): boolean {
  return navigator.onLine;
}
