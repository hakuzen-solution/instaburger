"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FolderOpen, Plus, Pencil, Loader2, ToggleLeft, ToggleRight, GripVertical } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  active: boolean
  displayOrder: number
}

export function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', displayOrder: '0' })
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) setCategories(await res.json() ?? [])
    } catch (err: any) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', displayOrder: String((categories?.length ?? 0)) })
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat?.name ?? '', displayOrder: String(cat?.displayOrder ?? 0) })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name?.trim?.()) { toast.error("Nome é obrigatório"); return }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        displayOrder: Number(form.displayOrder || 0),
      }

      const res = editing
        ? await fetch(`/api/categories/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })

      if (res.ok) {
        toast.success(editing ? "Categoria atualizada!" : "Categoria criada!")
        setDialogOpen(false)
        fetchCategories()
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err?.error ?? "Erro ao salvar")
      }
    } catch {
      toast.error("Erro ao salvar categoria")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (cat: Category) => {
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !cat.active }),
      })
      if (res.ok) {
        toast.success(cat.active ? "Categoria desativada" : "Categoria ativada")
        fetchCategories()
      }
    } catch {
      toast.error("Erro ao atualizar")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando categorias...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            Categorias
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie as categorias do cardápio</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>

      {(categories?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Nenhuma categoria cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {(categories ?? []).map((cat: Category) => (
            <Card key={cat.id} className={!cat.active ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{cat?.name ?? ''}</span>
                  <Badge variant="secondary" className="text-xs font-mono">Ordem: {cat?.displayOrder ?? 0}</Badge>
                  {!cat.active && <Badge variant="secondary" className="text-xs">Inativa</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(cat)}>
                    {cat.active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
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
            <DialogTitle>{editing ? 'Editar Categoria' : 'Adicionar Categoria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target?.value ?? '' })}
                placeholder="Nome da categoria"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem de exibição</Label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, displayOrder: e.target?.value ?? '0' })}
                placeholder="0"
              />
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
