"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Emotions from "../data/emotions.json";
import Masonry from "react-masonry-css";
import "../globals.css";
import "./record.css";

type PhotoItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function makePhotoId(): string {
  const id = crypto.randomUUID();
  return `photo-${id}`;
}

export default function Record() {
  const router = useRouter();
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  async function uploadPhotosToS3() {
    if (!photos || photos.length === 0) return;

    const formData = new FormData();

    photos.forEach((photo) => {
      formData.append("files", photo.file);
    });

    const res = await fetch("http://localhost:3001/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const data = await res.json();
    console.log("upload response:", data);

    if (data?.image_keys && data.image_keys.length > 0) {
      return data.image_keys;
    }

    if (!res.ok) {
      console.error("Failed to upload photos:", data);
      return [];
    }
  }

  async function handleMomentSubmit() {
    const image_keys = await uploadPhotosToS3();

    const res = await fetch("http://localhost:3001/api/moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important: include cookies for authentication
      body: JSON.stringify({
        emotion: selectedEmotion,
        note: note.trim() ? note.trim() : null,
        image_keys: image_keys,
      }),
    });

    console.log("status:", res.status);
    const data = await res.json();
    console.log("response data:", data);

    if (!res.ok) {
      console.error("Failed to create moment:", data);
      return;
    }

    photos.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl);
    });
    router.replace("/moments");
    setPhotos([]);
  }

  function handleDiscardEntry() {
    router.replace("/home");
  }

  return (
    <main className="ml-80 mr-80 flex flex-col gap-2">
      <h1>Witnessing the Now</h1>
      <label>Current Resonance</label>

      {/*  Select emotion */}
      <div className="mood-grid">
        {Emotions.map((emo) => (
          <button
            key={emo.key}
            onClick={() => setSelectedEmotion(emo.key)}
            className={`mood-button ${
              selectedEmotion === emo.key ? "active" : ""
            }`}
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
                ...prev,
                ...acceptedFiles.map((file) => {
                  const id = makePhotoId();
                  return {
                    id,
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
          {photos.map((photo) => (
            <div key={photo.id} className="masonry-item">
              <img
                src={photo.previewUrl}
                alt={`fragment-${photo.id}`}
                className="fragment-preview"
              />
              <button
                className="fragment-delete-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPhotos((prev) => {
                    const deleted = prev.find((p) => p.id === photo.id);
                    if (deleted) URL.revokeObjectURL(deleted.previewUrl); // Free up memory
                    return prev.filter((p) => p.id !== photo.id);
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
        <button
          className="submit-button submit-button--dark"
          onClick={handleMomentSubmit}
        >
          SEAL INTO VAULT
        </button>
      </div>
      <button onClick={handleDiscardEntry}>
        <p className="discard-entry">DISCARD ENTRY</p>
      </button>
    </main>
  );
}
