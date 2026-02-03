"use client";

import useConfirm from "@/src/hooks/useConfirm";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Moment = {
  id: number;
  image_urls: string[];
  emotion: string;
  note: string | null;
  created_at: string;
};

type MomentDetailClientProps = {
  moment: Moment;
  id: string;
};

export default function MomentDetailClient({
  moment,
  id,
}: MomentDetailClientProps) {
  const { confirm, confirmDialog } = useConfirm();
  const router = useRouter();

  const image_urls = Array.isArray(moment?.image_urls) ? moment.image_urls : [];

  const imageCount = image_urls.length;

  const gridColsClass =
    imageCount <= 1
      ? "grid-cols-1"
      : imageCount === 2
        ? "grid-cols-2"
        : imageCount === 3
          ? "grid-cols-3"
          : imageCount === 4
            ? "grid-cols-2"
            : "grid-cols-3";

  async function handleDiscard() {
    const ok = await confirm({
      title: "Relinquish this memory?",
      message:
        "This fragment of the present will be permanently removed from your working archive. This action cannot be undone.",
      cancelText: "KEEP THIS MOMENT",
      confirmText: "CONFIRM DISCARD",
    });

    if (!ok) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/api/moments/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error("Failed to delete moment:", error);
        alert("Failed to delete moment. Please try again.");
        return;
      }

      const data = await res.json();
      console.log("Moment deleted successfully:", data);

      // Redirect to moments list after successful deletion
      router.push("/moments");
    } catch (error) {
      console.error("Error deleting moment:", error);
      alert("An error occurred while deleting the moment. Please try again.");
    }
  }

  function handleModify() {
    router.replace(`/moments/${id}/edit`);
  }

  return (
    <section className="flex flex-col items-center justify-center pl-15 pr-15">
      <div className="flex justify-between gap-85 mb-5">
        <Link href="/moments">
          <h2 className="normal borderline">Back</h2>
        </Link>
        <div className="flex gap-4">
          <h2 className="normal borderline" onClick={handleModify}>
            Modify
          </h2>
          <h2 onClick={handleDiscard} className="normal delete cursor-pointer">
            Discard
          </h2>
        </div>
      </div>

      <h3 className="text-center big mt-5 mb-5">{moment.emotion}</h3>

      <div className={`grid ${gridColsClass} gap-4`}>
        {image_urls.map((url: string, idx: number) => (
          <img
            key={idx}
            src={url}
            alt={`${moment.emotion}-${idx}`}
            className="w-65 h-65 object-cover [filter:grayscale(100%)] pt-4"
          />
        ))}
      </div>

      <p className="text-center text-1.5xl italic mt-5">"{moment.note}"</p>

      <div className="flex justify-center">
        <button className="submit-button submit-button--dark mb-5">
          SEAL AS TIME CAPSULE
        </button>
      </div>

      {confirmDialog}
    </section>
  );
}
