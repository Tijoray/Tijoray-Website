import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type CartItem = {
  shape:           'square' | 'circle' | 'heart' | 'pear'
  metal:           'steel'  | 'silver' | '10k'   | '18k'
  metalColor:      'white'  | 'gold'   | 'rose'
  birthstoneIndex: number   // 0–11
  price:           number   // USD dollars (not cents)
  specLine:        string   // human-readable summary
}

type CartContextValue = {
  items:      CartItem[]
  addItem:    (item: CartItem) => void
  removeItem: (index: number) => void
  clearCart:  () => void
}

const STORAGE_KEY = 'tijoray_cart'

const CartContext = createContext<CartContextValue>({
  items:      [],
  addItem:    () => {},
  removeItem: () => {},
  clearCart:  () => {},
})

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (items.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    else localStorage.removeItem(STORAGE_KEY)
  }, [items])

  const addItem    = (newItem: CartItem) => setItems(prev => [...prev, newItem])
  const removeItem = (index: number)    => setItems(prev => prev.filter((_, i) => i !== index))
  const clearCart  = ()                 => setItems([])

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
