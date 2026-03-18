"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/components/admin/store-context"
import { ImageIcon } from "lucide-react"
import {
  deleteMenuBanner,
  fetchMenuBanner,
  uploadMenuBanner,
} from "@/src/services/menuBanner.service"

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

function revokeObjectUrl(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}

export default function MenuBannerPage() {
  const { store } = useStore()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [currentBannerUrl, setCurrentBannerUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const previewToRender = useMemo(
    () => previewUrl || currentBannerUrl,
    [previewUrl, currentBannerUrl],
  )

  function clearTransientState() {
    setMessage("")
    setError("")
  }

  function resetFileSelection() {
    setSelectedFile(null)
    setPreviewUrl((previousUrl) => {
      revokeObjectUrl(previousUrl)
      return ""
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    return () => {
      revokeObjectUrl(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    async function loadBanner() {
      if (!store?.id) {
        setCurrentBannerUrl("")
        resetFileSelection()
        clearTransientState()
        return
      }

      setLoading(true)
      clearTransientState()

      try {
        const imageUrl = await fetchMenuBanner(store.id)
        setCurrentBannerUrl(imageUrl)
      } catch (loadError) {
        setCurrentBannerUrl("")
        setError(loadError instanceof Error ? loadError.message : "Erro ao carregar banner.")
      } finally {
        setLoading(false)
      }
    }

    loadBanner()
  }, [store?.id])

  function handleFileSelection(file: File | null) {
    if (!file) return

    clearTransientState()

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setError("Formato invalido. Use JPG, PNG ou WEBP.")
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError("A imagem deve ter no maximo 5MB.")
      return
    }

    setSelectedFile(file)
    setPreviewUrl((previousUrl) => {
      revokeObjectUrl(previousUrl)
      return URL.createObjectURL(file)
    })
  }

  async function handleSave() {
    if (!store?.id || !selectedFile || saving) return

    setSaving(true)
    clearTransientState()

    try {
      const imageUrl = await uploadMenuBanner(store.id, selectedFile)
      setCurrentBannerUrl(imageUrl)
      resetFileSelection()
      setMessage("Banner salvo com sucesso.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao salvar banner.")
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!store?.id || !currentBannerUrl || removing) return

    setRemoving(true)
    clearTransientState()

    try {
      await deleteMenuBanner(store.id)
      setCurrentBannerUrl("")
      resetFileSelection()
      setMessage("Banner removido com sucesso.")
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Erro ao remover banner.")
    } finally {
      setRemoving(false)
    }
  }

  if (!store) {
    return (
      <AdminLayout title="Banner do Menu">
        <p className="text-muted-foreground">
          Selecione uma loja para gerenciar o banner do menu.
        </p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Banner do Menu">
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Gerencie o banner exibido no topo do menu do totem para a loja selecionada.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Banner do topo do menu</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pre-visualizacao (proporcao 5:1)</Label>

              <div className="relative w-full overflow-hidden rounded-xl border bg-muted aspect-[5/1]">
                {loading ? (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    Carregando banner...
                  </div>
                ) : previewToRender ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewToRender}
                    alt="Preview do banner do menu"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    Nenhum banner cadastrado
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Canva recomendado: 2000 x 400 px (PNG). Area exibida no totem: 800 x 160 px.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Nova imagem</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => handleFileSelection(event.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG e WEBP. Tamanho maximo: 5MB.
              </p>
            </div>

            {error && (
              <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSave} disabled={!selectedFile || saving}>
                {saving ? "Salvando..." : "Salvar banner"}
              </Button>

              <Button
                variant="outline"
                onClick={handleRemove}
                disabled={!currentBannerUrl || removing}
              >
                {removing ? "Removendo..." : "Remover banner"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

