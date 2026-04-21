"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, RefreshCw, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { formatDate, formatCurrency } from "@/lib/utils";

const POLL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 30000);

interface Batch {
  id: string;
  flowerId: string;
  flower: { id: string; name: string; bouquetSize: number };
  quantity: number;
  remaining: number;
  supplier: string;
  receivedAt: string;
  expiresAt: string;
  daysLeft: number;
  freshness: "fresh" | "expiring" | "expired";
  notes?: string;
}

interface Flower {
  id: string;
  name: string;
  pricePerBouquet: number;
}

export default function InventoryPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [wasteOpen, setWasteOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    flowerId: "",
    quantity: "",
    supplier: "",
    receivedAt: "",
    notes: "",
  });

  const [wasteForm, setWasteForm] = useState({ quantity: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const [bRes, fRes] = await Promise.all([
      fetch("/api/inventory"),
      fetch("/api/flowers"),
    ]);
    if (bRes.ok) setBatches(await bRes.json());
    if (fRes.ok) setFlowers(await fRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, POLL_MS);
    return () => clearInterval(iv);
  }, [fetchData]);

  async function handleAddStock(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flowerId: form.flowerId,
        quantity: Number(form.quantity),
        supplier: form.supplier,
        receivedAt: form.receivedAt ? new Date(form.receivedAt).toISOString() : undefined,
        notes: form.notes || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Lote registrado correctamente");
      setAddOpen(false);
      setForm({ flowerId: "", quantity: "", supplier: "", receivedAt: "", notes: "" });
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Error al registrar");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Lote eliminado");
      setDeleteConfirm(null);
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Error al eliminar");
    }
  }

  async function handleWaste(e: React.FormEvent) {
    e.preventDefault();
    if (!wasteOpen) return;
    setSaving(true);
    const res = await fetch("/api/inventory/waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId: wasteOpen,
        quantity: Number(wasteForm.quantity),
        reason: wasteForm.reason || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Merma registrada");
      setWasteOpen(null);
      setWasteForm({ quantity: "", reason: "" });
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Error al registrar merma");
    }
  }

  const freshnessLabel = { fresh: "Fresca", expiring: "Por vencer", expired: "Vencida" };

  function FreshnessBar({ daysLeft, freshness }: { daysLeft: number; freshness: string }) {
    const pct = Math.max(0, Math.min(100, Math.round((daysLeft / 7) * 100)));
    const color =
      freshness === "fresh"
        ? "bg-green-500"
        : freshness === "expiring"
        ? "bg-yellow-400"
        : "bg-red-500";
    const labelColor =
      freshness === "fresh"
        ? "text-green-700"
        : freshness === "expiring"
        ? "text-yellow-700"
        : "text-red-700";
    const daysText =
      daysLeft < 0
        ? "Vencida"
        : daysLeft === 0
        ? "Vence hoy"
        : `${daysLeft}d restante${daysLeft !== 1 ? "s" : ""}`;

    return (
      <div className="min-w-[120px]">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-xs font-semibold ${labelColor}`}>
            {freshnessLabel[freshness as keyof typeof freshnessLabel]}
          </span>
          <span className={`text-xs ${labelColor}`}>{daysText}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lotes activos por fecha de vencimiento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchData}>
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Registrar entrada
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Flor", "Proveedor", "Recibido", "Vence", "Ramos totales", "Restante", "Frescura", ""].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                    Cargando…
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                    Sin lotes registrados
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.flower.name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.supplier}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.receivedAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.expiresAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{b.quantity}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{b.remaining}</td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <FreshnessBar daysLeft={b.daysLeft} freshness={b.freshness} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {b.remaining > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setWasteOpen(b.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Merma
                          </Button>
                        )}
                        {deleteConfirm === b.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Eliminar?</span>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(b.id)}
                            >
                              Si    
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(b.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="w-3.5 h-3.5" />
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

      {/* Add Stock Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Registrar Entrada de Stock">
        <form onSubmit={handleAddStock} className="space-y-4">
          <Select
            label="Flor"
            id="flowerId"
            required
            value={form.flowerId}
            onChange={(e) => setForm({ ...form, flowerId: e.target.value })}
          >
            <option value="">Seleccionar flor…</option>
            {flowers.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} – {formatCurrency(f.pricePerBouquet)}/ramo
              </option>
            ))}
          </Select>
          <Input
            label="Cantidad (ramos)"
            id="quantity"
            type="number"
            min={1}
            required
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <Input
            label="Proveedor"
            id="supplier"
            required
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
          />
          <Input
            label="Fecha de recepción"
            id="receivedAt"
            type="datetime-local"
            value={form.receivedAt}
            onChange={(e) => setForm({ ...form, receivedAt: e.target.value })}
          />
          <Textarea
            label="Notas (opcional)"
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Registrar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Waste Modal */}
      <Modal open={!!wasteOpen} onClose={() => setWasteOpen(null)} title="Registrar Merma">
        <form onSubmit={handleWaste} className="space-y-4">
          <Input
            label="Cantidad de ramos a dar de baja"
            id="wasteQty"
            type="number"
            min={1}
            required
            value={wasteForm.quantity}
            onChange={(e) => setWasteForm({ ...wasteForm, quantity: e.target.value })}
          />
          <Textarea
            label="Motivo (opcional)"
            id="wasteReason"
            placeholder="Flores vencidas, daño por transporte…"
            value={wasteForm.reason}
            onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setWasteOpen(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" loading={saving}>
              Registrar merma
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
