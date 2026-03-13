"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

import { SignInForm } from "@/components/SignInForm";
import { SignUpForm } from "@/components/SignUpForm";
import { VerifyEmailForm } from "@/components/VerifyEmailForm";
import { HorseTransition } from "@/components/HorseTransition";
import { LoadingSprite } from "@/components/LoadingSprite";
import { getCurrentUser, type PendingSignup, type User } from "@/lib/auth";

type AuthView = "signin" | "signup" | "verify";

const PENDING_VERIFY_KEY = "mln_pending_verify";

export function AuthLanding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authView, setAuthView] = useState<AuthView>("signin");
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitionUser, setTransitionUser] = useState<User | null>(null);
  // Keep a ref so onDone callback always sees the latest user without re-creating
  const transitionUserRef = useRef<User | null>(null);

  const nextPath = searchParams.get("next") || "/chat";

  const routeByRole = useCallback(
    (user: User) => {
      router.replace(user.role === "admin" ? "/admin" : nextPath);
    },
    [nextPath, router],
  );

  // Stable callback — reads from ref, never stale
  const handleTransitionDone = useCallback(() => {
    const u = transitionUserRef.current;
    if (u) routeByRole(u);
  }, [routeByRole]);

  useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser();
      if (user) {
        routeByRole(user);
        return;
      }

      // Restore pending OTP verification after accidental page refresh
      try {
        const stored = sessionStorage.getItem(PENDING_VERIFY_KEY);
        if (stored) {
          const { email, name } = JSON.parse(stored) as { email: string; name: string };
          if (email && name) {
            setPendingSignup({ email, name, password: "" });
            setAuthView("verify");
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore malformed storage value
      }

      setLoading(false);
    };

    void load();
  }, [routeByRole]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff4f8_0%,#f7fbff_38%,#fff_100%)]">
        <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
          <LoadingSprite size="md" />
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fff4f8_0%,#eef6ff_38%,#ffffff_100%)] px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden rounded-[36px] border border-white/60 bg-white/55 p-8 shadow-[0_25px_90px_rgba(161,201,241,0.22)] backdrop-blur-xl md:p-12">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(239,176,201,0.22),rgba(161,201,241,0.16),rgba(180,149,255,0.16))]" />
          <div className="relative">
            <span className="inline-flex rounded-full bg-white/75 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[#b65c80]">
              Marx-Lenin Study Assistant
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-tight text-slate-900 md:text-6xl">
              Học Mác - Lênin với chatbot có xác thực email, lịch sử trò chuyện và dashboard quản trị.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Nền tảng dành cho mini project lớp học: đăng nhập an toàn bằng OTP gửi tới Gmail, lưu lịch sử từng cuộc trò chuyện và quản lý người dùng theo vai trò user hoặc admin.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="Chat nhiều phiên" description="Tạo nhiều đoạn chat riêng, lưu toàn bộ lịch sử và quay lại học tiếp bất kỳ lúc nào." />
              <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Xác thực thật" description="Đăng ký bằng email thật, xác minh OTP và phân quyền user/admin rõ ràng." />
              <FeatureCard icon={<WalletCards className="h-5 w-5" />} title="Dashboard admin" description="Theo dõi lượt truy cập, số lượng tin nhắn, top user và quản lý cấm chat theo thời gian." />
            </div>

            <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/10">
              Bắt đầu ngay
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </section>

        <section className="flex justify-center">
          {authView === "signup" && (
            <SignUpForm
              onRegistered={(pending) => {
                sessionStorage.setItem(
                  PENDING_VERIFY_KEY,
                  JSON.stringify({ email: pending.email, name: pending.name }),
                );
                setPendingSignup(pending);
                setAuthView("verify");
              }}
              onGoSignIn={() => setAuthView("signin")}
            />
          )}

          {authView === "verify" && pendingSignup && (
            <VerifyEmailForm
              pending={pendingSignup}
              onVerified={(user) => {
                sessionStorage.removeItem(PENDING_VERIFY_KEY);
                if (user) {
                  transitionUserRef.current = user;
                  setTransitionUser(user);
                } else {
                  // OTP verified but no password in session → redirect to sign in
                  setVerifiedEmail(pendingSignup.email);
                  setAuthView("signin");
                }
              }}
              onBack={() => {
                sessionStorage.removeItem(PENDING_VERIFY_KEY);
                setAuthView("signup");
              }}
            />
          )}

          {authView === "signin" && (
            <SignInForm
              onSignedIn={(user) => {
                setVerifiedEmail(null);
                transitionUserRef.current = user;
                setTransitionUser(user);
              }}
              onGoSignUp={() => {
                setVerifiedEmail(null);
                setAuthView("signup");
              }}
              onGoVerify={(email) => {
                setVerifiedEmail(null);
                sessionStorage.setItem(
                  PENDING_VERIFY_KEY,
                  JSON.stringify({ email, name: "" }),
                );
                setPendingSignup({ email, name: "", password: "" });
                setAuthView("verify");
              }}
              preEmail={verifiedEmail ?? undefined}
              successMessage={
                verifiedEmail
                  ? "Email đã được xác minh! Đăng nhập để tiếp tục."
                  : undefined
              }
            />
          )}
        </section>
      </div>

      {transitionUser && (
        <HorseTransition
          name={transitionUser.name}
          role={transitionUser.role}
          onDone={handleTransitionDone}
        />
      )}

    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-[#efb0c9] to-[#a1c9f1] text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}