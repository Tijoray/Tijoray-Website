import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { z } from 'zod'

const CartItemSchema = z.object({
  // Product identity — which matrix cell (collection × product type) this is.
  // Optional w/ defaults so carts saved before this field still validate.
  productType:     z.enum(['pendant', 'bracelet']).default('pendant'),
  collectionId:    z.string().default('birthstone'),
  shape:           z.enum(['square', 'circle', 'heart', 'pear']),
  metal:           z.enum(['silver', '10k', '18k']),
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
  /** Slide-over cart. Adding a piece opens it instead of leaving the page, so a
   *  shopper can keep designing (people buy pendants in sets, one stone each). */
  cartOpen:   boolean
  openCart:   () => void
  closeCart:  () => void
}

const STORAGE_KEY = 'tijoray_cart'

const CartContext = createContext<CartContextValue>({
  items:      [],
  addItem:    () => {},
  removeItem: () => {},
  clearCart:  () => {},
  cartOpen:   false,
  openCart:   () => {},
  closeCart:  () => {},
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

  const [cartOpen, setCartOpen] = useState(false)

  const addItem    = (newItem: CartItem) => setItems(prev => [...prev, newItem])
  const removeItem = (index: number)    => setItems(prev => prev.filter((_, i) => i !== index))
  const clearCart  = ()                 => { setItems([]); setCartOpen(false) }
  // Stable identities — consumers use these in effect dependency lists.
  const openCart   = useCallback(() => setCartOpen(true),  [])
  const closeCart  = useCallback(() => setCartOpen(false), [])

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, cartOpen, openCart, closeCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
