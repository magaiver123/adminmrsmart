"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react"
import {
  createGlobalProduct,
  deleteGlobalProduct,
  fetchGlobalProductsAdmin,
  toggleGlobalProductStatus,
  updateGlobalProduct,
} from "@/src/services/productsGlobal.service"
import { fetchGlobalCategoriesAdmin } from "@/src/services/categoriesGlobal.service"

type Product = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  is_active: boolean
  category_id: string | null
  categories: {
    name: string
  } | null
}

type Category = {
  id: string
  name: string
}

type ProductForm = {
  name: string
  description: string
  image_url: string
  category_id: string
  is_active: boolean
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  image_url: "",
  category_id: "",
  is_active: true,
}

export default function ProdutosGlobaisPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    const [productsData, categoriesData] = await Promise.all([
      fetchGlobalProductsAdmin(),
      fetchGlobalCategoriesAdmin(),
    ])

    setProducts(productsData ?? [])
    setCategories(
      (categoriesData ?? []).filter((category: any) => category.is_active)
    )
  }

  useEffect(() => {
    loadData()
  }, [])

  function resetForm() {
    setEditingProduct(null)
    setForm(emptyForm)
  }

  function openCreate() {
    resetForm()
    setIsOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      image_url: product.image_url ?? "",
      category_id: product.category_id ?? "",
      is_active: product.is_active,
    })
    setIsOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      category_id: form.category_id || undefined,
      is_active: form.is_active,
    }

    try {
      if (editingProduct) {
        await updateGlobalProduct({ id: editingProduct.id, ...payload })
      } else {
        await createGlobalProduct(payload)
      }

      setIsOpen(false)
      resetForm()
      await loadData()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(product: Product) {
    await toggleGlobalProductStatus(product.id, !product.is_active)
    await loadData()
  }

  async function handleDelete(product: Product) {
    const confirmed = confirm(
      `Tem certeza que deseja excluir o produto global "${product.name}"?`
    )
    if (!confirmed) return

    await deleteGlobalProduct(product.id)
    await loadData()
  }

  return (
    <AdminLayout title="Produtos Globais">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Cadastre o catálogo mestre de produtos disponível para vincular nas lojas.
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
                Novo Produto Global
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Produto Global" : "Novo Produto Global"}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex.: Água Mineral 500ml"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={form.category_id || "none"}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        category_id: value === "none" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input
                    value={form.image_url}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, image_url: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <span className="text-sm">Ativo</span>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(value) =>
                      setForm((prev) => ({ ...prev, is_active: value }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!form.name.trim() || saving}>
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
              Produtos Globais
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({products.length} produtos)
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.categories?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active}
                        onCheckedChange={() => handleToggle(product)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {products.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      Nenhum produto global cadastrado.
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
