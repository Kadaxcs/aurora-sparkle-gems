import { useState, useEffect } from 'react';

// Preloader para imagens críticas
export const ImagePreloader = ({ srcs }: { srcs: string[] }) => {
  useEffect(() => {
    const promises = srcs.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });
    });

    Promise.all(promises).catch(console.error);
  }, [srcs]);

  return null;
};

// Hook para otimização de imagens
export const useImageOptimization = () => {
  const getOptimizedImageUrl = (url: string, width: number = 400, quality: number = 80) => {
    // Se for uma URL de base64 ou local, retornar como está
    if (url.startsWith('data:') || url.startsWith('/')) {
      return url;
    }
    
    // Para URLs externas, aplicar otimizações se disponível
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', width.toString());
      urlObj.searchParams.set('q', quality.toString());
      return urlObj.toString();
    } catch {
      return url;
    }
  };

  return { getOptimizedImageUrl };
};