"""ค่าคงที่กลางของจีนรู้ใจ (ฝั่ง Python) — ต้องตรงกับ constants.ts เสมอ"""

# เกณฑ์คะแนน HSK (มาตรฐานจริง)
MAX_SCORE = 200
PASS_SCORE = 120

# HSK 3.0 (สะสม) — ห้ามใช้ตัวเลขลิสต์ 2.0 เก่า
HSK_LEVELS = {
    1: {"words": 300, "grammar": 48},
    2: {"words": 500, "grammar": 129},
}

WORDLIST_VERSION = "HSK3.0-v2026.07"

# ประเภทข้อสอบ (ทุกแบบตรวจด้วย rule เทียบเฉลย — ไม่มี LLM ตรวจ)
ITEM_TYPES = ["mcq", "match", "true_false", "pick_pinyin", "listen_pick_image", "word_order"]

# กลุ่มจุดผิด Thai-L1 หลัก (Knowledge Components)
THAI_L1_GROUPS = ["TONE_2_3", "RETROFLEX_ZH_CH_SH_R", "MODIFIER_ORDER"]
