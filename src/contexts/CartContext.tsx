import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { z } from 'zod'

const CartItemSchema = z.object({
  shape:           z.enum(['square', 'circle', 'heart', 'pear']),
  metal:           z.enum(['steel', 'silver', '10k', '18k']),
  metalColor:      z.enum(['white', 'gold', 'rose']),
  birthstoneIndex: z.number().int().min(0).max(11),
  price:           z.number().positive(),
  specLine:        z.string(),
})

export type CartItem = z.infer<typeof CartItemSchema>

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
      if (!stored) return []
      const parsed = JSON.parse(stored)
      return CartItemSchema.array().parse(parsed)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
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
