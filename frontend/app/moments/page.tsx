import MomentsList from "../../components/momentslist";
import { cookies } from "next/headers";

export default async function Moments() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const res = await fetch("http://localhost:3001/api/moments", {
    headers: {
      Cookie: `token=${token}`,
    },
  });

  const { moments, total } = await res.json();

  return (
    <main className="ml-80 mr-80 flex flex-col gap-2">
      <section className="flex flex-row justify-between items-center mb-10">
        <h1>Present Moments</h1>
        <h2 className="mb-0">{total} Fragments</h2>
      </section>
      <MomentsList moments={moments} />
    </main>
  );
}
