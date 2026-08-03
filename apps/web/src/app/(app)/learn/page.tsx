// หน้า "เรียน" เดิมถูกยุบรวมเข้าหน้าแรกแล้ว (บอลชี้ว่าซ้ำกัน 2 ส.ค.) — คง route ไว้กันลิงก์เก่าพัง
import { redirect } from "next/navigation";

export default function LearnRedirect() {
  redirect("/");
}
