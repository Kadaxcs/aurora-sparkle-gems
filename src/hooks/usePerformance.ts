import { useEffect } from 'react';

// Preload critical resources
export const usePreloadCriticalResources = () => {
  useEffect(() => {
// Add preconnect to Supabase for faster API calls
    const preconnectLink = document.createElement('link');
    preconnectLink.rel = 'preconnect';
    preconnectLink.href = 'https://vmhpmgiozhfzkzymvmaq.supabase.co';
    document.head.appendChild(preconnectLink);

    // Preload only actual image assets with correct paths
    const criticalImages = [
      '/src/assets/hero-ring.jpg',
      '/src/assets/necklace-collection.jpg',
      '/src/assets/earrings-collection.jpg',
      '/src/assets/bracelets-collection.jpg'
    ];

    criticalImages.forEach(src => {
      const img = new Image();
      img.src = src;
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