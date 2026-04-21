"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";

interface Flower {
  id: string;
  name: string;
  bouquetSize: number;
  pricePerBouquet: string;
  isFoliage: boolean;
  isActive: boolean;
}

export default function FlowersPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [saving, setSaving] = useState(false);

  const empty = { name: "", bouquetSize: "", pricePerBouquet: "", isFoliage: false };
  const [form, setForm] = useState<any>(empty);

  const fetchFlowers = useCallback(async () => {
    const res = await fetch("/api/flowers");
    if (res.ok) setFlowers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchFlowers(); }, [fetchFlowers]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(f: Flower) {
    setEditing(f);
    setForm({
      name: f.name,
      bouquetSize: String(f.bouquetSize),
      pricePerBouquet: String(f.pricePerBouquet),
      isFoliage: f.isFoliage,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      bouquetSize: Number(form.bouquetSize),
      pricePerBouquet: Number(form.pricePerBouquet),
      isFoliage: form.isFoliage,
    };

    const url = editing ? `/api/flowers/${editing.id}` : "/api/flowers";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      toast.success(editing ? "Flor actualizada" : "Flor agregada al catálogo");
      setOpen(false);
      fetchFlowers();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Error al guardar");
    }
  }

  async function handleDeactivate(id: string) {
    const res = await fetch(`/api/flowers/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Flor eliminada del catálogo");
      fetchFlowers();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catálogo de Flores</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tipos de flores y precios por ramo</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nueva flor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Nombre", "Tallos/ramo", "Precio/ramo", "Tipo", "Estado", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Cargando…</td></tr>
              ) : flowers.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Sin flores en catálogo</td></tr>
              ) : (
                flowers.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                    <td className="px-4 py-3 text-gray-600">{f.bouquetSize}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(f.pricePerBouquet)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={f.isFoliage ? "default" : "fresh"}>
                        {f.isFoliage ? "Follaje" : "Flor"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={f.isActive ? "fresh" : "expired"}>
                        {f.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {f.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDeactivate(f.id)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar Flor" : "Nueva Flor"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" id="fname" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Tallos por ramo" id="bsize" type="number" min={1} required value={form.bouquetSize} onChange={(e) => setForm({ ...form, bouquetSize: e.target.value })} />
          <Input label="Precio por ramo (MXN)" id="price" type="number" min={0} step="0.01" required value={form.pricePerBouquet} onChange={(e) => setForm({ ...form, pricePerBouquet: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isFoliage} onChange={(e) => setForm({ ...form, isFoliage: e.target.checked })} className="w-4 h-4 accent-primary" />
            Es follaje (no flor principal)
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editing ? "Guardar cambios" : "Agregar"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
