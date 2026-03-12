import crypto from "node:crypto";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} chưa được cấu hình`);
  }

  return value;
}

export async function uploadAvatarToCloudinary(file: File): Promise<string> {
  const cloudName = requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "mln-chatbot/avatars";
  const signatureBase = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", apiKey);
  formData.set("timestamp", String(timestamp));
  formData.set("signature", signature);
  formData.set("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Không thể upload ảnh đại diện");
  }

  const payload = (await response.json()) as { secure_url?: string };
  if (!payload.secure_url) {
    throw new Error("Cloudinary không trả về URL ảnh");
  }

  return payload.secure_url;
}