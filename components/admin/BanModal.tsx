"use client";

import { useState } from "react";

import type { AdminUserRecord } from "@/lib/admin";

const options = [
  { value: "1h", label: "1 giờ" },
  { value: "6h", label: "6 giờ" },
  { value: "12h", label: "12 giờ" },
  { value: "24h", label: "24 giờ" },
  { value: "permanent", label: "Vĩnh viễn" },
] as const;

type BanModalProps = {
  onClose: () => void;
  onSaved: () => void;
  user: AdminUserRecord;
};

export function BanModal({ onClose, onSaved, user }: BanModalProps) {
  const [duration, setDuration] = useState<(typeof options)[number]["value"]>("1h");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          duration,
          reason,
        }),
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Không thể cấm người dùng");
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cấm người dùng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-white/70 bg-white p-6 shadow-2xl">
        <h3 className="text-2xl font-semibold text-slate-900">Cấm chat người dùng</h3>
        <p className="mt-2 text-sm text-slate-600">Áp dụng hình phạt với {user.name} và gửi email thông báo vi phạm.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDuration(option.value)}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${duration === option.value
                  ? "border-[#b65c80] bg-[#fff4f8] text-[#b65c80]"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#a1c9f1]"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Lý do</label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="Ví dụ: spam chat liên tục hoặc vi phạm quy định sử dụng."
          />
        </div>

        {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="secondary-button">Hủy</button>
          <button onClick={() => void submit()} disabled={loading} className="primary-button">
            {loading ? "Đang xử lý..." : "Xác nhận cấm chat"}
          </button>
        </div>
      </div>
    </div>
  );
}