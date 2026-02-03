"use client";
import MomentPage from "../../components/MomentPage";
import "./record.css";

export default function RecordPage() {
  async function onSubmit(payload: Payload) {
    const res = await fetch("http://localhost:3001/api/moments", {
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
  return <MomentPage mode="record" onSubmit={onSubmit} />;
}
