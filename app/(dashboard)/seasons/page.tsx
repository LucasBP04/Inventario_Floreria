"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, CalendarHeart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  multiplier: string;
  targetUnits?: number;
  notes?: string;
  isActive: boolean;
  _count: { orders: number };
}

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const empty = { name: "", startDate: "", endDate: "", multiplier: "1", targetUnits: "", notes: "" };
  const [form, setForm] = useState(empty);

  const fetchSeasons = useCallback(async () => {
    const res = await fetch("/api/seasons");
    if (res.ok) setSeasons(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchSeasons(); }, [fetchSeasons]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/seasons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        multiplier: Number(form.multiplier),
        targetUnits: form.targetUnits ? Number(form.targetUnits) : undefined,
        notes: form.notes || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Temporada creada");
      setOpen(false);
      setForm(empty);
      fetchSeasons();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Error al guardar");
    }
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Temporadas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Eventos de alta demanda y precios especiales</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Nueva temporada
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Nombre", "Inicio", "Fin", "Multiplicador", "Meta compra (ramos)", "Pedidos", "Estado"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Cargando…</td></tr>
              ) : seasons.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Sin temporadas registradas</td></tr>
              ) : (
                seasons.map((s) => {
                  const started = new Date(s.startDate) <= now;
                  const ended = new Date(s.endDate) < now;
                  const seStatus = ended ? "Finalizada" : started ? "En curso" : "Próxima";
                  const seVariant = ended ? "default" : started ? "fresh" : "expiring";

                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <CalendarHeart className="w-4 h-4 text-primary" />
                          {s.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(s.startDate)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(s.endDate)}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">×{Number(s.multiplier).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">{s.targetUnits ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{s._count.orders}</td>
                      <td className="px-4 py-3">
                        <Badge variant={seVariant as any}>{seStatus}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva Temporada">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre" id="sname" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="San Valentín 2027" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha inicio" id="sstart" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="Fecha fin" id="send" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <Input label="Multiplicador de precio" id="smult" type="number" min="1" step="0.1" required value={form.multiplier} onChange={(e) => setForm({ ...form, multiplier: e.target.value })} placeholder="1.5 = 50% más caro" />
          <Input label="Meta de compra (ramos recomendados)" id="starget" type="number" min={1} value={form.targetUnits} onChange={(e) => setForm({ ...form, targetUnits: e.target.value })} />
          <Textarea label="Notas" id="snotes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
