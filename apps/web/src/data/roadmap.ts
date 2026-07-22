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
  items: { label: string; status: ItemStatus; note?: string }[];
};

export const ROADMAP: RoadmapModule[] = [
  {
    id: "m0",
    icon: "speaker",
    title: "โมดูล 0 · พื้นฐานเสียง",
    desc: "ทำครั้งเดียวก่อนเข้าหมวดแรก — วรรณยุกต์คือรากของทุกทักษะ",
    items: [
      { label: "หน้าเรียนพินอิน + วรรณยุกต์ 4 เสียง (กราฟเส้นเสียง + พินอินสี)", status: "aug" },
      { label: "ฝึกหูแยกคู่เสียง 2/3 (minimal pair — จุดพลาดอันดับ 1 ของคนไทย)", status: "aug" },
      { label: "ฝึกหูแยก zh/ch/sh (เสียงม้วนลิ้นที่ไทยไม่มี)", status: "aug" },
    ],
  },
  {
    id: "m1",
    icon: "cards",
    title: "โมดูล 1 · เรียนตามหมวด (8 หมวด)",
    desc: "ทักทาย → ตัวเลข/เวลา → ครอบครัว → อาหาร → เรียน/ทำงาน → เดินทาง → ซื้อของ → ชีวิตประจำวัน",
    items: [
      { label: "บัตรคำ 300 คำ: ฮั่นจื้อ + พินอินสีวรรณยุกต์ + เสียง + คำแปล (ตรวจครบ)", status: "done" },
      { label: "จัดคำ 300 คำลง 8 หมวด (AI ร่าง → ผู้ตรวจภาษาจีนตรวจ)", status: "doing" },
      { label: "หน้าเลือกหมวด + ความคืบหน้ารายหมวด", status: "aug" },
      { label: "ประโยคตัวอย่าง 5-10 ประโยค/หมวด พร้อมเสียง", status: "aug" },
      { label: "รูปภาพประกอบคำศัพท์", status: "aug" },
      { label: "ปุ่มซ่อน/โชว์พินอิน (ฝึกหย่าพินอินทีละขั้น)", status: "aug" },
    ],
  },
  {
    id: "m2",
    icon: "pencil",
    title: "โมดูล 2 · ฝึกทักษะ ฟัง/อ่าน/เขียน",
    desc: "ทุกข้อตรวจด้วยกติกาเทียบเฉลย (rule-based) — ไม่ใช้ AI เดา",
    items: [
      { label: "ฝึกอ่าน: เห็นคำ → เลือกคำแปล (MCQ)", status: "done" },
      { label: "ฝึกฟัง: ฟังเสียง → เลือกคำ (MCQ)", status: "done" },
      { label: "เขียนระดับ 1: เรียงคำเป็นประโยค (ลาก/แตะ + เฉลย + โน้ตไวยากรณ์)", status: "done" },
      { label: "ข้อแบบรูปภาพ: ฟัง/อ่าน → เลือกรูป, จริง/เท็จกับรูป", status: "aug" },
      { label: "เติมคำจาก word bank + จับคู่คำถาม-คำตอบ (ฟอร์แมตข้อสอบจริง)", status: "aug" },
      { label: "ฟังบทสนทนา → ตอบคำถาม (โจทย์มาทางเสียงเท่านั้น)", status: "aug" },
      { label: "ปุ่มปรับความเร็วเสียง (0.75x–1x) + สลับเสียงชาย/หญิง", status: "aug" },
    ],
  },
  {
    id: "m3",
    icon: "check",
    title: "โมดูล 3 · ควิซท้ายหมวด",
    desc: "จบหมวด → สอบย่อย → ได้ % รายหมวด + เริ่มเก็บข้อมูลการตอบ",
    items: [
      { label: "ควิซรวม 3 ทักษะท้ายหมวด (ฟอร์แมต HSK)", status: "aug" },
      { label: "บันทึกทุกการตอบขึ้นฐานข้อมูล (user/ทักษะ/ถูก-ผิด/เวลา)", status: "aug" },
    ],
  },
  {
    id: "m4",
    icon: "refresh",
    title: "โมดูล 4 · ทบทวนอัจฉริยะ (FSRS)",
    desc: "ทวนคำ 'ตอนกำลังจะลืมพอดี' — คิววันละ ~10-20 คำตาม pacing จริง",
    items: [
      { label: "คิว 'ทวนวันนี้' คำนวณจากสถานะความจำรายการ์ด (FSRS v6)", status: "done" },
      { label: "ปุ่มให้คะแนน 4 ระดับ + โชว์ช่วงเวลาทวนครั้งถัดไปจริง", status: "done" },
      { label: "sync ความคืบหน้าข้ามเครื่อง (มาพร้อมระบบสมาชิก)", status: "sep" },
    ],
  },
  {
    id: "m5",
    icon: "flask",
    title: "โมดูล 5 · Mock Exam + Pre-test",
    desc: "เสาหลักของแอปติว — ตอบคำถาม 'พร้อมสอบหรือยัง' ด้วยเกณฑ์จริง",
    items: [
      { label: "Pre-test วัดระดับตอนเริ่มใช้ (= baseline ของ pre/post)", status: "aug" },
      { label: "Mock Exam HSK1 เต็มชุดตามโครงข้อสอบจริง + จับเวลา", status: "sep" },
      { label: "โหมดสนามสอบ: เสียงเล่น 2 รอบ · ห้ามหยุด · ไม่โชว์ข้อความที่ให้ฟัง", status: "sep" },
      { label: "ใบรายงานผล: สเกล 200 ผ่าน 120 + คะแนนรายทักษะ", status: "sep" },
    ],
  },
  {
    id: "m6",
    icon: "chart",
    title: "โมดูล 6 · ผลการเรียน",
    desc: "จาก % ธรรมดา → ความแม่นรายทักษะด้วย Knowledge Tracing",
    items: [
      { label: "หน้าผลรุ่นแรก: ความแม่น + ประวัติฝึก + streak", status: "done" },
      { label: "ความแม่นรายทักษะจาก pyBKT (อัปเดตทุกการตอบ)", status: "sep" },
      { label: "ตัวเลข 'ความพร้อมสอบ HSK1 ~X%' + เทียบเกณฑ์ 120/200", status: "sep" },
      { label: "จุดอ่อน Thai-L1 ที่วินิจฉัยได้ + ปุ่มเจาะฝึกซ้ำ", status: "sep" },
    ],
  },
  {
    id: "m7",
    icon: "user",
    title: "โมดูล 7 · Member + Admin",
    desc: "requirement จากอาจารย์ — แยกบทบาทผู้เรียน/ผู้ดูแล",
    items: [
      { label: "สมัครสมาชิก/ล็อกอิน (เก็บ progress รายคน)", status: "aug" },
      { label: "Admin: เพิ่ม/ลบ/แก้คำศัพท์และบทเรียน", status: "aug" },
      { label: "Admin: จัดการคลังข้อสอบ + ขั้นอนุมัติ (ทุกข้อผ่านผู้ตรวจภาษาจีน)", status: "aug" },
    ],
  },
  {
    id: "m8",
    icon: "target",
    title: "โมดูล 8 · สมองเบื้องหลัง (จุดต่างของเรา)",
    desc: "วินิจฉัยจุดผิดเฉพาะคนไทย + วัดความแม่นด้วยข้อมูลคนไทย",
    items: [
      { label: "คลังจุดผิดคนไทย 15 จุด (วรรณยุกต์/ม้วนลิ้น/ไวยากรณ์) + งานวิจัยรองรับ", status: "done" },
      { label: "Q-matrix: ผูกข้อสอบทุกข้อเข้ากับทักษะที่วัด", status: "sep" },
      { label: "pyBKT: คำนวณความแม่นรายทักษะจากประวัติการตอบ", status: "sep" },
      { label: "ตอบผิด → บอกสาเหตุแบบคนไทย + จ่ายแบบฝึกเจาะจุดอ่อน", status: "sep" },
    ],
  },
  {
    id: "m9",
    icon: "sparkles",
    title: "เฟสถัดไป · HSK 2 + ของเสริม",
    desc: "ขยายหลังโครง HSK1 นิ่ง (มาตรฐาน 3.0: +200 คำ)",
    items: [
      { label: "คลังคำ HSK2 (+200 คำ แยกชุดหมวดใหม่)", status: "hsk2" },
      { label: "ข้อความสั้น → ตอบคำถาม (ระดับอ่าน HSK2)", status: "hsk2" },
      { label: "จำลองพาร์ตเขียน 书写: พินอิน → เลือก/พิมพ์อักษร (ลิสต์ 100 ตัว)", status: "hsk2" },
      { label: "ฝึกเขียนตามลำดับขีด (Hanzi Writer) — challenge จากอาจารย์", status: "opt" },
    ],
  },
];
