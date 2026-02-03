"use client";

import { useRouter } from "next/navigation";
import MomentPage from "../../../../components/MomentPage";

type Payload = {
  emotion: string;
  note: string | null;
  image_keys: string[];
};

type Moment = {
  id: number;
  image_urls: string[];
  emotion: string;
  note: string | null;
};

type Props = {
  id: string;
  moment: Moment;
};

export default function EditMomentClient({ id, moment }: Props) {
  const router = useRouter();

  async function onSubmit(payload: Payload) {
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

      const res = await fetch(`${apiBase}/api/moments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error("Failed to update moment:", error);
        return;
      }

      await res.json().catch(() => ({}));
      router.push(`/moments/${id}`);
    } catch (error) {
      console.error("Failed to update moment:", error);
    }
  }

  return <MomentPage mode="edit" moment={moment} onSubmit={onSubmit} />;
}
