import AppShell from "@/components/AppShell";

// กลุ่มหน้า "ตัวแอปผู้เรียน" — ครอบด้วย AppShell (header + เมนูล่าง, จอมือถือ max-w-md)
// หน้าที่อยู่นอกกลุ่มนี้ (เช่น /roadmap) = เต็มจออิสระ
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
