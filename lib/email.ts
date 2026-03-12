import { Resend } from "resend";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY chưa được cấu hình");
  }

  return new Resend(apiKey);
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || "MLN Chatbot <onboarding@resend.dev>";
}

export async function sendOtpEmail(email: string, code: string, name: string): Promise<void> {
  const resend = getResendClient();

  await resend.emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Ma xac thuc dang ky MLN Chatbot",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #40273a;">
        <h2 style="color: #c75b8a;">Xin chao ${name}</h2>
        <p>Ma OTP xac thuc tai khoan cua ban la:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #fde9f1; color: #8c3358; padding: 16px 24px; border-radius: 16px; display: inline-block;">${code}</div>
        <p>Ma co hieu luc trong 10 phut.</p>
      </div>
    `,
  });
}

export async function sendBanEmail(params: {
  email: string;
  name: string;
  durationLabel: string;
  reason?: string | null;
}): Promise<void> {
  const resend = getResendClient();

  await resend.emails.send({
    from: getFromEmail(),
    to: params.email,
    subject: "Thong bao tam khoa quyen chat",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #40273a;">
        <h2 style="color: #c75b8a;">Xin chao ${params.name}</h2>
        <p>Tai khoan cua ban da bi tam khoa quyen chat trong thoi gian <strong>${params.durationLabel}</strong>.</p>
        <p>Ly do: ${params.reason || "Vi pham quy dinh su dung cua he thong."}</p>
        <p>Neu ban cho rang day la nham lan, vui long lien he quan tri vien.</p>
      </div>
    `,
  });
}