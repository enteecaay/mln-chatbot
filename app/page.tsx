"use client";

import { useEffect, useState } from "react";
import { getSession, clearSession, type User } from "@/lib/auth";
import { SignInForm } from "@/components/SignInForm";
import { SignUpForm } from "@/components/SignUpForm";
import { VerifyEmailForm } from "@/components/VerifyEmailForm";
import { ProfileModal } from "@/components/ProfileModal";
import ChatBox from "@/components/ChatBox";
type AuthView = "signin" | "signup" | "verify";

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthView>("signin");
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const session = getSession();

  if (session) {
    setUser(session);
  }

  setLoading(false);
}, []);

  const handleSignOut = () => {
    clearSession();
    setUser(null);
    setAuthView("signin");
  };

  const handleRegistered = (newUser: User) => {
    // Mock: hiển thị code xác nhận trong console (thực tế gửi email)
    console.log("📧 Mã xác nhận:", newUser.verificationCode);
    setPendingUser(newUser);
    setAuthView("verify");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Chưa đăng nhập ───────────────────────────────────────────────────────
  if (!user) {
    if (authView === "signup") {
      return (
        <SignUpForm
          onRegistered={handleRegistered}
          onGoSignIn={() => setAuthView("signin")}
        />
      );
    }

    if (authView === "verify" && pendingUser) {
      return (
        <VerifyEmailForm
          user={pendingUser}
          onVerified={(verifiedUser) => {
            setPendingUser(null);
            setUser(verifiedUser);
          }}
          onResend={() => {
            // Mock resend
            console.log("📧 Gửi lại mã:", pendingUser.verificationCode);
          }}
        />
      );
    }

    return (
      <SignInForm
        onSignedIn={setUser}
        onGoSignUp={() => setAuthView("signup")}
      />
    );
  }

  // ─── Đã đăng nhập ─────────────────────────────────────────────────────────
  return (
    <main className="h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-end gap-4 px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-gray-700 font-medium">{user.name}</span>
          {!user.emailVerified && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              Chưa xác thực email
            </span>
          )}
        </div>
        <button
          onClick={() => setShowProfile(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          Hồ sơ
        </button>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-500 hover:underline"
        >
          Đăng xuất
        </button>
      </div>

      <ChatBox />

      {showProfile && (
        <ProfileModal
          user={user}
          onUpdate={setUser}
          onClose={() => setShowProfile(false)}
          onSignOut={handleSignOut}
        />
      )}
    </main>
  );
}
