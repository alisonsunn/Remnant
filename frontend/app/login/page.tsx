"use client";
import { useState } from "react";
import AuthFormShell from "@/components/AuthFormShell";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

if (!API_BASE) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE");
}

async function handleLogin(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    console.log("login status:", res.status);
    console.log("login data:", data);

    if (!res.ok) {
      const msg =
        data?.message || data?.error || `Login failed (${res.status})`;
      return { ok: false, message: msg };
    }

    return { ok: true, user: data.user };
  } catch (error: any) {
    console.error("login failed:", error);
    return { ok: false, error: error?.message || "Network error" };
  }
}

export default function Login() {
  return (
    <AuthFormShell
      title="Return to the Archive"
      subtitle="YOUR REMNANTS AWAIT YOUR ARRIVAL"
      submitText="ENTER ARCHIVE"
      footerText="NEED TO BEGIN A NEW LEGACY? "
      footerLinkText="SIGN UP"
      footerHref="/signup"
      submitUser={({ email, password }) => handleLogin(email, password)}
    />
  );
}
