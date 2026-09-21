"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Minus, Plus, ShoppingCart, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { QRCodeModal } from "@/components/qr-code-modal"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  category: { id: string; name: string }
}

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface CreatedOrder {
  orderNumber: string
  trackingCode: string
  totalAmount: number
}

export function NewOrderClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?active=true")
        if (res.ok) {
          const data = await res.json()
          setProducts(data ?? [])
        }
      } catch (err: any) {
        console.error("Fetch products error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0)
    })
  }

  const getCartQuantity = (productId: string) => {
    return cart.find((i) => i.productId === productId)?.quantity ?? 0
  }

  const total = cart.reduce((sum, i) => sum + (i?.price ?? 0) * (i?.quantity ?? 0), 0)

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Adicione itens ao pedido")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          notes,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCreatedOrder({
          orderNumber: data?.orderNumber ?? '',
          trackingCode: data?.trackingCode ?? '',
          totalAmount: data?.totalAmount ?? 0,
        })
        setShowQR(true)
        setCart([])
        setNotes("")
        toast.success("Pedido criado com sucesso!")
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? "Erro ao criar pedido")
      }
    } catch {
      toast.error("Erro ao criar pedido")
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewOrder = () => {
    setCreatedOrder(null)
    setShowQR(false)
  }

  // Group products by category
  const categories = new Map<string, { name: string; products: Product[] }>()
  ;(products ?? []).forEach((p: Product) => {
    const catId = p?.category?.id ?? p?.categoryId ?? 'uncategorized'
    const catName = p?.category?.name ?? 'Outros'
    if (!categories.has(catId)) {
      categories.set(catId, { name: catName, products: [] })
    }
    categories.get(catId)?.products?.push(p)
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando cardápio...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-primary" />
          Novo Pedido
        </h1>
        <p className="text-muted-foreground mt-1">Selecione os itens para criar o pedido</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Products */}
        <div className="lg:col-span-2 space-y-6">
          {Array.from(categories.entries()).map(([catId, cat]) => (
            <div key={catId}>
              <h2 className="text-lg font-display font-semibold mb-3">{cat.name}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(cat.products ?? []).map((product: Product) => {
                  const qty = getCartQuantity(product.id)
                  return (
                    <Card key={product.id} className={qty > 0 ? 'ring-2 ring-primary/30' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{product?.name ?? ''}</h3>
                            {product?.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.description}</p>
                            )}
                            <p className="text-primary font-mono font-semibold mt-1">
                              ¥{(product?.price ?? 0).toLocaleString('ja-JP')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {qty > 0 ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(product.id, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-mono font-semibold">{qty}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(product.id, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addToCart(product)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Adicione itens ao pedido</p>
                ) : (
                  <>
                    {cart.map((item: CartItem) => (
                      <div key={item.productId} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Badge variant="secondary" className="font-mono">{item.quantity}x</Badge>
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-muted-foreground">
                            ¥{((item?.price ?? 0) * (item?.quantity ?? 0)).toLocaleString('ja-JP')}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => updateQuantity(item.productId, -(item?.quantity ?? 1))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-3 space-y-1.5">
                      <label htmlFor="order-notes" className="text-sm font-medium">Observações</label>
                      <textarea
                        id="order-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        maxLength={500}
                        rows={3}
                        placeholder="Ex.: sem cebola, ponto da carne, recado para a cozinha..."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="font-mono">¥{total.toLocaleString('ja-JP')}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full h-12 text-lg font-semibold"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Criando...</>
                      ) : (
                        "Confirmar Pedido"
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {createdOrder && (
        <QRCodeModal
          open={showQR}
          onClose={handleNewOrder}
          orderNumber={createdOrder.orderNumber}
          trackingCode={createdOrder.trackingCode}
          totalAmount={createdOrder.totalAmount}
        />
      )}
    </div>
  )
}
