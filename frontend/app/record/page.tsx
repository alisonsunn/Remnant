"use client";

import MomentPage from "../../components/MomentPage";
import "./record.css";
import { useRouter } from "next/navigation";

type Payload = {
  emotion?: string;
  note?: string | null;
  image_keys?: string[];
};

export default function RecordPage() {
  const router = useRouter();

  function onDiscard() {
    router.replace("/home");
  }

  async function onSubmit(payload: Payload) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/moments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important: include cookies for authentication
      body: JSON.stringify({
        emotion: payload.emotion,
        note: payload.note,
        image_keys: payload.image_keys,
      }),
    });

    console.log("status:", res.status);
    const data = await res.json();
    console.log("response data:", data);

    if (!res.ok) {
      console.error("Failed to create moment:", data);
      return;
    }
  }
  return <MomentPage mode="record" onSubmit={onSubmit} onDiscard={onDiscard} />;
}
