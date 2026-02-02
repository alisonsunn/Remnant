"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

async function handleLogout(router: any) {
  try {
    const res = await fetch("http://localhost:3001/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error("Failed to logout");
    }
    router.replace("/");
  } catch (error) {
    console.error("Failed to logout:", error);
  }
  alert("Logged out successfully");
}

export default function Navbar() {
  const router = useRouter();
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
    </nav>
  );
}
