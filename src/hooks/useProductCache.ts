import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: T, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

export const productCache = new MemoryCache<any>();
export const categoriesCache = new MemoryCache<any[]>();

export function useProductCache() {
  const getCachedProduct = useCallback((productId: string) => {
    return productCache.get(productId);
  }, []);

  const setCachedProduct = useCallback((productId: string, product: any) => {
    productCache.set(productId, product);
  }, []);

  const getCachedCategories = useCallback(() => {
    return categoriesCache.get('categories');
  }, []);

  const setCachedCategories = useCallback((categories: any[]) => {
    categoriesCache.set('categories', categories);
  }, []);

  return {
    getCachedProduct,
    setCachedProduct,
    getCachedCategories,
    setCachedCategories,
    clearCache: () => {
      productCache.clear();
      categoriesCache.clear();
    }
  };
}