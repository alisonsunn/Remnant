"use client";

import { useState } from "react";
import Emotions from "../data/emotions.json";
import "./record.css";

export default function Record() {
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [image_key, setImageKey] = useState<string | null>(null);
  const DEV_USER_ID = 1;

  async function uploadPhoto() {
    if (!photo) return;

    const formData = new FormData();
    formData.append("file", photo);

    const res = await fetch("http://localhost:3001/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("upload response:", data);

    if (data?.image_key) {
      setImageKey(data.image_key);
    }
  }

  async function handleMomentSubmit() {
    const res = await fetch("http://localhost:3001/api/moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: DEV_USER_ID,
        emotion: selectedEmotion,
        note: note.trim() ? note.trim() : null,
        image_key: image_key,
      }),
    });

    console.log("status:", res.status);
    const data = await res.json();
    console.log("response data:", data);
  }

  return (
    <main className="ml-30 mr-30 flex flex-col gap-6">
      <h1>Witnessing the Now</h1>
      <h2>Current Resonance</h2>

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
        <h2>Ephemeral Note</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a short note...(optional)"
          rows={4}
          className="note-textarea"
        />
      </div>

      {/* Fragment section - optional */}
      <h2>Visual Fragments</h2>
      <div style={{ marginTop: 24 }}>
        <p style={{ marginBottom: 8 }}>Photo (optional)</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />
        <div style={{ marginTop: 8, opacity: 0.7 }}></div>
      </div>
      <button onClick={uploadPhoto} disabled={!photo}>
        Upload photo
      </button>

      <button onClick={handleMomentSubmit}>Keep as moment</button>
    </main>
  );
}
