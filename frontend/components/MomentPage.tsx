"use client";

import { useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import { useRouter } from "next/navigation";
import "../app/record/record.css";
import Emotions from "../app/data/emotions.json";

type PhotoItem =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "new"; file: File; previewUrl: string };

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

type MomentPageProps = {
  mode: "record" | "edit";
  moment?: Moment;
  onSubmit: (payload: Payload) => Promise<void>;
};

function makePhotoId(): string {
  const id = crypto.randomUUID();
  return `photo-${id}`;
}

export default function MomentPage(props: MomentPageProps) {
  const { mode, moment, onSubmit } = props;
  const [selectedEmotion, setSelectedEmotion] = useState<string>(
    moment?.emotion ?? "",
  );
  const [note, setNote] = useState<string>(moment?.note ?? "");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (mode !== "edit") return;
    if (!moment) return;

    setPhotos(
      moment.image_urls.map((url) => ({
        id: makePhotoId(),
        kind: "existing",
        url,
      })),
    );
  }, [mode, moment]);

  async function uploadPhotosToS3(): Promise<string[]> {
    const newPhotos = photos.filter((p) => p.kind === "new");
    if (newPhotos.length === 0) return [];

    const formData = new FormData();
    newPhotos.forEach((p) => formData.append("files", p.file));

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Failed to upload photos:", data);
      return [];
    }

    return data?.image_keys ?? [];
  }

  async function handleMomentSubmit() {
    const existingKeys =
      mode === "edit"
        ? photos
            .filter((p) => p.kind === "existing")
            .map((p) => {
              try {
                const url = new URL(p.url);
                const path = url.pathname.replace(/^\/+/, "");
                const [, ...rest] = path.split("/");
                return rest.join("/");
              } catch {
                return "";
              }
            })
            .filter((key) => key.length > 0)
        : [];

    const newKeys = await uploadPhotosToS3();

    const image_keys = [...existingKeys, ...newKeys];

    const payload: Payload = {
      emotion: selectedEmotion,
      note: note.trim() ? note.trim() : null,
      image_keys,
    };

    await onSubmit(payload);

    photos.forEach((photo) => {
      if (photo.kind === "new") {
        URL.revokeObjectURL(photo.previewUrl);
      }
    });

    setPhotos([]);
    router.replace("/moments");
  }

  return (
    <main className="ml-80 mr-80 flex flex-col gap-2">
      <h1>{mode === "record" ? "Witnessing the Now" : "Modify Moment"}</h1>
      <label>Current Resonance</label>

      {/*  Select emotion */}
      <div className="mood-grid">
        {Emotions.map((emo) => (
          <button
            className={`mood-button ${
              selectedEmotion === emo.key ? "active" : ""
            }`}
            key={emo.key}
            onClick={() => setSelectedEmotion(emo.key)}
          >
            {emo.label}
          </button>
        ))}
      </div>

      {/* Note section - optional */}
      <div className="note-section">
        <label>Ephemeral Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your thoughts..."
          rows={4}
          className="note-textarea"
        />
      </div>

      {/* Fragment section - optional */}
      <label>Visual Fragments</label>
      <div className="fragment-upload-area">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (!e.target.files) return;

            const newFiles = Array.from(e.target.files);

            setPhotos((prev) => {
              const MAX_PHOTOS = 4;
              const remaining = MAX_PHOTOS - prev.length;
              if (remaining <= 0) return prev;

              const acceptedFiles = newFiles.slice(0, remaining);

              return [
                ...(prev ?? []),
                ...acceptedFiles.map((file) => {
                  const id = makePhotoId();
                  return {
                    id,
                    kind: "new" as const,
                    file,
                    previewUrl: URL.createObjectURL(file),
                  };
                }),
              ];
            });
            e.target.value = "";
          }}
          className="fragment-input"
          id="fragment-input"
        />
        <Masonry
          breakpointCols={{
            default: 4,
            1024: 2,
            640: 1,
          }}
          className="masonry-grid"
          columnClassName="masonry-column"
        >
          {photos?.map((photo) => (
            <div key={photo.id} className="masonry-item">
              <img
                src={photo.kind === "existing" ? photo.url : photo.previewUrl}
                alt={`fragment-${photo.id}`}
                className="fragment-preview"
              />
              <button
                className="fragment-delete-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPhotos((prev) => {
                    const deleted = prev?.find((p) => p.id === photo.id);
                    if (deleted?.kind === "new")
                      URL.revokeObjectURL(deleted.previewUrl); // Free up memory
                    return prev?.filter((p) => p.id !== photo.id);
                  });
                }}
                aria-label="Delete photo"
              >
                x
              </button>
            </div>
          ))}
          {photos.length < 4 && (
            <label htmlFor="fragment-input" className="masonry-add-item">
              <span className="fragment-label-text">ATTACH FRAGMENT</span>
            </label>
          )}
        </Masonry>
      </div>
      <div className="flex gap-4 justify-center mt-8">
        <button className="submit-button" onClick={handleMomentSubmit}>
          KEEP AS MOMENT
        </button>
        <button className="submit-button submit-button--dark">
          SEAL INTO VAULT
        </button>
      </div>
      <button>
        <p className="discard-entry">DISCARD ENTRY</p>
      </button>
    </main>
  );
}
