"use client";

import { useMemo, useState } from "react";
import { Ban, Check, Plus, RefreshCcw, Trash2 } from "lucide-react";

import { LoadingSprite } from "@/components/LoadingSprite";
import type { AdminUserRecord } from "@/lib/admin";
import { BanModal } from "@/components/admin/BanModal";

type UserTableProps = {
  currentAdminId: string;
  initialUsers: AdminUserRecord[];
};

type CreateForm = {
  email: string;
  name: string;
  password: string;
  role: "user" | "admin";
};

export function UserTable({ currentAdminId, initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; role: "user" | "admin" }>({
    name: "",
    role: "user",
  });
  const [createForm, setCreateForm] = useState<CreateForm>({
    email: "",
    name: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [banUser, setBanUser] = useState<AdminUserRecord | null>(null);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword),
    );
  }, [search, users]);

  const refreshUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users");
      const body = (await response.json()) as { error?: string; users?: AdminUserRecord[] };
      if (!response.ok || !body.users) {
        throw new Error(body.error || "Không thể tải danh sách user");
      }

      setUsers(body.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách user");
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Không thể tạo user");
      }

      setCreateForm({ email: "", name: "", password: "", role: "user" });
      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo user");
      setLoading(false);
    }
  };

  const saveUser = async (userId: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...draft }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Không thể cập nhật user");
      }

      setEditingId(null);
      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật user");
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === currentAdminId) {
      setError("Không thể xóa tài khoản admin hiện tại.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Không thể xóa user");
      }

      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa user");
      setLoading(false);
    }
  };

  const clearBan = async (userId: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, duration: "clear" }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Không thể gỡ cấm chat");
      }

      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gỡ cấm chat");
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-white/60 bg-white/76 p-6 shadow-[0_16px_50px_rgba(182,92,128,0.12)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Quản lý người dùng</h2>
          <p className="mt-1 text-sm text-slate-500">CRUD user, đổi role và áp dụng cấm chat theo thời gian.</p>
        </div>
        <button onClick={() => void refreshUsers()} className="secondary-button">
          {loading ? <LoadingSprite size="sm" /> : <RefreshCcw className="h-4 w-4" />}
          Làm mới
        </button>
      </div>

      <div className="mt-6 grid gap-4 rounded-3xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-4">
        <input value={createForm.name} onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))} className="input" placeholder="Tên người dùng" />
        <input value={createForm.email} onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))} className="input" placeholder="Email" />
        <input value={createForm.password} onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))} className="input" placeholder="Mật khẩu tạm" />
        <div className="flex gap-3">
          <select value={createForm.role} onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as "user" | "admin" }))} className="input">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={() => void createUser()} className="primary-button px-4">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex justify-between gap-4">
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="input max-w-md" placeholder="Tìm theo tên hoặc email" />
        {loading && <span className="inline-flex items-center gap-2 text-sm text-slate-500"><LoadingSprite size="sm" />Đang xử lý...</span>}
      </div>

      {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="pb-3">User</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Câu hỏi</th>
              <th className="pb-3">Trạng thái</th>
              <th className="pb-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => {
              const isEditing = editingId === user.id;

              return (
                <tr key={user.id} className="border-b border-slate-100 align-top last:border-b-0">
                  <td className="py-4 pr-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} className="input" />
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    )}
                  </td>
                  <td className="py-4 pr-4">
                    {isEditing ? (
                      <select value={draft.role} onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value as "user" | "admin" }))} className="input max-w-35">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">{user.role}</span>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-slate-700">{user.messageCount}</td>
                  <td className="py-4 pr-4">
                    {user.isBanned ? (
                      <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700">
                        Bị cấm{user.banExpiresAt ? ` đến ${new Date(user.banExpiresAt).toLocaleString("vi-VN")}` : " vĩnh viễn"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">Hoạt động</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {isEditing ? (
                        <button onClick={() => void saveUser(user.id)} className="secondary-button px-3">
                          <Check className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(user.id);
                            setDraft({ name: user.name, role: user.role });
                          }}
                          className="secondary-button px-3"
                        >
                          Sửa
                        </button>
                      )}

                      {user.isBanned ? (
                        <button onClick={() => void clearBan(user.id)} className="secondary-button px-3">Gỡ cấm</button>
                      ) : (
                        <button onClick={() => setBanUser(user)} className="secondary-button px-3 text-rose-700">
                          <Ban className="h-4 w-4" />
                        </button>
                      )}

                      <button onClick={() => void deleteUser(user.id)} className="secondary-button px-3 text-rose-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {banUser && (
        <BanModal
          user={banUser}
          onClose={() => setBanUser(null)}
          onSaved={() => {
            void refreshUsers();
          }}
        />
      )}
    </section>
  );
}