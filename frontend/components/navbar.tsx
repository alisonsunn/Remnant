"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full px-6 py-7 flex items-center justify-between mb-15.5">
      <Link href="/" className="text-xl font-light tracking-[0.8em] italic">
        REMNANT
      </Link>

      <div className="flex gap-10 text-sm tracking-[0.1em] ">
        <Link href="/">Home</Link>
        <Link href="/record">Record</Link>
        <Link href="/moments">Moments</Link>
        <Link href="/signup">Vault</Link>
        <Link href="/logout">Logout</Link>
      </div>
    </nav>
  );
}
