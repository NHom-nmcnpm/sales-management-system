import { useEffect, useState } from 'react';
import { CartContext } from './cart.js';
import { useAuth } from './auth.js';

const emptyCart = { items: [], customer: null, promotionId: null };
function readStorage(key, fallback) {
  try { return JSON.parse(sessionStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const cartKey = `pos-cart-${user.id}`;
  const pendingKey = `pos-pending-${user.id}`;
  const [cart, setCart] = useState(() => {
    const stored = readStorage(cartKey, emptyCart);
    return Array.isArray(stored.items) && stored.items.length <= 100 ? { ...emptyCart, ...stored } : emptyCart;
  });
  const [pending, setPendingState] = useState(() => {
    const stored = readStorage(pendingKey, null);
    return stored?.key && Array.isArray(stored.payload?.items) ? stored : null;
  });
  useEffect(() => { sessionStorage.setItem(cartKey, JSON.stringify(cart)); }, [cart, cartKey]);
  function setPending(value) {
    if (value) sessionStorage.setItem(pendingKey, JSON.stringify(value));
    else sessionStorage.removeItem(pendingKey);
    setPendingState(value);
  }
  function clearCart() { setCart(emptyCart); }
  return <CartContext.Provider value={{ cart, setCart, clearCart, pending, setPending }}>{children}</CartContext.Provider>;
}
