// ระดับของการเดินทาง — UI ทุกหน้าอ่านจากตรงนี้ ไม่ hardcode ชื่อระดับในหน้าจอ
// เพิ่ม HSK 3–6 ในอนาคต = เพิ่มแถวในอาร์เรย์นี้ ไม่ต้องแตะหน้าไหน
//
// available = "มีเนื้อหาให้เรียนจริงแล้วหรือยัง" — ไม่ใช่การล็อกผู้เรียน
// ตอนนี้มีจริงแค่ HSK 1 (คลังคำ 300 คำใน Supabase) · Foundation กับ HSK 2 ยังเป็นเส้นทางข้างหน้า

export type LevelId = "foundation" | "hsk1" | "hsk2";

export type Level = {
  id: LevelId;
  name: string; // ชื่อที่โชว์บนจอ
  zh: string; // ป้ายจีนคู่กัน
  desc: string;
  available: boolean;
};

export const LEVELS: Level[] = [
  {
    id: "foundation",
    name: "ปูพื้นฐานเสียง",
    zh: "拼音",
    desc: "พินอินเทียบเสียงไทย · วรรณยุกต์ · เกมฝึกหู",
    available: false,
  },
  {
    id: "hsk1",
    name: "HSK 1",
    zh: "一级",
    desc: "300 คำ · ข้อสอบฟัง + อ่าน",
    available: true,
  },
  {
    id: "hsk2",
    name: "HSK 2",
    zh: "二级",
    desc: "เส้นทางใหม่ที่รออยู่ข้างหน้า",
    available: false,
  },
];

export function getLevel(id: LevelId): Level {
  return LEVELS.find((l) => l.id === id)!;
}
