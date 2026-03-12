"use client";

import { useState } from "react";

import { Dashboard } from "@/components/admin/Dashboard";
import { UserTable } from "@/components/admin/UserTable";
import { ProfileModal } from "@/components/ProfileModal";
import { Header } from "@/components/shared/Header";
import type { DashboardStats, AdminUserRecord } from "@/lib/admin";
import { signOut, type User } from "@/lib/auth";

type AdminWorkspaceProps = {
  currentUser: User;
  stats: DashboardStats;
  users: AdminUserRecord[];
};

export function AdminWorkspace({ currentUser: initialUser, stats, users }: AdminWorkspaceProps) {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="space-y-6">
      <Header
        title="Admin Dashboard"
        subtitle="Theo dõi tình trạng hệ thống, thống kê sử dụng và quản lý người dùng theo quyền admin."
        user={currentUser}
        onOpenProfile={() => setShowProfile(true)}
      />

      <Dashboard stats={stats} />
      <UserTable currentAdminId={currentUser.id} initialUsers={users} />

      {showProfile && (
        <ProfileModal
          user={currentUser}
          onUpdate={setCurrentUser}
          onClose={() => setShowProfile(false)}
          onSignOut={() => {
            void signOut();
          }}
        />
      )}
    </div>
  );
}