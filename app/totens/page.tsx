"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";

import {
  createTotemApi,
  deleteTotemApi,
  fetchTotems,
  updateTotemApi,
  updateTotemRuntimeApi,
} from "@/src/services/totems.service";
import { useStore } from "@/components/admin/store-context";

type Totem = {
  id: string;
  name: string;
  activation_code: string;
  status: "active" | "inactive";
  maintenance_mode: boolean;
  store_id: string;
  store_name: string;
};

const emptyForm = {
  name: "",
  activationCode: "",
};

function TotemForm({
  form,
  setForm,
}: {
  form: typeof emptyForm;
  setForm: any;
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Nome do Totem</Label>
        <Input
          value={form.name}
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Codigo de Ativacao</Label>
        <Input
          value={form.activationCode}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              activationCode: e.target.value,
            }))
          }
        />
      </div>
    </div>
  );
}

export default function TotensPage() {
  const { store } = useStore();
  const [totens, setTotens] = useState<Totem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runtimeUpdatingId, setRuntimeUpdatingId] = useState<string | null>(
    null
  );
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedTotem, setSelectedTotem] = useState<Totem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadData() {
    if (!store?.id) {
      setTotens([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const totemsData = await fetchTotems(store.id);
      setTotens(
        (totemsData as any[]).map((totem) => ({
          ...totem,
          maintenance_mode: Boolean(totem.maintenance_mode),
        }))
      );
      setRuntimeError(null);
    } catch (error: any) {
      setRuntimeError(error?.message || "Erro ao carregar totems.");
      setTotens([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  if (!store) {
    return (
      <AdminLayout title="Totens">
        <p className="text-muted-foreground">
          Selecione uma loja para gerenciar os totens.
        </p>
      </AdminLayout>
    );
  }

  const handleCreate = async () => {
    if (!store?.id) return;

    setFormError(null);

    const result = await createTotemApi({
      name: form.name,
      store_id: store.id,
      activation_code: form.activationCode,
    });

    if (result?.error) {
      setFormError(result.error);
      return;
    }

    setForm(emptyForm);
    setIsCreateOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!selectedTotem || !store?.id) return;
    await deleteTotemApi(selectedTotem.id, store.id);
    setSelectedTotem(null);
    setIsDeleteOpen(false);
    loadData();
  };

  const openDelete = (totem: Totem) => {
    setSelectedTotem(totem);
    setIsDeleteOpen(true);
  };

  const openEdit = (totem: Totem) => {
    setSelectedTotem(totem);
    setForm({
      name: totem.name,
      activationCode: totem.activation_code,
    });
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedTotem || !store?.id) return;

    setFormError(null);

    const result = await updateTotemApi({
      id: selectedTotem.id,
      name: form.name,
      store_id: store.id,
    });

    if (result?.error) {
      setFormError(result.error);
      return;
    }

    setIsEditOpen(false);
    setSelectedTotem(null);
    setForm(emptyForm);
    loadData();
  };

  const isRuntimeUpdating = (totemId: string) => runtimeUpdatingId === totemId;

  const toggleTotemStatus = async (totem: Totem) => {
    if (!store?.id) return;

    setRuntimeError(null);
    setRuntimeUpdatingId(totem.id);

    try {
      const nextStatus = totem.status === "active" ? "inactive" : "active";
      const result = await updateTotemRuntimeApi({
        id: totem.id,
        store_id: store.id,
        status: nextStatus,
      });

      if (result?.error) {
        setRuntimeError(result.error);
        return;
      }

      await loadData();
    } finally {
      setRuntimeUpdatingId(null);
    }
  };

  const toggleMaintenanceMode = async (totem: Totem) => {
    if (!store?.id) return;

    setRuntimeError(null);
    setRuntimeUpdatingId(totem.id);

    try {
      const result = await updateTotemRuntimeApi({
        id: totem.id,
        store_id: store.id,
        maintenance_mode: !totem.maintenance_mode,
      });

      if (result?.error) {
        setRuntimeError(result.error);
        return;
      }

      await loadData();
    } finally {
      setRuntimeUpdatingId(null);
    }
  };

  return (
    <AdminLayout title="Totens">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Gerencie os totens de autoatendimento vinculados as lojas.
          </p>

          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                setForm(emptyForm);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Totem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Totem</DialogTitle>
                <DialogDescription>
                  Preencha os dados para cadastrar um novo totem.
                </DialogDescription>
              </DialogHeader>

              <TotemForm form={form} setForm={setForm} />
              {formError && (
                <p className="text-sm font-medium text-red-600">{formError}</p>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!form.name || !form.activationCode || !store?.id}
                >
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Totens ({totens.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Carregando...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Loja Vinculada</TableHead>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Modo Manutencao</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {totens.map((totem) => (
                    <TableRow key={totem.id}>
                      <TableCell>{totem.name}</TableCell>
                      <TableCell>{totem.store_name}</TableCell>
                      <TableCell>{totem.activation_code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={totem.status === "active"}
                            onCheckedChange={() => toggleTotemStatus(totem)}
                            disabled={isRuntimeUpdating(totem.id)}
                          />
                          <span
                            className={`text-sm font-medium ${
                              totem.status === "active"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {totem.status === "active" ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={totem.maintenance_mode}
                            onCheckedChange={() => toggleMaintenanceMode(totem)}
                            disabled={isRuntimeUpdating(totem.id)}
                          />
                          <span
                            className={`text-sm font-medium ${
                              totem.maintenance_mode
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            }`}
                          >
                            {totem.maintenance_mode ? "Em manutencao" : "Normal"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="space-x-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(totem)}
                          disabled={isRuntimeUpdating(totem.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDelete(totem)}
                          disabled={isRuntimeUpdating(totem.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {runtimeError && (
              <p className="mt-4 text-sm font-medium text-red-600">
                {runtimeError}
              </p>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Nome do Totem</DialogTitle>
              <DialogDescription>Apenas o nome pode ser alterado.</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label>Novo Nome</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev: any) => ({ ...prev, name: e.target.value }))
                }
              />

              {formError && (
                <p className="text-sm font-medium text-red-600">{formError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir totem</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o totem{" "}
                <strong>{selectedTotem?.name}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
