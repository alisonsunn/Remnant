"use client";

import { useState } from "react";
import Emotions from "../data/emotions.json";
import "../globals.css";
import "./record.css";

export default function Record() {
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [image_key, setImageKey] = useState<string | null>(null);

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
      credentials: "include", // Important: include cookies for authentication
      body: JSON.stringify({
        emotion: selectedEmotion,
        note: note.trim() ? note.trim() : null,
        image_key: image_key,
      }),
    });

    console.log("status:", res.status);
    const data = await res.json();
    console.log("response data:", data);

    if (!res.ok) {
      console.error("Failed to create moment:", data);
    }
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
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="fragment-input"
          id="fragment-input"
        />
        <label htmlFor="fragment-input" className="fragment-label">
          {photo ? photo.name : "ATTACH FRAGMENT"}
        </label>
      </div>
      {photo && (
        <button onClick={uploadPhoto} className="upload-button">
          Upload photo
        </button>
      )}
      <button onClick={handleMomentSubmit}>Keep as moment</button>
    </main>
  );
}
