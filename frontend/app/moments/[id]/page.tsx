import { cookies } from "next/headers";

export default async function MomentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`http://localhost:3001/api/moments/${id}`, {
    headers: {
      Cookie: `token=${(await cookies()).get("token")?.value}`,
    },
  });

  const { moment } = await res.json();

  console.log("moment:", moment);

  const imageCount = Array.isArray(moment.image_urls)
    ? moment.image_urls.length
    : 0;

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

  return (
    <section className="flex flex-col items-center justify-center pl-15 pr-15">
      <div className="flex justify-between gap-85 mb-5">
        <h2 className="normal borderline">Back</h2>
        <div className="flex gap-4">
          <h2 className="normal borderline">Modify</h2>
          <h2 className="normal delete cursor-pointer">Discard</h2>
        </div>
      </div>
      <h3 className="text-center big  mt-5 mb-5">{moment.emotion}</h3>
      <div className={`grid ${gridColsClass} gap-4`}>
        {moment.image_urls.map((url: string, idx: number) => (
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
    </section>
  );
}
