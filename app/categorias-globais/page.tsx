"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import {
  createGlobalCategory,
  deleteGlobalCategory,
  fetchGlobalCategoriesAdmin,
  toggleGlobalCategoryStatus,
  updateGlobalCategory,
} from "@/src/services/categoriesGlobal.service"

type Category = {
  id: string
  name: string
  slug: string
  is_active: boolean
}

export default function CategoriasGlobaisPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadCategories() {
    const data = await fetchGlobalCategoriesAdmin()
    setCategories(data ?? [])
  }

  useEffect(() => {
    loadCategories()
  }, [])

  function resetForm() {
    setEditingCategory(null)
    setName("")
    setIsActive(true)
  }

  function openCreate() {
    resetForm()
    setIsOpen(true)
  }

  function openEdit(category: Category) {
    setEditingCategory(category)
    setName(category.name)
    setIsActive(category.is_active)
    setIsOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    try {
      if (editingCategory) {
        await updateGlobalCategory({
          id: editingCategory.id,
          name: name.trim(),
          is_active: isActive,
        })
      } else {
        await createGlobalCategory({
          name: name.trim(),
          is_active: isActive,
        })
      }

      setIsOpen(false)
      resetForm()
      await loadCategories()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(category: Category) {
    await toggleGlobalCategoryStatus(category.id, !category.is_active)
    await loadCategories()
  }

  async function handleDelete(category: Category) {
    const confirmed = confirm(
      `Tem certeza que deseja excluir a categoria global "${category.name}"?`
    )
    if (!confirmed) return

    await deleteGlobalCategory(category.id)
    await loadCategories()
  }

  return (
    <AdminLayout title="Categorias Globais">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Gerencie o cadastro mestre de categorias utilizado nas lojas.
          </p>

          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Nova Categoria Global
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoria Global" : "Nova Categoria Global"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Bebidas"
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm">Ativa</span>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!name.trim() || saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Categorias Globais
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({categories.length} categorias)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Ativa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                    <TableCell>
                      <Switch
                        checked={category.is_active}
                        onCheckedChange={() => handleToggle(category)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {categories.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma categoria global cadastrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
