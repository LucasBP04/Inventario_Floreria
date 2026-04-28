"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, CheckCircle2, Truck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { formatDate, formatCurrency } from "@/lib/utils";

interface OrderItem {
  flowerId: string;
  quantity: number;
  units?: number;
  mode?: "ramos" | "unidades";
  unitPrice: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  channel: string;
  arrangement: string;
  deliveryDate: string;
  status: string;
  totalPrice: string;
  notes?: string;
  createdAt: string;
  items: Array<{ flower: { name: string }; quantity: number; units?: number; unitPrice: string }>;
  createdBy: { name: string };
}

interface Flower {
  id: string;
  name: string;
  pricePerBouquet: string;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const STATUS_VARIANT: Record<string, "default" | "fresh" | "expiring" | "expired" | "outline"> = {
  PENDING: "expiring",
  CONFIRMED: "fresh",
  DELIVERED: "default",
  CANCELLED: "expired",
};

const CHANNEL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  OTHER: "Otro",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const emptyItem: OrderItem = { flowerId: "", quantity: 1, unitPrice: 0, mode: "ramos" };
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    channel: "WHATSAPP",
    arrangement: "",
    deliveryDate: "",
    notes: "",
    seasonId: "",
    items: [{ ...emptyItem }],
  });

  const fetchData = useCallback(async () => {
    const params = filterStatus ? `?status=${filterStatus}` : "";
    const [oRes, fRes] = await Promise.all([
      fetch(`/api/orders${params}`),
      fetch("/api/flowers"),
    ]);
    if (oRes.ok) setOrders(await oRes.json());
    if (fRes.ok) setFlowers(await fRes.json());
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateItem(idx: number, field: keyof OrderItem, val: string | number) {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val } as OrderItem;
    // Auto-fill price when flower selected
    if (field === "flowerId") {
      const flower = flowers.find((f) => f.id === val);
      if (flower) items[idx].unitPrice = Number(flower.pricePerBouquet);
    }
    setForm({ ...form, items });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
      const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        deliveryDate: new Date(form.deliveryDate).toISOString(),
        seasonId: form.seasonId || undefined,
        items: form.items.map((i) => ({
          flowerId: i.flowerId,
          // send quantity only for ramos; send units only for unidades
          quantity: i.mode === "ramos" ? Number(i.quantity) : undefined,
          units: i.mode === "unidades" ? Number(i.units ?? 0) : undefined,
          unitPrice: Number(i.unitPrice),
        })),
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Pedido creado");
      setOpen(false);
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Error al guardar");
    }
  }

  async function confirmOrder(id: string) {
    const res = await fetch(`/api/orders/${id}/confirm`, { method: "POST" });
    if (res.ok) {
      toast.success("Pedido confirmado y stock descontado");
      fetchData();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Error al confirmar");
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success("Estado actualizado");
      fetchData();
    } else {
      toast.error("Error al actualizar estado");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de pedidos de clientes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="DELIVERED">Entregados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4" />
            Nuevo pedido
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Cliente", "Canal", "Arreglo", "Entrega", "Total", "Estado", "Registrado por", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Cargando…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Sin pedidos</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.customerName}</p>
                      <p className="text-xs text-gray-500">{o.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{CHANNEL_LABEL[o.channel]}</td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-gray-900 truncate">{o.arrangement}</p>
                      <p className="text-xs text-gray-500">
                        {o.items
                          .map((i) =>
                            i.units != null
                              ? `${i.units}x ${i.flower.name} (uds)`
                              : `${i.quantity}x ${i.flower.name} (ramos)`
                          )
                          .join(", ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(o.deliveryDate)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(Number(o.totalPrice))}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.createdBy.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {o.status === "PENDING" && (
                          <Button size="sm" variant="ghost" onClick={() => confirmOrder(o.id)} className="text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmar
                          </Button>
                        )}
                        {o.status === "CONFIRMED" && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, "DELIVERED")} className="text-blue-600">
                            <Truck className="w-3.5 h-3.5" />
                            Entregado
                          </Button>
                        )}
                        {(o.status === "PENDING" || o.status === "CONFIRMED") && (
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, "CANCELLED")} className="text-red-500">
                            <XCircle className="w-3.5 h-3.5" />
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

      {/* Create Order Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Pedido" className="max-w-4xl">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre del cliente" id="cname" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            <Input label="Teléfono / WhatsApp" id="cphone" required value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Canal" id="channel" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="OTHER">Otro</option>
            </Select>
            <Input label="Fecha de entrega" id="delivery" type="datetime-local" required value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
          </div>
          <Textarea label="Descripción del arreglo" id="arrangement" required value={form.arrangement} onChange={(e) => setForm({ ...form, arrangement: e.target.value })} />

          {/* Items */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Flores del arreglo</p>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-end flex-wrap w-full">
                  <div className="w-1/2 min-w-[160px]">
                    <Select
                      id={`item-flower-${idx}`}
                      value={item.flowerId}
                      onChange={(e) => updateItem(idx, "flowerId", e.target.value)}
                      required
                    >
                      <option value="">Seleccionar flor…</option>
                      {flowers.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="w-1/4 min-w-[140px] flex items-end gap-2">
                    <div className="w-1/2">
                      <Select
                        id={`item-mode-${idx}`}
                        value={item.mode ?? "ramos"}
                        onChange={(e) => updateItem(idx, "mode", e.target.value as any)}
                      >
                        <option value="ramos">Ramos</option>
                        <option value="unidades">Unidades</option>
                      </Select>
                    </div>
                    <div className="w-1/2">
                      <Input
                        id={`item-qty-${idx}`}
                        type="number"
                        min={1}
                        placeholder={item.mode === "unidades" ? "Unidades" : "Ramos"}
                        value={item.mode === "unidades" ? (item.units ?? "") : item.quantity}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (item.mode === "unidades") updateItem(idx, "units", v);
                          else updateItem(idx, "quantity", v);
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="w-[15%] min-w-[90px]">
                    <Input
                      id={`item-price-${idx}`}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Precio"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="w-[10%] min-w-[48px] flex items-end justify-end">
                    {form.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setForm({ ...form, items: [...form.items, { ...emptyItem }] })}
            >
              + Agregar flor
            </Button>
          </div>

          <Textarea label="Notas (opcional)" id="onotes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear pedido</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
