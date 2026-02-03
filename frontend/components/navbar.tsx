"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusModal from "./modal/statusModal";
import { useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogout(router: any) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!res.ok) {
        setIsOpen(true);
        setMessage(res.statusText);
        return;
      }
      router.replace("/");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
    setIsOpen(true);
    setMessage("Logged out successfully");
  }

  return (
    <nav className="w-full px-6 py-7 flex items-center justify-between mb-15.5">
      <Link href="/" className="text-xl font-light tracking-[0.8em] italic">
        REMNANT
      </Link>

      <div className="flex gap-10 text-sm tracking-[0.1em] ">
        <Link href="/home">Home</Link>
        <Link href="/record">Record</Link>
        <Link href="/moments">Moments</Link>
        <Link href="/signup">Vault</Link>
        <button onClick={() => handleLogout(router)}>Logout</button>
      </div>
      <StatusModal isOpen={isOpen} setIsOpen={setIsOpen} message={message} />
    </nav>
  );
}
