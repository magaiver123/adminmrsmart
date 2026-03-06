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
  createKioskSlide,
  deleteKioskSlide,
  fetchKioskSlides,
  reorderKioskSlides,
  toggleKioskSlide,
} from "@/src/services/kioskSlides.service"

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

type Slide = {
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
  slide: Slide
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

export default function KioskAdminPage() {
  const { store } = useStore()
  const [slides, setSlides] = useState<Slide[]>([])
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

    const data = await fetchKioskSlides(store.id)
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

    await reorderKioskSlides(
      store.id,
      reordered.map((slide) => slide.id)
    )

    await loadSlides()
  }

  async function handleCreate() {
    if (!file || isSaving || !store?.id) return

    setIsSaving(true)

    try {
      await createKioskSlide({
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

  async function toggleActive(slide: Slide) {
    if (!store?.id) return

    await toggleKioskSlide(store.id, slide.id, !slide.active)
    await loadSlides()
  }

  async function handleDelete(id: string) {
    if (!store?.id) return

    await deleteKioskSlide(store.id, id)
    await loadSlides()
  }

  const activeIds = slides.filter((s) => s.active).map((s) => s.id)

  if (!store) {
    return (
      <AdminLayout title="Tela Inicial (Kiosk)">
        <p className="text-muted-foreground">
          Selecione uma loja para gerenciar os slides.
        </p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Tela Inicial (Kiosk)">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Gerencie os slides da tela inicial do autoatendimento.
          </p>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Slide
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Slide</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Label>Imagem</Label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                <Label>Duração (segundos)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(+e.target.value)}
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
                  {isSaving ? "Salvando..." : "Salvar Slide"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Slides</CardTitle>
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
                      <TableHead>Duração</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {slides.map((slide) => (
                      <SortableRow key={slide.id} slide={slide}>
                        <TableCell>{slide.active ? slide.order : "-"}</TableCell>

                        <TableCell>
                          <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                            <Image
                              src={slide.image_url}
                              alt="Preview"
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
