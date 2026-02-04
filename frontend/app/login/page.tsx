"use client";

import AuthFormShell from "@/components/AuthFormShell";
import { useRouter } from "next/navigation";
import StatusModal from "@/components/modal/statusModal";
import { useState } from "react";

function toErrorMessage(data: unknown, fallback: string): string {
  if (data == null || typeof data !== "object") return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.message === "string") return d.message;
  if (typeof d.error === "string") return d.error;
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail))
    return d.detail
      .map((x: unknown) =>
        typeof x === "string"
          ? x
          : ((x as { msg?: string; message?: string })?.msg ??
            (x as { message?: string })?.message ??
            String(x)),
      )
      .join(", ");
  return fallback;
}

export default function Login() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(router: any, email: string, password: string) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    const url = apiBase ? `${apiBase}/auth/login` : "/auth/login";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      console.log("login status:", res.status);
      console.log("login data:", data);

      if (!res.ok) {
        const msg = toErrorMessage(data, `Login failed (${res.status})`);
        setIsOpen(true);
        setMessage(msg);
        return { ok: false, message: msg };
      }

      router.replace("/record");

      return { ok: true, user: data.user };
    } catch (error: any) {
      console.error("login failed:", error);
      return { ok: false, error: error?.message || "Network error" };
    }
  }

  return (
    <>
      <AuthFormShell
        title="Return to the Archive"
        subtitle="YOUR REMNANTS AWAIT YOUR ARRIVAL"
        submitText="ENTER ARCHIVE"
        footerText="NEED TO BEGIN A NEW LEGACY? "
        footerLinkText="SIGN UP"
        footerHref="/signup"
        submitUser={({ email, password }) =>
          handleLogin(router, email, password)
        }
      />
      <StatusModal isOpen={isOpen} setIsOpen={setIsOpen} message={message} />
    </>
  );
}
