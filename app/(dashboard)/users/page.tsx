"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, UserCheck, UserX, ShieldCheck, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/form";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const empty = { name: "", email: "", password: "", role: "EMPLOYEE" };
  const [form, setForm] = useState(empty);

  const fetchUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Usuario creado");
      setOpen(false);
      setForm(empty);
      fetchUsers();
    } else {
      const err = await res.json();
      toast.error(err.error ?? "Error al crear usuario");
    }
  }

  async function toggleActive(u: User) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !u.isActive }),
    });
    if (res.ok) {
      toast.success(u.isActive ? "Usuario desactivado" : "Usuario activado");
      fetchUsers();
    }
  }

  async function toggleRole(u: User) {
    const newRole = u.role === "OWNER" ? "EMPLOYEE" : "OWNER";
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success("Rol actualizado");
      fetchUsers();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de acceso al panel</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Nombre", "Correo", "Rol", "Estado", "Registrado", "Acciones"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Cargando…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">Sin usuarios</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "OWNER" ? "fresh" : "default"}>
                        {u.role === "OWNER" ? "Propietario" : "Empleado"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.isActive ? "fresh" : "expired"}>
                        {u.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleRole(u)}
                          title={`Cambiar a ${u.role === "OWNER" ? "Empleado" : "Propietario"}`}
                        >
                          {u.role === "OWNER" ? (
                            <Shield className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-primary" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(u)}
                        >
                          {u.isActive ? (
                            <UserX className="w-4 h-4 text-red-500" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Usuario">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nombre completo" id="uname" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Correo electrónico" id="uemail" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Contraseña (mínimo 8 caracteres)" id="upass" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Select label="Rol" id="urole" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="EMPLOYEE">Empleado</option>
            <option value="OWNER">Propietario</option>
          </Select>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear usuario</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
