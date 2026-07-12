"""scripts/generate_audio.py — pre-generate เสียงคำศัพท์ด้วย edge-tts (จะเขียนจริงใน M2)

pipeline: data/wordlist/*.json → edge-tts (zh-CN) → mp3 → Supabase Storage (bucket: audio)
ดู docs/08_สเปค-พัฒนา/ARCHITECTURE.md §6
"""
