"use client";

// เมนูในหมวด — ชั้น "เลือกทักษะ" ตามกฎ PA-10: เลือกหมวด → เลือกกิจกรรม → ค่อยเข้าฝึก
// ลำดับแนะนำ: บัตรคำ → ฟัง → อ่าน → เขียน ("หูมาก่อนตา") แต่กดข้ามได้ทุกปุ่ม ไม่ล็อก

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon, type IconName } from "@/components/Icon";
import { CATEGORIES } from "@/data/categories";
import { loadCards } from "@/lib/fsrs";

export default function CategoryMenu() {
  const [cat, setCat] = useState<number | null>(null);
  const [ids, setIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState<Set<number>>(new Set());

  useEffect(() => {
    const c = Number(new URLSearchParams(window.location.search).get("cat")) || null;
    setCat(c);
    setStarted(new Set(Object.keys(loadCards()).map(Number)));
    if (!c) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("words").select("id").eq("hsk_level", 1).eq("category", c);
      setIds((data ?? []).map((r) => r.id));
      setLoading(false);
    })();
  }, []);

  const meta = CATEGORIES.find((c) => c.id === cat);
  const learned = useMemo(() => ids.filter((id) => started.has(id)).length, [ids, started]);
  const pct = ids.length ? Math.round((learned / ids.length) * 100) : 0;

  if (loading) return <Center>กำลังโหลด...</Center>;
  if (!cat || !meta) return <Center>ไม่พบหมวดนี้ — <Link href="/" className="ml-1 text-ink-500 underline">กลับไปเลือกหมวด</Link></Center>;

  return (
    <div className="flex flex-col gap-4 p-5">
      {/* หัวหมวด */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
          <Icon name="arrowLeft" className="h-3.5 w-3.5" /> ทุกหมวด
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink-50 text-ink-700">
            <Icon name={meta.icon} className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-slate-700">หมวด {meta.id} · {meta.name}</h1>
            <p className="text-xs text-slate-400">{meta.desc}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-correct transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-xs text-slate-400">เรียนแล้ว {learned}/{ids.length} คำ</span>
        </div>
      </div>

      {/* เมนูกิจกรรม — เรียงตามลำดับแนะนำ แต่กดอะไรก่อนก็ได้ */}
      <ActivityCard
        href={`/flashcards?cat=${cat}`}
        icon="cards"
        title="เรียนคำศัพท์"
        desc="เปิดบัตรคำทีละใบ ฟังเสียง พลิกดูคำแปล"
        badge={learned === 0 ? "เริ่มที่นี่" : undefined}
        primary
      />
      <ActivityCard
        href={`/practice?cat=${cat}&mode=listen`}
        icon="headphone"
        title="ฝึกฟัง"
        desc="ฟังเสียงแล้วเลือกคำที่ได้ยิน"
      />
      <ActivityCard
        href={`/practice?cat=${cat}&mode=read`}
        icon="book"
        title="ฝึกอ่าน"
        desc="อ่านคำจีนแล้วเลือกคำแปลที่ถูก"
      />
      <ActivityCard
        href="/practice?mode=order"
        icon="puzzle"
        title="ฝึกเรียงประโยค"
        desc="ลากคำมาเรียงเป็นประโยค (ชุดประโยครวม — ยังไม่แยกหมวด)"
      />
      {/* ควิซท้ายหมวด — กำลังสร้าง (ส.ค.) */}
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 opacity-70">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400">
          <Icon name="target" className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="font-medium text-slate-500">ควิซท้ายหมวด</div>
          <div className="text-xs text-slate-400">สอบย่อย 10 ข้อ วัดว่าหมวดนี้แน่นหรือยัง · เร็ว ๆ นี้</div>
        </div>
      </div>

      <p className="mt-1 text-center text-xs leading-relaxed text-slate-400">
        แนะนำ: เรียนคำศัพท์ก่อน แล้วค่อยฝึกฟัง → อ่าน · แต่เลือกแบบไหนก่อนก็ได้ตามสะดวก
      </p>
    </div>
  );
}

function ActivityCard({
  href,
  icon,
  title,
  desc,
  badge,
  primary = false,
}: {
  href: string;
  icon: IconName;
  title: string;
  desc: string;
  badge?: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition active:scale-[0.99] ${
        primary ? "border-ink-200 bg-ink-50/50 hover:border-ink-400" : "border-slate-100 bg-white hover:border-ink-300 hover:shadow-sm"
      }`}
    >
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${primary ? "bg-ink-700 text-white" : "bg-ink-50 text-ink-700"}`}>
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          {title}
          {badge && <span className="rounded-md bg-seal px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
        </div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-slate-300" />
    </Link>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center text-slate-600">{children}</div>;
}
