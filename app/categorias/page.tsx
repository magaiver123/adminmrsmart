"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  addStoreCategoryApi,
  deleteCategoryApi,
  fetchCategories,
  fetchGlobalCategories,
  toggleCategoryStatusApi,
  updateCategoryApi,
} from "@/src/services/categories.service";
import { useStore } from "@/components/admin/store-context";

/* =====================
   TIPAGEM
===================== */
type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export default function CategoriasPage() {
  const { store } = useStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [globalCategories, setGlobalCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedGlobalCategory, setSelectedGlobalCategory] =
    useState<Category | null>(null);

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadCategories() {
    if (!store) return;

    setLoading(true);
    const data = await fetchCategories(store.id);
    setCategories(data);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, [store]);

  if (!store) {
    return (
      <AdminLayout title="Categorias">
        <p className="text-muted-foreground">
          Selecione uma loja para gerenciar categorias.
        </p>
      </AdminLayout>
    );
  }

  async function openSelector() {
    if (!store) return;

    const data = await fetchGlobalCategories();
    const existingIds = categories.map((category) => category.id);
    const filtered = (data || []).filter(
      (category: Category) =>
        category.is_active && !existingIds.includes(category.id)
    );

    setGlobalCategories(filtered);
    setIsSelectOpen(true);
  }

  function handleAddGlobalCategory(category: Category) {
    setEditingCategory(null);
    setSelectedGlobalCategory(category);
    setName(category.name);
    setIsActive(true);
    setIsSelectOpen(false);
    setIsModalOpen(true);
  }

  function openEditModal(category: Category) {
    setSelectedGlobalCategory(null);
    setEditingCategory(category);
    setName(category.name);
    setIsActive(category.is_active);
    setIsModalOpen(true);
  }

  async function handleSave() {
    if (!store) return;
    if (editingCategory && !name.trim()) return;
    const globalCategory = selectedGlobalCategory;
    if (!editingCategory && !globalCategory) return;

    setSaving(true);

    try {
      if (editingCategory) {
        await updateCategoryApi({
          id: editingCategory.id,
          name,
          is_active: isActive,
          store_id: store.id,
        });
      } else {
        if (!globalCategory) return;
        await addStoreCategoryApi({
          category_id: globalCategory.id,
          is_active: isActive,
          store_id: store.id,
        });
      }

      setIsModalOpen(false);
      setSelectedGlobalCategory(null);
      setName("");
      setIsActive(true);
      await loadCategories();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(category: Category) {
    if (!store) return;

    const newStatus = !category.is_active;

    setCategories((prev) =>
      prev.map((c) =>
        c.id === category.id ? { ...c, is_active: newStatus } : c
      )
    );

    try {
      await toggleCategoryStatusApi(category.id, newStatus, store.id);
    } catch {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, is_active: category.is_active } : c
        )
      );
    }
  }

  async function handleDelete(category: Category) {
    if (!store) return;

    const confirmed = confirm(
      `Tem certeza que deseja excluir a categoria "${category.name}"?`
    );

    if (!confirmed) return;

    await deleteCategoryApi(category.id, store.id);
    await loadCategories();
  }

  return (
    <AdminLayout title="Categorias">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Gerencie as categorias dos produtos do sistema de autoatendimento.
          </p>

          <Button className="gap-2" onClick={openSelector}>
            <Plus className="h-4 w-4" />
            Adicionar Categoria
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Lista de Categorias
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({categories.length} categorias)
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Ativa</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
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
                          onClick={() => openEditModal(category)}
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
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isSelectOpen} onOpenChange={setIsSelectOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Selecionar Categoria</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {globalCategories.map((category) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-muted transition"
                  onClick={() => handleAddGlobalCategory(category)}
                >
                  <span className="font-semibold">{category.name}</span>
                </div>
              ))}

              {globalCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todas as categorias já estão cadastradas nesta loja.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);

            if (!open) {
              setEditingCategory(null);
              setSelectedGlobalCategory(null);
              setName("");
              setIsActive(true);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Adicionar Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Gerencie somente o status da categoria vinculada à loja."
                  : "Confirme os dados da categoria selecionada."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled
              />
              <div className="flex justify-between items-center border p-4 rounded">
                <span>Ativa</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
