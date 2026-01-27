"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <section className="flex flex-col items-center justify-center mt-30">
      <h1 className="text-center">“What remains after time.”</h1>
      <button
        className="submit-button submit-button--dark"
        onClick={() => router.push("/record")}
      >
        RECORD A MOMENT
      </button>
    </section>
  );
}
