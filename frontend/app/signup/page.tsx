"use client";
import { useState } from "react";
import AuthFormShell from "@/components/AuthFormShell";

async function handleSignup(email: string, password: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE;

  if (!apiBase) {
    return { ok: false, error: "API base URL is not configured" };
  }

  try {
    const res = await fetch(`${apiBase}/auth/signup`, {
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
      return { ok: false, message: msg };
    }

    return { ok: true, user: data.user };
  } catch (error: any) {
    console.error("signup failed:", error);
    return { ok: false, error: error?.message || "Network error" };
  }
}

export default function Signup() {
  return (
    <AuthFormShell
      title="Begin your New Legacy"
      subtitle="ESTABLISH YOUR SPACE IN TIME"
      submitText="CREATE REMNANT"
      footerText="Already have a legacy? "
      footerLinkText="LOG IN"
      footerHref="/login"
      submitUser={({ email, password }) => handleSignup(email, password)}
    />
  );
}
