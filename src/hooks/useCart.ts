import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Debounce utility for performance
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  size?: string;
  products: {
    name: string;
    price: number;
    sale_price?: number;
    images: any;
  };
}

interface LocalCartItem {
  product_id: string;
  quantity: number;
  size?: string;
}

export function useCart(user: any) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState(0);
  const { toast } = useToast();

  // Debounced load function to prevent multiple rapid calls
  const debouncedLoadCartItems = useCallback(
    debounce(() => {
      const now = Date.now();
      if (now - lastLoadTime > 1000) { // Only load if >1s since last load
        setLastLoadTime(now);
        loadCartItems();
      }
    }, 300),
    [user, lastLoadTime]
  );

  // Load cart items when user changes or component mounts
  useEffect(() => {
    debouncedLoadCartItems();
  }, [user?.id]); // Only depend on user ID, not the whole user object

  // Listen for cart updates across components/tabs - optimized
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleCartUpdated = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => debouncedLoadCartItems(), 100);
    };
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cart_items') handleCartUpdated();
    };

    window.addEventListener('cart:updated', handleCartUpdated as EventListener);
    window.addEventListener('storage', handleStorage);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('cart:updated', handleCartUpdated as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [debouncedLoadCartItems]);

  const loadCartItems = async () => {
    setLoading(true);
    try {
      if (user) {
        await loadAuthenticatedCart();
      } else {
        await loadLocalCart();
      }
    } catch (error: any) {
      const isRlsError =
        error?.code === '42501' ||
        (typeof error?.message === 'string' && error.message.toLowerCase().includes('row-level security'));

      if (isRlsError) {
        // Fallback para carrinho local caso políticas RLS impeçam a leitura
        await loadLocalCart();
      } else {
        console.error('Erro ao carregar carrinho:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAuthenticatedCart = useCallback(async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (
          name,
          price,
          sale_price,
          images
        )
      `)
      .eq('user_id', user.id)
      .limit(50); // Limit to prevent large responses

    if (error) throw error;
    setCartItems(data || []);
  }, [user?.id]);

  const loadLocalCart = async () => {
    const localItems = getLocalCartItems();
    if (localItems.length === 0) {
      setCartItems([]);
      return;
    }

    const productIds = localItems.map(item => item.product_id);
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (error) throw error;

    const cartItemsWithProducts: CartItem[] = localItems.map(localItem => {
      const product = products?.find(p => p.id === localItem.product_id);
      return {
        id: `local-${localItem.product_id}-${localItem.size || 'no-size'}`,
        product_id: localItem.product_id,
        quantity: localItem.quantity,
        size: localItem.size,
        products: {
          name: product?.name || '',
          price: product?.price || 0,
          sale_price: product?.sale_price,
          images: product?.images || []
        }
      };
    });

    setCartItems(cartItemsWithProducts);
  };

  const getLocalCartItems = (): LocalCartItem[] => {
    try {
      const stored = localStorage.getItem('cart_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const setLocalCartItems = (items: LocalCartItem[]) => {
    localStorage.setItem('cart_items', JSON.stringify(items));
  };

  const notifyCartUpdated = () => {
    try {
      window.dispatchEvent(new CustomEvent('cart:updated'));
    } catch {}
  };

  const addToCart = async (productId: string, quantity: number = 1, size?: string) => {
    try {
      if (user?.id) {
        await addToAuthenticatedCart(productId, quantity, size);
      } else {
        await addToLocalCart(productId, quantity, size);
      }

      toast({
        title: "Produto adicionado",
        description: "O produto foi adicionado ao carrinho",
      });
    } catch (error: any) {
      // Failover: se houver erro de RLS ou qualquer erro de permissão, usar carrinho local
      const isRlsError =
        error?.code === "42501" ||
        typeof error?.message === "string" && error.message.toLowerCase().includes("row-level security");

      if (user?.id && isRlsError) {
        try {
          await addToLocalCart(productId, quantity, size);
          toast({
            title: "Carrinho local ativado",
            description: "Não foi possível salvar na conta. Mantivemos no carrinho deste dispositivo.",
          });
          return;
        } catch (_) {}
      }

      console.error('Erro ao adicionar ao carrinho:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao carrinho",
        variant: "destructive",
      });
    }
  };

  const addToAuthenticatedCart = useCallback(async (productId: string, quantity: number, size?: string) => {
    if (!user?.id) return;
    
    // Optimistic update - add to state immediately
    const tempItem: CartItem = {
      id: `temp-${Date.now()}`,
      product_id: productId,
      quantity,
      size,
      products: { name: 'Loading...', price: 0, images: [] }
    };
    
    setCartItems(prev => [...prev, tempItem]);

    try {
      // Check if item already exists
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        // Update existing item
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
            size
          });

        if (error) throw error;
      }

      // Reload cart to get actual data
      setTimeout(() => loadAuthenticatedCart(), 100);
      notifyCartUpdated();
    } catch (error) {
      // Remove optimistic update on error
      setCartItems(prev => prev.filter(item => item.id !== tempItem.id));
      throw error;
    }
  }, [user?.id, loadAuthenticatedCart]);

  const addToLocalCart = async (productId: string, quantity: number, size?: string) => {
    const localItems = getLocalCartItems();
    const existingItemIndex = localItems.findIndex(
      item => item.product_id === productId && item.size === size
    );

    if (existingItemIndex >= 0) {
      localItems[existingItemIndex].quantity += quantity;
    } else {
      localItems.push({ product_id: productId, quantity, size });
    }

    setLocalCartItems(localItems);
    await loadLocalCart();
    notifyCartUpdated();
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      if (user && !itemId.startsWith('local-')) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', itemId);

        if (error) throw error;
      } else {
        // Handle local cart
        const item = cartItems.find(item => item.id === itemId);
        if (item) {
          const localItems = getLocalCartItems();
          const localItemIndex = localItems.findIndex(
            localItem => localItem.product_id === item.product_id && localItem.size === item.size
          );
          
          if (localItemIndex >= 0) {
            localItems[localItemIndex].quantity = newQuantity;
            setLocalCartItems(localItems);
          }
        }
      }

      setCartItems(items => 
        items.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
      notifyCartUpdated();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a quantidade",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      if (user && !itemId.startsWith('local-')) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);

        if (error) throw error;
      } else {
        // Handle local cart
        const item = cartItems.find(item => item.id === itemId);
        if (item) {
          const localItems = getLocalCartItems();
          const filteredItems = localItems.filter(
            localItem => !(localItem.product_id === item.product_id && localItem.size === item.size)
          );
          setLocalCartItems(filteredItems);
        }
      }

      setCartItems(items => items.filter(item => item.id !== itemId));
      notifyCartUpdated();
      
      toast({
        title: "Produto removido",
        description: "O produto foi removido do carrinho",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o produto",
        variant: "destructive",
      });
    }
  };

  // Migrate local cart to user cart when user logs in
  const migrateLocalCartToUser = useCallback(async () => {
    if (!user?.id) return;

    const localItems = getLocalCartItems();
    if (localItems.length === 0) return;

    try {
      // Add each local item to authenticated cart
      for (const localItem of localItems) {
        await addToAuthenticatedCart(localItem.product_id, localItem.quantity, localItem.size);
      }
      
      // Clear local storage after successful migration
      localStorage.removeItem('cart_items');
      
      // Reload cart to show updated items
      setTimeout(() => {
        loadAuthenticatedCart();
        notifyCartUpdated();
      }, 100);
      
      toast({
        title: "Carrinho sincronizado",
        description: "Seus itens foram transferidos para sua conta",
      });
    } catch (error) {
      console.error('Erro ao migrar carrinho local:', error);
      toast({
        title: "Aviso",
        description: "Alguns itens podem não ter sido transferidos corretamente",
        variant: "destructive",
      });
    }
  }, [user?.id, addToAuthenticatedCart, loadAuthenticatedCart, toast]);

  const getItemPrice = (item: CartItem) => {
    return item.products.sale_price || item.products.price;
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (getItemPrice(item) * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    getItemPrice,
    getTotal,
    getTotalItems,
    migrateLocalCartToUser
  };
}