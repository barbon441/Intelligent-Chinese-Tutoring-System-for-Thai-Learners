"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  const [status, setStatus] = useState<string>("ยังไม่ได้เช็ก");
  const [loading, setLoading] = useState(false);

  async function checkApi() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      setStatus(`✅ API ตอบกลับ: ${JSON.stringify(data)}`);
    } catch {
      setStatus("❌ ต่อ API ไม่ได้ (ตรวจว่า FastAPI รันอยู่ที่ " + API_URL + ")");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-sky-50 to-pink-50 p-8 text-slate-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-sky-800">
          จีนรู้ใจ <span className="text-pink-500">中文知心</span>
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          ติวเตอร์เตรียมสอบ HSK 1–2 อัจฉริยะสำหรับคนไทย
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="font-semibold">สถานะระบบ (scaffold)</h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          <li>🌐 Frontend: Next.js + Tailwind — ทำงานอยู่ (หน้านี้)</li>
          <li>⚙️ Backend: FastAPI — {status}</li>
        </ul>
        <button
          onClick={checkApi}
          disabled={loading}
          className="mt-4 w-full rounded-xl bg-sky-700 px-4 py-2 font-medium text-white transition hover:bg-sky-800 disabled:opacity-50"
        >
          {loading ? "กำลังเช็ก..." : "เช็กการเชื่อมต่อ API"}
        </button>
      </div>

      <a
        href="/flashcards"
        className="rounded-xl bg-pink-500 px-6 py-3 font-medium text-white shadow-lg transition hover:bg-pink-600"
      >
        🃏 เปิดบัตรคำ HSK 1 (300 คำ)
      </a>

      <p className="text-xs text-slate-400">
        M3 · คลังคำศัพท์ + บัตรคำ (ดู docs/08_สเปค-พัฒนา/PRD.md)
      </p>
    </main>
  );
}
