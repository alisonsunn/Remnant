import { cookies } from "next/headers";
import MomentDetailClient from "./MomentDetailClient";

export default async function MomentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/api/moments/${id}`,
    {
      headers: {
        Cookie: `token=${(await cookies()).get("token")?.value ?? ""}`,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    return (
      <div>
        <h1>Error loading moment</h1>
        <p>Status: {res.status}</p>
      </div>
    );
  }

  const data = await res.json();
  const moment = data.moment || {};

  return <MomentDetailClient moment={moment} id={id} />;
}
