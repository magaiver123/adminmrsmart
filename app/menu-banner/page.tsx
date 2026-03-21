"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { useStore } from "@/components/admin/store-context"
import {
  createMenuBannerSlide,
  deleteMenuBannerSlide,
  fetchMenuBannerSlides,
  reorderMenuBannerSlides,
  toggleMenuBannerSlide,
} from "@/src/services/menuBanner.service"

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

import { CSS } from "@dnd-kit/utilities"

type MenuBannerSlide = {
  id: string
  image_url: string
  order: number
  duration: number
  active: boolean
}

function SortableRow({
  slide,
  children,
}: {
  slide: MenuBannerSlide
  children: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: slide.id,
    disabled: !slide.active,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={!slide.active ? "opacity-50" : ""}
    >
      <TableCell className="w-6">
        {slide.active && (
          <span {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </span>
        )}
      </TableCell>
      {children}
    </TableRow>
  )
}

export default function MenuBannerPage() {
  const { store } = useStore()
  const [slides, setSlides] = useState<MenuBannerSlide[]>([])
  const [open, setOpen] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState(5)
  const [active, setActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  async function loadSlides() {
    if (!store?.id) {
      setSlides([])
      return
    }

    const data = await fetchMenuBannerSlides(store.id)
    setSlides(data || [])
  }

  useEffect(() => {
    loadSlides()
  }, [store?.id])

  async function handleDragEnd(event: any) {
    if (!store?.id) return

    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeSlides = slides.filter((s) => s.active)
    const oldIndex = activeSlides.findIndex((s) => s.id === active.id)
    const newIndex = activeSlides.findIndex((s) => s.id === over.id)

    const reordered = arrayMove(activeSlides, oldIndex, newIndex)

    await reorderMenuBannerSlides(
      store.id,
      reordered.map((slide) => slide.id)
    )

    await loadSlides()
  }

  async function handleCreate() {
    if (!file || isSaving || !store?.id) return

    setIsSaving(true)

    try {
      await createMenuBannerSlide({
        storeId: store.id,
        file,
        duration,
        active,
      })

      setOpen(false)
      setFile(null)
      setDuration(5)
      setActive(true)

      await loadSlides()
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleActive(slide: MenuBannerSlide) {
    if (!store?.id) return

    await toggleMenuBannerSlide(store.id, slide.id, !slide.active)
    await loadSlides()
  }

  async function handleDelete(id: string) {
    if (!store?.id) return

    await deleteMenuBannerSlide(store.id, id)
    await loadSlides()
  }

  const activeIds = slides.filter((s) => s.active).map((s) => s.id)

  if (!store) {
    return (
      <AdminLayout title="Banner do Menu">
        <p className="text-muted-foreground">
          Selecione uma loja para gerenciar os banners do menu.
        </p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Banner do Menu">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Gerencie os slides do banner do menu (rotacao por ordem e duracao).
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Banner
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Banner do Menu</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Label>Imagem</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                <p className="text-xs text-muted-foreground">
                  Canva recomendado: 2000 x 400 px (5:1). Formatos: JPG, PNG, WEBP.
                </p>

                <Label>Duracao (segundos)</Label>
                <Input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, +e.target.value || 1))}
                />

                <div className="flex items-center gap-2">
                  <Switch checked={active} onCheckedChange={setActive} />
                  <span>Ativo</span>
                </div>

                <Button
                  onClick={handleCreate}
                  className="w-full"
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar Banner"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Banners do Menu</CardTitle>
          </CardHeader>

          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeIds}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead />
                      <TableHead>Ordem</TableHead>
                      <TableHead>Preview</TableHead>
                      <TableHead>Duracao</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {slides.map((slide) => (
                      <SortableRow key={slide.id} slide={slide}>
                        <TableCell>{slide.active ? slide.order : "-"}</TableCell>

                        <TableCell>
                          <div className="relative h-12 w-28 overflow-hidden rounded-md border">
                            <Image
                              src={slide.image_url}
                              alt="Preview banner menu"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </TableCell>

                        <TableCell>{slide.duration}s</TableCell>

                        <TableCell>
                          <Switch
                            checked={slide.active}
                            onCheckedChange={() => toggleActive(slide)}
                          />
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(slide.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </SortableRow>
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
