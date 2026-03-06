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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, ImageIcon } from "lucide-react";
import { useStore } from "@/components/admin/store-context";

import {
  fetchStoreProducts,
  addStoreProduct,
  removeStoreProduct,
  fetchGlobalProducts,
  updateStoreProduct,
} from "@/src/services/storeProducts.service";

function formatCurrency(value: string) {
  const numeric = value.replace(/\D/g, "");
  const number = Number(numeric) / 100;

  if (isNaN(number)) return "";

  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProdutosPage() {
  const { store } = useStore();

  const [products, setProducts] = useState<any[]>([]);
  const [globalProducts, setGlobalProducts] = useState<any[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadProducts() {
    if (!store?.id) return;
    const data = await fetchStoreProducts(store.id);
    setProducts(data || []);
  }

  useEffect(() => {
    loadProducts();
  }, [store?.id]);

  async function openSelector() {
    const data = await fetchGlobalProducts();

    const existingIds = products.map((p) => p.products.id);
    const filtered = (data || []).filter(
      (p: any) => !existingIds.includes(p.id)
    );

    setGlobalProducts(filtered);
    setIsSelectOpen(true);
  }

  function handleAdd(product: any) {
    setSelectedProduct(product);
    setPrice("");
    setIsActive(true);
    setIsSelectOpen(false);
    setIsEditOpen(true);
  }

  async function handleSave() {
    if (!store?.id || !selectedProduct) return;

    const parsedPrice = Number(price.replace(/\./g, "").replace(",", "."));

    if (selectedProduct.storeProductId) {
      await updateStoreProduct(selectedProduct.storeProductId, store.id, {
        price: parsedPrice,
        is_active: isActive,
      });
    } else {
      await addStoreProduct(store.id, selectedProduct.id, parsedPrice);
    }

    setIsEditOpen(false);
    setPrice("");
    setSelectedProduct(null);
    await loadProducts();
  }

  async function handleToggle(p: any) {
    if (!store?.id) return;

    await updateStoreProduct(p.id, store.id, {
      is_active: !p.is_active,
    });
    await loadProducts();
  }

  if (!store) {
    return (
      <AdminLayout title="Produtos">
        <p>Selecione uma loja.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Produtos">
      <div className="space-y-6">
        <div className="flex justify-between">
          <CardTitle>Produtos da loja: {store.name}</CardTitle>

          <Button onClick={openSelector} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Produto
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Produtos</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.products.image_url ? (
                        <img
                          src={p.products.image_url}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>

                    <TableCell>{p.products.name}</TableCell>

                    <TableCell>{p.products.categories?.name}</TableCell>

                    <TableCell>
                      R$ {Number(p.price).toFixed(2).replace(".", ",")}
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={() => handleToggle(p)}
                      />
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedProduct({
                            ...p.products,
                            storeProductId: p.id,
                          });
                          setPrice(
                            formatCurrency(
                              String(p.price.toFixed(2))
                                .replace(",", "")
                                .replace(".", "")
                            )
                          );
                          setIsActive(p.is_active);
                          setIsEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          await removeStoreProduct(p.id, store.id);
                          await loadProducts();
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {products.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      Nenhum produto cadastrado para esta loja.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* MODAL GLOBAL */}
        <Dialog open={isSelectOpen} onOpenChange={setIsSelectOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Selecionar Produto</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {globalProducts.map((p: any) => (
                <div
                  key={p.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-muted transition"
                  onClick={() => handleAdd(p)}
                >
                  <div className="flex gap-4">
                    {/* IMAGEM */}
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        className="h-16 w-16 object-cover rounded"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* INFORMAÇÕES */}
                    <div className="flex flex-col">
                      <span className="font-semibold">{p.name}</span>

                      {p.categories?.name && (
                        <span className="text-sm text-muted-foreground">
                          {p.categories.name}
                        </span>
                      )}

                      {p.description && (
                        <span className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {p.description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {globalProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todos os produtos já estão cadastrados nesta loja.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* MODAL EDITAR / ADICIONAR */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedProduct?.storeProductId
                  ? "Editar Produto"
                  : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                inputMode="numeric"
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(formatCurrency(e.target.value))}
              />

              <div className="flex items-center justify-between">
                <span>Produto ativo</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <Button onClick={handleSave} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
