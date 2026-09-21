"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { UtensilsCrossed, Plus, Pencil, Loader2, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  categoryId: string
  category: Category
  active: boolean
  displayOrder: number
}

export function ProductsClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', displayOrder: '0' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ])
      if (prodRes.ok) setProducts(await prodRes.json() ?? [])
      if (catRes.ok) setCategories(await catRes.json() ?? [])
    } catch (err: any) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', description: '', price: '', categoryId: categories?.[0]?.id ?? '', displayOrder: '0' })
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setForm({
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: String(product?.price ?? 0),
      categoryId: product?.categoryId ?? '',
      displayOrder: String(product?.displayOrder ?? 0),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name?.trim?.()) { toast.error("Nome é obrigatório"); return }
    if (!form.price || Number(form.price) <= 0) { toast.error("Preço inválido"); return }
    if (!form.categoryId) { toast.error("Selecione uma categoria"); return }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        description: form.description?.trim?.() || null,
        price: Number(form.price),
        categoryId: form.categoryId,
        displayOrder: Number(form.displayOrder || 0),
      }

      const res = editing
        ? await fetch(`/api/products/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

      if (res.ok) {
        toast.success(editing ? "Produto atualizado!" : "Produto criado!")
        setDialogOpen(false)
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? "Erro ao salvar")
      }
    } catch {
      toast.error("Erro ao salvar produto")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      })
      if (res.ok) {
        toast.success(product.active ? "Produto desativado" : "Produto ativado")
        fetchData()
      }
    } catch {
      toast.error("Erro ao atualizar")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            Produtos
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie os produtos do cardápio</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {(products?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhum produto cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(products ?? []).map((product: Product) => (
            <Card key={product.id} className={!product.active ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product?.name ?? ''}</span>
                    <Badge variant="outline" className="text-xs">{product?.category?.name ?? ''}</Badge>
                    {!product.active && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                  </div>
                  {product?.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-primary">¥{(product?.price ?? 0).toLocaleString('ja-JP')}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(product)}>
                    {product.active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Produto' : 'Adicionar Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target?.value ?? '' })}
                placeholder="Nome do produto"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, description: e.target?.value ?? '' })}
                placeholder="Descrição breve"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (¥)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, price: e.target?.value ?? '' })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayOrder: e.target?.value ?? '0' })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                value={form.categoryId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, categoryId: e.target?.value ?? '' })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione...</option>
                {(categories ?? []).map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>{cat?.name ?? ''}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
