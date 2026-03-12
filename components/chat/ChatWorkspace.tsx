"use client";

import { useState } from "react";

import ChatBox from "@/components/ChatBox";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ProfileModal } from "@/components/ProfileModal";
import { Header } from "@/components/shared/Header";
import { signOut, type User } from "@/lib/auth";

type ChatWorkspaceProps = {
  user: User;
};

export function ChatWorkspace({ user: initialUser }: ChatWorkspaceProps) {
  const [user, setUser] = useState(initialUser);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <Header
        title="Khu vực học tập"
        subtitle="Tạo nhiều phiên chat, lưu lịch sử tự động và quản lý hồ sơ cá nhân của bạn."
        user={user}
        onOpenProfile={() => setShowProfile(true)}
      />

      <div className="w-full grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <ChatSidebar
          userId={user.id}
          selectedSessionId={selectedSessionId}
          refreshKey={refreshKey}
          onSelectSession={setSelectedSessionId}
        />

        <ChatBox
          currentUserId={user.id}
          currentUserName={user.name}
          currentUserAvatar={user.avatar ?? null}
          selectedSessionId={selectedSessionId}
          onSessionActivity={() => setRefreshKey((current) => current + 1)}
        />
      </div>

      {showProfile && (
        <ProfileModal
          user={user}
          onUpdate={setUser}
          onClose={() => setShowProfile(false)}
          onSignOut={() => {
            void signOut();
          }}
        />
      )}
    </div>
  );
}