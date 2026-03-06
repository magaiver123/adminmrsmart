"use client";

import { useEffect, useState, useTransition } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

import {
  createStoreApi,
  deleteStoreApi,
  fetchStoresAdmin,
  toggleStoreStatusApi,
  updateStoreApi,
} from "@/src/services/stores.service";

interface Loja {
  id: string;
  name: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  status: boolean;
}

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const emptyForm = {
  name: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
};

export default function LojasPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLoja, setSelectedLoja] = useState<Loja | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function loadStores() {
    const data = await fetchStoresAdmin();
    setLojas(data);
  }

  useEffect(() => {
    loadStores();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setSelectedLoja(null);
    setErrorMessage("");
  }

  const getFullAddress = (loja: Loja) =>
    `${loja.rua}, ${loja.numero} - ${loja.bairro}, ${loja.cidade}/${loja.estado} - CEP: ${loja.cep}`;

  const isFormValid =
    form.name &&
    form.cep &&
    form.rua &&
    form.numero &&
    form.bairro &&
    form.cidade &&
    form.estado;

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  }

  async function fetchCep(cep: string) {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) return;

      setForm((prev) => ({
        ...prev,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }));
    } catch {}
  }

  function handleCreate() {
    setErrorMessage("");
    startTransition(async () => {
      try {
        await createStoreApi(form);
        resetForm();
        setIsCreateOpen(false);
        await loadStores();
      } catch (err: any) {
        setErrorMessage(err.message);
      }
    });
  }

  function handleEdit() {
    if (!selectedLoja) return;

    startTransition(async () => {
      await updateStoreApi({ ...form, id: selectedLoja.id });
      resetForm();
      setIsEditOpen(false);
      await loadStores();
    });
  }

  function handleDelete() {
    if (!selectedLoja) return;

    startTransition(async () => {
      await deleteStoreApi(selectedLoja.id);
      resetForm();
      setIsDeleteOpen(false);
      await loadStores();
    });
  }

  function toggleStatus(loja: Loja) {
    startTransition(async () => {
      await toggleStoreStatusApi(loja.id, loja.status);
      await loadStores();
    });
  }

  function openEdit(loja: Loja) {
    setSelectedLoja(loja);
    setForm({
      name: loja.name ?? "",
      cep: loja.cep ?? "",
      rua: loja.rua ?? "",
      numero: loja.numero ?? "",
      bairro: loja.bairro ?? "",
      cidade: loja.cidade ?? "",
      estado: loja.estado ?? "",
    });
    setIsEditOpen(true);
  }

  function openDelete(loja: Loja) {
    setSelectedLoja(loja);
    setIsDeleteOpen(true);
  }

  return (
    <AdminLayout title="Lojas">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Loja
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Loja</DialogTitle>
                <DialogDescription>
                  Preencha os dados da loja.
                </DialogDescription>
              </DialogHeader>

              <FormFields
                form={form}
                setForm={setForm}
                formatCep={formatCep}
                fetchCep={fetchCep}
              />

              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!isFormValid || isPending}
                >
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* TABELA (mantida igual) */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Lojas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lojas.map((loja) => (
                  <TableRow key={loja.id}>
                    <TableCell className="font-medium">{loja.name}</TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {getFullAddress(loja)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={loja.status}
                        onCheckedChange={() => toggleStatus(loja)}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(loja)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDelete(loja)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* MODAL EDITAR */}
        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Loja</DialogTitle>
            </DialogHeader>

            <FormFields
              form={form}
              setForm={setForm}
              formatCep={formatCep}
              fetchCep={fetchCep}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={isPending}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* CONFIRMAÇÃO DELETE */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir loja</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir{" "}
                <strong>{selectedLoja?.name}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

/* 🔹 COMPONENTE DE CAMPOS REUTILIZADO (mantendo lógica existente) */
function FormFields({ form, setForm, formatCep, fetchCep }: any) {
  const UFS = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  return (
    <div className="grid gap-4 py-4">
      <Label>Nome</Label>
      <Input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <Label>CEP</Label>
      <Input
        value={form.cep}
        onChange={(e) => {
          const formatted = formatCep(e.target.value);
          setForm({ ...form, cep: formatted });
          if (formatted.length === 9) fetchCep(formatted);
        }}
      />

      <Label>Rua</Label>
      <Input
        value={form.rua}
        onChange={(e) => setForm({ ...form, rua: e.target.value })}
      />

      <Label>Número</Label>
      <Input
        value={form.numero}
        onChange={(e) =>
          setForm({
            ...form,
            numero: e.target.value.replace(/\D/g, ""),
          })
        }
      />

      <Label>Bairro</Label>
      <Input
        value={form.bairro}
        onChange={(e) => setForm({ ...form, bairro: e.target.value })}
      />

      <Label>Cidade</Label>
      <Input
        value={form.cidade}
        onChange={(e) => setForm({ ...form, cidade: e.target.value })}
      />

      <Label>Estado</Label>
      <select
        className="border rounded-md h-9 px-3"
        value={form.estado}
        onChange={(e) => setForm({ ...form, estado: e.target.value })}
      >
        <option value="">Selecione</option>
        {UFS.map((uf) => (
          <option key={uf} value={uf}>
            {uf}
          </option>
        ))}
      </select>
    </div>
  );
}
