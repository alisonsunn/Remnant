"use client";
import { useState } from "react";
import AuthFormShell from "@/components/AuthFormShell";
import StatusModal from "@/components/modal/statusModal";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function handleSignup(email: string, password: string) {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");
    const url = apiBase ? `${apiBase}/auth/signup` : "/auth/signup";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      console.log("signup status:", res.status);
      console.log("signup data:", data);

      if (!res.ok) {
        // HTTP error
        const msg =
          data?.message || data?.error || `Signup failed (${res.status})`;
        setIsOpen(true);
        setMessage(msg);
        return { ok: false, message: msg };
      }

      router.replace("/record");

      return { ok: true, user: data.user };
    } catch (error: any) {
      console.error("signup failed:", error);
      return { ok: false, error: error?.message || "Network error" };
    }
  }

  return (
    <>
      <AuthFormShell
        title="Begin your New Legacy"
        subtitle="ESTABLISH YOUR SPACE IN TIME"
        submitText="CREATE REMNANT"
        footerText="Already have a legacy? "
        footerLinkText="LOG IN"
        footerHref="/login"
        submitUser={({ email, password }) => handleSignup(email, password)}
      />
      <StatusModal isOpen={isOpen} setIsOpen={setIsOpen} message={message} />
    </>
  );
}
