"use client"

import { useEffect, useRef, useState } from "react"
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
  uploadGlobalProductImage,
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

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const OUTPUT_IMAGE_WIDTH = 1000
const OUTPUT_IMAGE_HEIGHT = 800
const OUTPUT_ASPECT_RATIO = OUTPUT_IMAGE_WIDTH / OUTPUT_IMAGE_HEIGHT

const emptyForm: ProductForm = {
  name: "",
  description: "",
  image_url: "",
  category_id: "",
  is_active: true,
}

function revokeObjectUrl(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png"
  if (mimeType === "image/webp") return "webp"
  return "jpg"
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(new Error("Falha ao carregar imagem para processamento."))
    image.src = src
  })
}

async function createStandardizedImageFile(file: File) {
  const sourceUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(sourceUrl)
    const canvas = document.createElement("canvas")
    canvas.width = OUTPUT_IMAGE_WIDTH
    canvas.height = OUTPUT_IMAGE_HEIGHT

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Nao foi possivel preparar a imagem para upload.")
    }

    const originalWidth = image.naturalWidth
    const originalHeight = image.naturalHeight
    if (!originalWidth || !originalHeight) {
      throw new Error("Nao foi possivel ler as dimensoes da imagem.")
    }

    let sourceX = 0
    let sourceY = 0
    let sourceWidth = originalWidth
    let sourceHeight = originalHeight

    const sourceAspectRatio = originalWidth / originalHeight

    if (sourceAspectRatio > OUTPUT_ASPECT_RATIO) {
      sourceWidth = Math.round(originalHeight * OUTPUT_ASPECT_RATIO)
      sourceX = Math.round((originalWidth - sourceWidth) / 2)
    } else if (sourceAspectRatio < OUTPUT_ASPECT_RATIO) {
      sourceHeight = Math.round(originalWidth / OUTPUT_ASPECT_RATIO)
      sourceY = Math.round(originalHeight - sourceHeight)
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      OUTPUT_IMAGE_WIDTH,
      OUTPUT_IMAGE_HEIGHT
    )

    const outputMimeType = ACCEPTED_IMAGE_TYPES.has(file.type)
      ? file.type
      : "image/jpeg"

    const blob = await new Promise<Blob | null>((resolve) => {
      const quality = outputMimeType === "image/jpeg" ? 0.92 : undefined
      canvas.toBlob(resolve, outputMimeType, quality)
    })

    if (!blob) {
      throw new Error("Nao foi possivel gerar a imagem 1000x800.")
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "") || "produto"
    const extension = extensionFromMimeType(outputMimeType)
    const fileName = `${baseName}-${OUTPUT_IMAGE_WIDTH}x${OUTPUT_IMAGE_HEIGHT}.${extension}`

    return new File([blob], fileName, { type: outputMimeType })
  } finally {
    revokeObjectUrl(sourceUrl)
  }
}

export default function ProdutosGlobaisPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [processedImageFile, setProcessedImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [removeImage, setRemoveImage] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  function updatePreviewUrl(nextUrl: string) {
    setPreviewUrl((prevUrl) => {
      revokeObjectUrl(prevUrl)
      return nextUrl
    })
  }

  function resetImageState(initialPreviewUrl = "") {
    setSelectedImageFile(null)
    setProcessedImageFile(null)
    setRemoveImage(false)
    updatePreviewUrl(initialPreviewUrl)

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function resetForm() {
    setEditingProduct(null)
    setForm(emptyForm)
    setFormError("")
    resetImageState("")
  }

  useEffect(() => {
    return () => {
      revokeObjectUrl(previewUrl)
    }
  }, [previewUrl])

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
    setFormError("")
    resetImageState(product.image_url ?? "")
    setIsOpen(true)
  }

  async function handleImageSelection(file: File | null) {
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setFormError("Formato invalido. Use JPG, PNG ou WEBP.")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFormError("A imagem deve ter no maximo 5MB.")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    setFormError("")
    setRemoveImage(false)

    try {
      const standardizedFile = await createStandardizedImageFile(file)
      setSelectedImageFile(file)
      setProcessedImageFile(standardizedFile)
      updatePreviewUrl(URL.createObjectURL(standardizedFile))
    } catch (error) {
      setSelectedImageFile(null)
      setProcessedImageFile(null)
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel preparar a imagem no formato 1000x800."
      setFormError(message)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function buildProcessedFileForCurrentSelection() {
    if (!selectedImageFile) {
      throw new Error("Selecione uma imagem para upload.")
    }

    const newProcessedFile = await createStandardizedImageFile(selectedImageFile)

    setProcessedImageFile(newProcessedFile)
    updatePreviewUrl(URL.createObjectURL(newProcessedFile))
    setFormError("")

    return newProcessedFile
  }

  function handleRemoveImage() {
    setFormError("")
    setRemoveImage(true)
    setSelectedImageFile(null)
    setProcessedImageFile(null)
    updatePreviewUrl("")

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    setFormError("")

    try {
      let imageUrl = form.image_url.trim()

      if (selectedImageFile) {
        const finalImageFile =
          processedImageFile ?? (await buildProcessedFileForCurrentSelection())
        imageUrl = await uploadGlobalProductImage(finalImageFile)
      } else if (removeImage) {
        imageUrl = ""
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        image_url: imageUrl,
        category_id: form.category_id || undefined,
        is_active: form.is_active,
      }

      if (editingProduct) {
        await updateGlobalProduct({ id: editingProduct.id, ...payload })
      } else {
        await createGlobalProduct(payload)
      }

      setIsOpen(false)
      resetForm()
      await loadData()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o produto global."
      setFormError(message)
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
            Cadastre o catalogo mestre de produtos disponivel para vincular nas lojas.
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

            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                    placeholder="Ex.: Agua Mineral 500ml"
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
                  <div className="flex items-center justify-between">
                    <Label>Imagem do Produto</Label>
                    {(previewUrl || form.image_url) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                      >
                        Remover imagem
                      </Button>
                    )}
                  </div>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleImageSelection(e.target.files?.[0] || null)}
                  />

                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: JPG, PNG e WEBP. Tamanho maximo: 5MB.
                    A imagem e convertida automaticamente para 1000x800 (5:4),
                    com enquadramento bottom-center. Resultado final 1:1 nao e aceito.
                  </p>

                  {removeImage && (
                    <p className="text-xs text-destructive">
                      A imagem sera removida quando voce salvar.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Pre-visualizacao (1000x800 - 5:4)</Label>
                  <div className="h-32 w-40 overflow-hidden rounded-md border bg-muted">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Preview da imagem do produto"
                        className="h-full w-full object-cover object-bottom"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descricao</Label>
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

                {formError && (
                  <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                )}

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
                  <TableHead className="text-right">Acoes</TableHead>
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
                          className="h-10 w-10 rounded object-cover object-bottom"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.categories?.name ?? "-"}</TableCell>
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
