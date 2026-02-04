import { cookies } from "next/headers";
import EditMomentClient from "./EditMomentClient";
import { buildApiUrl } from "../../../request-base";

type Moment = {
  id: number;
  image_urls: string[];
  emotion: string;
  note: string | null;
};

export default async function EditMomentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(await buildApiUrl(`/api/moments/${id}`), {
    headers: {
      Cookie: `token=${(await cookies()).get("token")?.value ?? ""}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <div>
        <h1>Failed to load moment</h1>
        <p>Status: {res.status}</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { moment?: Moment };
  if (!data.moment) {
    return <div>Moment not found</div>;
  }

  return <EditMomentClient id={id} moment={data.moment} />;
}
