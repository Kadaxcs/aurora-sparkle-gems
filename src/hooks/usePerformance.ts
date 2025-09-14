import { useEffect } from 'react';

// Preload critical resources
export const usePreloadCriticalResources = () => {
  useEffect(() => {
    // Preload critical images
    const criticalImages = [
      '/hero-ring.jpg',
      '/necklace-collection.jpg',
      '/earrings-collection.jpg',
      '/bracelets-collection.jpg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    // Preload critical routes
    const criticalRoutes = ['/products', '/aneis', '/colares'];
    criticalRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }, []);
};

// Service Worker registration for aggressive caching
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};