interface Moment {
  id: number;
  image_url: string | null;
  emotion: string;
  note: string | null;
  created_at: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
}

export default async function MomentsList({
  moments,
  total,
}: {
  moments: Moment[];
  total: number;
}) {
  return (
    <div>
      {total > 0 &&
        moments.map((moment: Moment) => {
          return (
            <section
              key={moment.id}
              className="flex flex-row justify-between items-center mb-10 grayscale"
            >
              <div className="flex flex-row gap-8">
                <div>
                  {moment.image_url && (
                    <img
                      src={moment.image_url}
                      alt={moment.emotion}
                      className="w-40 h-40 object-cover"
                    />
                  )}
                </div>

                <div className="flex flex-col justify-center gap-2">
                  <h3>{moment.emotion}</h3>
                  {moment.note && <p>{moment.note}</p>}
                </div>
              </div>

              <h4>{formatDate(moment.created_at)}</h4>
            </section>
          );
        })}
      {total === undefined && <h2>Please record your first moment</h2>}
    </div>
  );
}
