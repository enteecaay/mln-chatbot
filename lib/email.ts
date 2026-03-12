import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} chưa được cấu hình`);
  }

  return value;
}

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const user = getRequiredEnv("GMAIL_USER");
  const pass = getRequiredEnv("GMAIL_APP_PASSWORD");

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

function getFromEmail(): string {
  const configured = process.env.MAIL_FROM?.trim();
  if (configured) return configured;
  return `MLN Chatbot <${getRequiredEnv("GMAIL_USER")}>`;
}

export async function sendOtpEmail(email: string, code: string, name: string): Promise<void> {
  const mailer = getTransporter();

  await mailer.sendMail({
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
  const mailer = getTransporter();

  await mailer.sendMail({
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