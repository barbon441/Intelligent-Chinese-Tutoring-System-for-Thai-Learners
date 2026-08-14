"use client";

// อ่านออกเสียงจีนด้วยเสียงสังเคราะห์ของเบราว์เซอร์ (Web Speech API) — ไม่ต้องมีไฟล์เสียง ไม่ต้องมี backend
//
// ใช้เฉพาะหน้าจอ mock (pre-test / ข้อสอบเสมือนจริง) ที่ยังไม่มีไฟล์เสียงของตัวเอง
// หน้าจริง (บัตรคำ / ฝึกฟัง / ควิซ) ยังใช้ไฟล์เสียงที่อัดไว้ใน Supabase Storage เหมือนเดิม — คุณภาพดีกว่า
//
// ข้อจำกัด: เครื่องที่ไม่มีเสียงภาษาจีนติดตั้งจะอ่านไม่ได้ → คืน false ให้หน้าจอไปบอกผู้ใช้เอง

export function hasChineseVoice(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  return window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith("zh"));
}

/**
 * บอกว่ามีเสียงจีนให้ใช้ไหม — ต้องผ่าน callback เพราะ Chrome โหลดรายชื่อเสียงแบบไม่พร้อมกับหน้า
 * (เรียก getVoices() ตอนเปิดหน้าครั้งแรกมักได้ [] แล้วค่อยยิง event voiceschanged ตามมา)
 * คืนฟังก์ชันสำหรับเลิกฟัง — เอาไปใช้เป็น cleanup ของ useEffect ได้ตรง ๆ
 */
export function onVoicesReady(cb: (hasZh: boolean) => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    queueMicrotask(() => cb(false));
    return () => {};
  }
  const check = () => cb(hasChineseVoice());
  if (window.speechSynthesis.getVoices().length > 0) queueMicrotask(check);
  window.speechSynthesis.addEventListener("voiceschanged", check);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", check);
}

export function speakZh(text: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("zh"));
  if (!voice) return false;

  window.speechSynthesis.cancel(); // กันเสียงข้อก่อนทับข้อใหม่
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.85; // ช้ากว่าปกติเล็กน้อย — ผู้เรียนเริ่มต้นตามทัน
  window.speechSynthesis.speak(u);
  return true;
}
