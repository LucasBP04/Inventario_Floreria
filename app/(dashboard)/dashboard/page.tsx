"use client";

import { useEffect, useState, useCallback } from "react";

import { createLucideIcon } from "lucide-react";

export const ArrowSwitchIcon = createLucideIcon("ArrowSwitch", [
  [
    "path",
    {
      d: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
]);

import {
  Package, ShoppingCart, TrendingUp, AlertTriangle, Flower2,
  CheckCircle2, Clock , 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const POLL_MS = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL_MS ?? 30000);

interface DashboardData {
  kpis: {
    totalBatches: number;
    expiredBatches: number;
    pendingOrders: number;
    confirmedOrders: number;
    deliveredOrders: number;
    totalRevenue: number;
  };
  recentMovements: Array<{
    id: string;
    type: string;
    quantity: number;
    createdAt: string;
    batch: { flower: { name: string } };
    user: { name: string };
  }>;
  inventorySummary: Array<{
    id: string;
    flowerName: string;
    remaining: number;
    daysLeft: number;
    freshness: string;
    expiresAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, POLL_MS);
    return () => clearInterval(interval);
  }, [fetch_]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const kpis = data?.kpis;

  const kpiCards = [
    {
      label: "Pedidos Pendientes",
      value: kpis?.pendingOrders ?? 0,
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      label: "Pedidos Confirmados",
      value: kpis?.confirmedOrders ?? 0,
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pedidos Entregados",
      value: kpis?.deliveredOrders ?? 0,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Ingresos Totales",
      value: formatCurrency(kpis?.totalRevenue ?? 0),
      icon: TrendingUp,
      color: "text-green-600 bg-rose-50",
    },
    {
      label: "Lotes Activos",
      value: kpis?.totalBatches ?? 0,
      icon: Package,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Lotes Vencidos",
      value: kpis?.expiredBatches ?? 0,
      icon: AlertTriangle,
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Resumen en tiempo real · Se actualiza cada {POLL_MS / 1000}s
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="py-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${k.color}`}>
                <k.icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flower2 className="w-4 h-4 text-primary" />
              Estado del Inventario
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {(data?.inventorySummary ?? []).slice(0, 8).map((item) => {
                const pct = Math.max(0, Math.min(100, Math.round((item.daysLeft / 7) * 100)));
                const barColor =
                  item.freshness === "fresh" ? "bg-green-500" :
                  item.freshness === "expiring" ? "bg-yellow-400" : "bg-red-500";
                const labelColor =
                  item.freshness === "fresh" ? "text-green-700" :
                  item.freshness === "expiring" ? "text-yellow-700" : "text-red-700";
                const freshnessLabel =
                  item.freshness === "fresh" ? "Fresca" :
                  item.freshness === "expiring" ? "Por vencer" : "Vencida";
                const daysText =
                  item.daysLeft < 0 ? "Vencida" :
                  item.daysLeft === 0 ? "Vence hoy" :
                  `${item.daysLeft}d`;

                return (
                  <div key={item.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.flowerName}</p>
                        <p className="text-xs text-gray-500">Vence: {formatDate(item.expiresAt)}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-sm font-semibold text-gray-700">{item.remaining} ramos</p>
                        <p className={`text-xs font-semibold ${labelColor}`}>{freshnessLabel} · {daysText}</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {(data?.inventorySummary ?? []).length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Sin stock registrado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowSwitchIcon className="w-4 h-4 text-primary" /> Últimos Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {(data?.recentMovements ?? []).map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {m.batch.flower.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {m.user.name} · {formatDate(m.createdAt, "dd MMM HH:mm")}
                    </p>
                  </div>
                    <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">{m.quantity} uds</span>
                    <Badge
                      variant={
                        m.type === "IN" ? "fresh" : m.type === "OUT" ? "default" : "expired"
                      }
                    >
                      {m.type === "IN" ? "Entrada" : m.type === "OUT" ? "Salida" : "Merma"}
                    </Badge>
                  </div>
                </div>
              ))}
              {(data?.recentMovements ?? []).length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Sin movimientos</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
