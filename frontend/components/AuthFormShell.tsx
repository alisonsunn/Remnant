"use client";

import Link from "next/link";
import { useState } from "react";
import React from "react";

type Props = {
  title: string;
  subtitle: string;
  submitText: string;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
  submitUser: (payload: {
    email: string;
    password: string;
  }) => void | Promise<
    Response | { ok: boolean; message?: string; user?: any; error?: string }
  >;
};

export default function AuthFormShell({
  title,
  subtitle,
  submitText,
  footerText,
  footerLinkText,
  footerHref,
  submitUser,
}: Props) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitUser({ email, password });
  };

  return (
    <main className="min-h-screen flex">
      <div className="container w-full max-w-md mx-auto">
        <h1 className="text-center">{title}</h1>
        <h2 className="text-center mb-10">{subtitle}</h2>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="field-group">
            <label>IDENTITY</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required={true}
              name="email"
              placeholder="Email address"
              onInvalid={(e) => {
                e.currentTarget.setCustomValidity(
                  "Email address must contain @",
                );
              }}
              onInput={(e) => {
                e.currentTarget.setCustomValidity("");
              }}
            />
          </div>
          <div className="field-group">
            <label>SECRET</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              name="password"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="mt-12 w-full bg-black text-white py-4 text-[10px] tracking-[0.4em] uppercase shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
          >
            {submitText}
          </button>
        </form>
        <div className="mt-8 text-center text-[10px] tracking-[0.3em] text-black/30 uppercase">
          {footerText}
          <a
            href={footerHref}
            className="underline underline-offset-4 hover:text-black"
          >
            {footerLinkText}
          </a>
        </div>
      </div>
    </main>
  );
}
