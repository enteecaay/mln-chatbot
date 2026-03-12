"use client";

import { Activity, MessageSquareText, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DashboardStats } from "@/lib/admin";

type DashboardProps = {
  stats: DashboardStats;
};

export function Dashboard({ stats }: DashboardProps) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={<Users className="h-5 w-5" />} label="Tổng người dùng" value={stats.totalUsers.toString()} accent="from-[#efb0c9] to-[#d981a8]" />
        <StatCard icon={<MessageSquareText className="h-5 w-5" />} label="Tổng tin nhắn" value={stats.totalMessages.toString()} accent="from-[#a1c9f1] to-[#5d7ed8]" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Lượt truy cập" value={stats.totalAccess.toString()} accent="from-[#b495ff] to-[#8a66dd]" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[28px] border border-white/60 bg-white/74 p-6 shadow-[0_16px_50px_rgba(93,126,216,0.12)]">
          <h2 className="text-xl font-semibold text-slate-900">Lượng truy cập theo ngày</h2>
          <p className="mt-1 text-sm text-slate-500">Dữ liệu được lấy từ bảng access_logs.</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.accessSeries}>
                <defs>
                  <linearGradient id="accessGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#efb0c9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a1c9f1" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="visits" stroke="#b65c80" fill="url(#accessGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/60 bg-white/74 p-6 shadow-[0_16px_50px_rgba(182,92,128,0.12)]">
          <h2 className="text-xl font-semibold text-slate-900">Top user theo số câu hỏi</h2>
          <p className="mt-1 text-sm text-slate-500">Dựa trên số câu hỏi đã gửi vào chatbot.</p>
          <div className="mt-5 space-y-4">
            {stats.topUsers.map((user, index) => (
              <div key={user.email} className="rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">#{index + 1} {user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#5d7ed8]">
                    {user.questions} câu hỏi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  accent,
  icon,
  label,
  value,
}: {
  accent: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/78 p-5 shadow-[0_18px_45px_rgba(182,92,128,0.1)]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br text-white ${accent}`}>
        {icon}
      </div>
      <p className="mt-4 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}