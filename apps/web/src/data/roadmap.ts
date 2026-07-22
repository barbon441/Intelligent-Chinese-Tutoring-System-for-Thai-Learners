// ข้อมูลหน้า /roadmap — ตาราง checklist โมดูล/ฟังก์ชันของระบบ (โชว์อาจารย์ทุกนัดจันทร์)
// source of truth คู่กัน: docs/08_สเปค-พัฒนา/กรอบระบบ-CHECKLIST.md — อัปเดตสถานะที่นี่เมื่องานคืบ
import type { IconName } from "@/components/Icon";

export type ItemStatus = "done" | "doing" | "aug" | "sep" | "hsk2" | "opt";

export const STATUS_META: Record<ItemStatus, { label: string; cls: string }> = {
  done: { label: "เสร็จแล้ว", cls: "bg-emerald-50 text-correct border-emerald-200" },
  doing: { label: "กำลังทำ", cls: "bg-ink-50 text-ink-700 border-ink-100" },
  aug: { label: "คิว ส.ค.", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  sep: { label: "ก.ย.–ต.ค.", cls: "bg-slate-100 text-slate-500 border-slate-200" },
  hsk2: { label: "เฟส HSK2", cls: "bg-slate-100 text-slate-400 border-slate-200" },
  opt: { label: "Optional", cls: "bg-seal-soft text-seal border-seal/30" },
};

export type RoadmapModule = {
  id: string;
  icon: IconName;
  title: string;
  desc: string;
  items: { id: string; label: string; status: ItemStatus; note?: string }[];
};

export const ROADMAP: RoadmapModule[] = [
  {
    id: "m0",
    icon: "speaker",
    title: "โมดูล 0 · พื้นฐานเสียง",
    desc: "ทำครั้งเดียวก่อนเข้าหมวดแรก — วรรณยุกต์คือรากของทุกทักษะ",
    items: [
      { id: "m0-1", label: "หน้าเรียนพินอิน + วรรณยุกต์ 4 เสียง (กราฟเส้นเสียง + พินอินสี)", status: "aug" },
      { id: "m0-2", label: "ฝึกหูแยกคู่เสียง 2/3 (minimal pair — จุดพลาดอันดับ 1 ของคนไทย)", status: "aug" },
      { id: "m0-3", label: "ฝึกหูแยก zh/ch/sh (เสียงม้วนลิ้นที่ไทยไม่มี)", status: "aug" },
    ],
  },
  {
    id: "m1",
    icon: "cards",
    title: "โมดูล 1 · เรียนตามหมวด (8 หมวด)",
    desc: "ทักทาย → ตัวเลข/เวลา → ครอบครัว → อาหาร → เรียน/ทำงาน → เดินทาง → ซื้อของ → ชีวิตประจำวัน",
    items: [
      { id: "m1-1", label: "บัตรคำ 300 คำ: ฮั่นจื้อ + พินอินสีวรรณยุกต์ + เสียง + คำแปล (ตรวจครบ)", status: "done" },
      { id: "m1-2", label: "จัดคำ 300 คำลง 8 หมวด (AI ร่าง → ผู้ตรวจภาษาจีนตรวจ)", status: "doing" },
      { id: "m1-3", label: "หน้าเลือกหมวด + ความคืบหน้ารายหมวด", status: "aug" },
      { id: "m1-4", label: "ประโยคตัวอย่าง 5-10 ประโยค/หมวด พร้อมเสียง", status: "aug" },
      { id: "m1-5", label: "รูปภาพประกอบคำศัพท์", status: "aug" },
      { id: "m1-6", label: "ปุ่มซ่อน/โชว์พินอิน (ฝึกหย่าพินอินทีละขั้น)", status: "aug" },
    ],
  },
  {
    id: "m2",
    icon: "pencil",
    title: "โมดูล 2 · ฝึกทักษะ ฟัง/อ่าน/เขียน",
    desc: "ทุกข้อตรวจด้วยกติกาเทียบเฉลย (rule-based) — ไม่ใช้ AI เดา",
    items: [
      { id: "m2-1", label: "ฝึกอ่าน: เห็นคำ → เลือกคำแปล (MCQ)", status: "done" },
      { id: "m2-2", label: "ฝึกฟัง: ฟังเสียง → เลือกคำ (MCQ)", status: "done" },
      { id: "m2-3", label: "เขียนระดับ 1: เรียงคำเป็นประโยค (ลาก/แตะ + เฉลย + โน้ตไวยากรณ์)", status: "done" },
      { id: "m2-4", label: "ข้อแบบรูปภาพ: ฟัง/อ่าน → เลือกรูป, จริง/เท็จกับรูป", status: "aug" },
      { id: "m2-5", label: "เติมคำจาก word bank + จับคู่คำถาม-คำตอบ (ฟอร์แมตข้อสอบจริง)", status: "aug" },
      { id: "m2-6", label: "ฟังบทสนทนา → ตอบคำถาม (โจทย์มาทางเสียงเท่านั้น)", status: "aug" },
      { id: "m2-7", label: "ปุ่มปรับความเร็วเสียง (0.75x–1x) + สลับเสียงชาย/หญิง", status: "aug" },
    ],
  },
  {
    id: "m3",
    icon: "check",
    title: "โมดูล 3 · ควิซท้ายหมวด",
    desc: "จบหมวด → สอบย่อย → ได้ % รายหมวด + เริ่มเก็บข้อมูลการตอบ",
    items: [
      { id: "m3-1", label: "ควิซรวม 3 ทักษะท้ายหมวด (ฟอร์แมต HSK)", status: "aug" },
      { id: "m3-2", label: "บันทึกทุกการตอบขึ้นฐานข้อมูล (user/ทักษะ/ถูก-ผิด/เวลา)", status: "aug" },
    ],
  },
  {
    id: "m4",
    icon: "refresh",
    title: "โมดูล 4 · ทบทวนอัจฉริยะ (FSRS)",
    desc: "ทวนคำ 'ตอนกำลังจะลืมพอดี' — คิววันละ ~10-20 คำตาม pacing จริง",
    items: [
      { id: "m4-1", label: "คิว 'ทวนวันนี้' คำนวณจากสถานะความจำรายการ์ด (FSRS v6)", status: "done" },
      { id: "m4-2", label: "ปุ่มให้คะแนน 4 ระดับ + โชว์ช่วงเวลาทวนครั้งถัดไปจริง", status: "done" },
      { id: "m4-3", label: "sync ความคืบหน้าข้ามเครื่อง (มาพร้อมระบบสมาชิก)", status: "sep" },
    ],
  },
  {
    id: "m5",
    icon: "flask",
    title: "โมดูล 5 · Mock Exam + Pre-test",
    desc: "เสาหลักของแอปติว — ตอบคำถาม 'พร้อมสอบหรือยัง' ด้วยเกณฑ์จริง",
    items: [
      { id: "m5-5", label: "แบบสอบถามก่อนเรียน: ระดับที่จะสอบ/เหลือกี่วัน/เวลาต่อวัน/มีพื้นไหม → สร้างแผนเรียนส่วนตัว + นับถอยหลังวันสอบ", status: "aug" },
      { id: "m5-1", label: "Placement สั้น ~10-15 ข้อ (เฉพาะคนมีพื้น — คนเริ่มจาก 0 ข้ามได้ ไม่บังคับสอบ)", status: "aug" },
      { id: "m5-2", label: "Mock Exam HSK1 เต็มชุดตามโครงข้อสอบจริง + จับเวลา", status: "sep" },
      { id: "m5-3", label: "โหมดสนามสอบ: เสียงเล่น 2 รอบ · ห้ามหยุด · ไม่โชว์ข้อความที่ให้ฟัง", status: "sep" },
      { id: "m5-4", label: "ใบรายงานผล: สเกล 200 ผ่าน 120 + คะแนนรายทักษะ", status: "sep" },
    ],
  },
  {
    id: "m6",
    icon: "chart",
    title: "โมดูล 6 · ผลการเรียน",
    desc: "จาก % ธรรมดา → ความแม่นรายทักษะด้วย Knowledge Tracing",
    items: [
      { id: "m6-1", label: "หน้าผลรุ่นแรก: ความแม่น + ประวัติฝึก + streak", status: "done" },
      { id: "m6-2", label: "ความแม่นรายทักษะจาก pyBKT (อัปเดตทุกการตอบ)", status: "sep" },
      { id: "m6-3", label: "ตัวเลข 'ความพร้อมสอบ HSK1 ~X%' + เทียบเกณฑ์ 120/200", status: "sep" },
      { id: "m6-4", label: "จุดอ่อน Thai-L1 ที่วินิจฉัยได้ + ปุ่มเจาะฝึกซ้ำ", status: "sep" },
    ],
  },
  {
    id: "m7",
    icon: "user",
    title: "โมดูล 7 · Member + Admin",
    desc: "requirement จากอาจารย์ — แยกบทบาทผู้เรียน/ผู้ดูแล",
    items: [
      { id: "m7-1", label: "สมัครสมาชิก/ล็อกอิน (เก็บ progress รายคน)", status: "aug" },
      { id: "m7-2", label: "Admin: เพิ่ม/ลบ/แก้คำศัพท์และบทเรียน", status: "aug" },
      { id: "m7-3", label: "Admin: จัดการคลังข้อสอบ + ขั้นอนุมัติ (ทุกข้อผ่านผู้ตรวจภาษาจีน)", status: "aug" },
    ],
  },
  {
    id: "m8",
    icon: "target",
    title: "โมดูล 8 · สมองเบื้องหลัง (จุดต่างของเรา)",
    desc: "วินิจฉัยจุดผิดเฉพาะคนไทย + วัดความแม่นด้วยข้อมูลคนไทย",
    items: [
      { id: "m8-1", label: "คลังจุดผิดคนไทย 15 จุด (วรรณยุกต์/ม้วนลิ้น/ไวยากรณ์) + งานวิจัยรองรับ", status: "done" },
      { id: "m8-2", label: "Q-matrix: ผูกข้อสอบทุกข้อเข้ากับทักษะที่วัด", status: "sep" },
      { id: "m8-3", label: "pyBKT: คำนวณความแม่นรายทักษะจากประวัติการตอบ", status: "sep" },
      { id: "m8-4", label: "ตอบผิด → บอกสาเหตุแบบคนไทย + จ่ายแบบฝึกเจาะจุดอ่อน", status: "sep" },
    ],
  },
  {
    id: "m9",
    icon: "sparkles",
    title: "เฟสถัดไป · HSK 2 + ของเสริม",
    desc: "ขยายหลังโครง HSK1 นิ่ง (มาตรฐาน 3.0: +200 คำ)",
    items: [
      { id: "m9-1", label: "คลังคำ HSK2 (+200 คำ แยกชุดหมวดใหม่)", status: "hsk2" },
      { id: "m9-2", label: "ข้อความสั้น → ตอบคำถาม (ระดับอ่าน HSK2)", status: "hsk2" },
      { id: "m9-3", label: "จำลองพาร์ตเขียน 书写: พินอิน → เลือก/พิมพ์อักษร (ลิสต์ 100 ตัว)", status: "hsk2" },
      { id: "m9-4", label: "ฝึกเขียนตามลำดับขีด (Hanzi Writer) — challenge จากอาจารย์", status: "opt" },
    ],
  },
];
