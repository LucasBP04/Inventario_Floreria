"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Clock, CalendarHeart, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const POLL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 30000);

interface AlertData {
  lowStock: Array<{ id: string; flower: { name: string }; remaining: number; supplier: string }>;
  expiring: Array<{ id: string; flower: { name: string }; remaining: number; expiresAt: string; daysLeft: number }>;
  upcomingSeasons: Array<{ id: string; name: string; startDate: string; multiplier: string; targetUnits?: number }>;
}

export default function AlertsPage() {
  const [data, setData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    const res = await fetch("/api/alerts");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAlerts();
    const iv = setInterval(fetchAlerts, POLL_MS);
    return () => clearInterval(iv);
  }, [fetchAlerts]);

  const totalAlerts = (data?.lowStock.length ?? 0) + (data?.expiring.length ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Alertas
            {totalAlerts > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                {totalAlerts}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Notificaciones de inventario y temporadas</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchAlerts}>
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                Stock Bajo
                {(data?.lowStock.length ?? 0) > 0 && (
                  <Badge variant="expiring">{data!.lowStock.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(data?.lowStock ?? []).length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">✓ Todo en orden</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data!.lowStock.map((b) => (
                    <div key={b.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{b.flower.name}</p>
                      <p className="text-xs text-gray-500">
                        {b.remaining} ramo{b.remaining !== 1 ? "s" : ""} restante{b.remaining !== 1 ? "s" : ""} · {b.supplier}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Near Expiration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Clock className="w-4 h-4" />
                Por Vencer
                {(data?.expiring.length ?? 0) > 0 && (
                  <Badge variant="expiring">{data!.expiring.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(data?.expiring ?? []).length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">✓ Sin flores por vencer</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data!.expiring.map((b) => (
                    <div key={b.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{b.flower.name}</p>
                      <p className="text-xs text-gray-500">
                        {b.remaining} ramos · Vence {formatDate(b.expiresAt)} ({b.daysLeft}d)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Seasons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-700">
                <CalendarHeart className="w-4 h-4" />
                Temporadas Próximas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(data?.upcomingSeasons ?? []).length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Sin temporadas en los próximos 14 días</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data!.upcomingSeasons.map((s) => (
                    <div key={s.id} className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">
                        Inicia {formatDate(s.startDate)} · ×{Number(s.multiplier).toFixed(2)} precio
                      </p>
                      {s.targetUnits && (
                        <p className="text-xs text-primary font-medium mt-0.5">
                          Recomendado comprar: {s.targetUnits} ramos
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
