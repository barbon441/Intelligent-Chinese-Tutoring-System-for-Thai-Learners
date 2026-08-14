// สถานะกลางที่ใช้ร่วมทุกหน้า (เดิมก๊อปกัน 4 ไฟล์แล้วเริ่ม drift — รวมที่เดียว)
// กติกา: ภาษาคน ไม่โชว์ error ดิบ (PA-13/MO-03) · ไม่ใช้อิโมจิ ใช้ Icon เส้น

import Link from "next/link";
import { Icon } from "@/components/Icon";

export function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center text-slate-600">{children}</div>;
}

export function ErrorState({ detail }: { detail?: string }) {
  if (detail) console.error("โหลดข้อมูลไม่สำเร็จ:", detail);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-coral-soft text-coral">
        <Icon name="x" className="h-8 w-8" strokeWidth={2.4} />
      </div>
      <div>
        <div className="font-semibold text-slate-700">โหลดข้อมูลไม่สำเร็จ</div>
        <p className="mt-1 text-sm text-slate-400">ลองเช็กอินเทอร์เน็ตแล้วกดลองใหม่อีกครั้ง</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-ocean-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-900 active:scale-95"
        >
          ลองใหม่
        </button>
        <Link href="/" className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200">
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
