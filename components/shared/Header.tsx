"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, MessageSquareMore, UserRound } from "lucide-react";

import { signOut, type User } from "@/lib/auth";

type HeaderProps = {
  title: string;
  subtitle: string;
  user: User;
  onOpenProfile?: () => void;
};

export function Header({ title, subtitle, user, onOpenProfile }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
    router.refresh();
  };

  return (
    <header className="rounded-[28px] border border-white/60 bg-white/74 px-6 py-5 shadow-[0_16px_45px_rgba(182,92,128,0.12)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user.role === "admin" ? (
            <Link href="/admin" className="secondary-button">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <Link href="/chat" className="secondary-button">
              <MessageSquareMore className="h-4 w-4" />
              Chat
            </Link>
          )}

          <button onClick={onOpenProfile} className="secondary-button">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="avatar" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <UserRound className="h-4 w-4" />
            )}
            {user.name}
          </button>

          <button onClick={() => void handleSignOut()} className="secondary-button">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}