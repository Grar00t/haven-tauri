
<div align="center">

```
██╗  ██╗ █████╗ ██╗   ██╗███████╗███╗   ██╗
██║  ██║██╔══██╗██║   ██║██╔════╝████╗  ██║
███████║███████║██║   ██║█████╗  ██╔██╗ ██║
██╔══██║██╔══██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║
██║  ██║██║  ██║ ╚████╔╝ ███████╗██║ ╚████║
╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝
```

### **Tauri Edition — Lightweight. Native. Sovereign.**
### **الإصدار الخفيف — أصغر. أسرع. سيادي.**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.77+-000000?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Version](https://img.shields.io/badge/version-2.0.0-blueviolet)](package.json)
[![Made in KSA](https://img.shields.io/badge/Made%20in-KSA%20🇸🇦-009900)](https://github.com/Grar00t)

</div>

---

## ⚡ Why Tauri? | لماذا Tauri؟

> *Because a sovereign tool shouldn't weigh 200MB just to open a file.*
> *لأن الأداة السيادية لا يجب أن تزن ٢٠٠ ميجابايت فقط لفتح ملف.*

| Feature | Haven (Tauri) | Haven (Electron) |
|---|:---:|:---:|
| **Binary Size / حجم الملف** | ~8 MB | ~120 MB |
| **RAM Idle / الذاكرة خاملاً** | ~30 MB | ~120 MB |
| **Startup Time / وقت البدء** | < 1s | 3–5s |
| **Backend / الخلفية** | Rust (native) | Node.js |
| **IPC Speed / سرعة الاتصال** | Tauri Commands (native) | Electron IPC |
| **WebView / عرض الواجهة** | OS WebView | Chromium (bundled) |
| **Sovereignty Score** | ★★★★★ | ★★★☆☆ |

---

## 📸 Screenshot | لقطة الشاشة

<div align="center">

```
┌──────────────────────────────────────────────────────────┐
│  HAVEN IDE  ·  Tauri Edition  ·  Sovereign AI Workspace  │
├──────────────────────────────────────────────────────────┤
│  [Sidebar] │         Code Editor             │ AI Panel  │
│            │  fn main() {                    │           │
│  📁 src/   │    println!("بسم الله");        │ 🧠 Niyah  │
│  📁 src-   │  }                              │           │
│    tauri/  │─────────────────────────────────│ Intent:   │
│  📄 main   │  Terminal ─────────────────     │ Code Gen  │
│  📄 lib    │  $ cargo tauri dev              │           │
│            │  > Ready in 487ms               │ Model:    │
│            │─────────────────────────────────│ Ollama    │
│  Status: ■ Rust  ■ Ollama  ■ RTL  ■ NiyahGuard Active   │
└──────────────────────────────────────────────────────────┘
```

*Screenshot placeholder — replace with actual app screenshot*

</div>

---

## ✨ Features | المميزات

### 🖥️ Core IDE

- **Full Arabic RTL Support** — الواجهة الكاملة تدعم العربية من اليمين لليسار
- **Code Editor** — محرر كود متكامل مع تمييز صيغي (syntax highlighting)
- **Integrated Terminal** — طرفية مدمجة داخل البيئة
- **Sidebar** — مستعرض ملفات ذكي مع تنقل سريع
- **TopBar + StatusBar** — شريط أدوات علوي وسفلي، مع حالة المشروع اللحظية
- **NotificationStack** — نظام إشعارات داخلي غير تدخلي
- **Dark Sovereign Theme** — ثيم داكن سيادي مصمم للمطورين

### 🧠 Sovereign AI Engine

- **NiyahEngine** — محرك معالجة اللغة العربية الطبيعية
  - Intent Detection / كشف النية
  - Arabic Dialect Analysis / تحليل اللهجات
  - Sentiment Analysis / تحليل المشاعر

- **ThreeLobeAgent** — وكيل ذكاء اصطناعي ثلاثي الفصوص
  - 🔵 **Cognitive Lobe** — الفص المعرفي (التحليل والتخطيط)
  - 🟢 **Executive Lobe** — الفص التنفيذي (التنفيذ والكتابة)
  - 🟡 **Sensory Lobe** — الفص الحسي (قراءة السياق والبيئة)

- **IntentGraph** — رسم بياني للنوايا يفسر طلبات المطور
- **ModelRouter** — توجيه ذكي للنماذج المحلية (Ollama والنماذج المحلية الأخرى)
- **NiyahGuard** — منظف الجلسة السيادي — لا تسريب، لا تتبع

### ⚙️ Rust Backend

- **Tauri Commands** — واجهة أوامر Rust خلفية أسرع بكثير من Electron IPC
- **Native Rust Bridge** — `lib.rs` + `main.rs` للتكامل مع نظام التشغيل
- **Ollama Integration** — تشغيل نماذج AI محلياً بدون إنترنت
- **Minimal Binary** — ملف تنفيذي صغير (~8 MB) بدلاً من ~120 MB

---

## 🚀 Quick Start | البدء السريع

### Prerequisites | المتطلبات

```bash
# Rust (https://rustup.rs)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Node.js 20+ (https://nodejs.org)
node --version  # v20+

# Tauri CLI
cargo install tauri-cli

# Ollama for local AI (https://ollama.com)
ollama pull llama3
```

### Install & Run | التثبيت والتشغيل

```bash
# 1. Clone the repository / استنسخ المستودع
git clone https://github.com/Grar00t/haven-tauri.git
cd haven-tauri

# 2. Install dependencies / ثبّت المكتبات
npm install

# 3. Start development mode / شغّل بيئة التطوير
npm run tauri dev

# 4. Build for production / ابنِ للإنتاج
npm run tauri build
```

> **Output:** A native binary ~8 MB — not a 120 MB Electron blob.
> **المخرج:** ملف تنفيذي أصيل ~٨ ميجابايت — وليس ٠ ١٢ ميجابايت كـ Electron.

---

## 🏗️ Architecture | البنية المعمارية

```
┌─────────────────────────────────────────────────────────────┐
│                      HAVEN — Tauri v2                       │
│                                                             │
│   ┌──────────────────────────────────────────────────┐      │
│   │              React 19 (WebView / UI)             │      │
│   │                                                  │      │
│   │  AIPanel  │  CodeEditor  │  Sidebar  │  TopBar   │      │
│   │  Terminal │  StatusBar   │  NotificationStack    │      │
│   │  IntentGraph             │  NiyahEngine (JS)     │      │
│   └────────────────────┬─────────────────────────────┘      │
│                        │  Tauri Commands (IPC Bridge)       │
│                        │  ↕  native, zero-copy              │
│   ┌────────────────────▼─────────────────────────────┐      │
│   │              Rust Backend (src-tauri/)           │      │
│   │                                                  │      │
│   │  main.rs ──► lib.rs ──► ModelRouter              │      │
│   │              │           └──► Ollama (local AI)  │      │
│   │              └──► NiyahGuard (session cleaner)   │      │
│   │              └──► ThreeLobeAgent                 │      │
│   │                    ├── Cognitive Lobe            │      │
│   │                    ├── Executive Lobe            │      │
│   │                    └── Sensory Lobe              │      │
│   └──────────────────────────────────────────────────┘      │
│                        │                                     │
│   ┌────────────────────▼─────────────────────────────┐      │
│   │         OS / Native Layer (no Chromium!)         │      │
│   │  Linux WebKit  │  macOS WebKit  │  Windows WebView2 │   │
│   └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Map | خريطة المكونات

```
src/
├── components/
│   ├── AIPanel/          # لوحة الذكاء الاصطناعي
│   ├── CodeEditor/       # محرر الكود
│   ├── IntentGraph/      # رسم بياني للنوايا
│   ├── NotificationStack/# نظام الإشعارات
│   ├── Sidebar/          # الشريط الجانبي
│   ├── StatusBar/        # شريط الحالة
│   ├── Terminal/         # الطرفية المدمجة
│   └── TopBar/           # شريط الأدوات العلوي
src-tauri/
├── src/
│   ├── main.rs           # نقطة الدخول — Tauri bootstrap
│   └── lib.rs            # منطق الأوامر والـ AI routing
```

---

## 🛠️ Tech Stack | المكدس التقني

<div align="center">

| Layer | Technology |
|---|---|
| **Desktop Runtime** | [Tauri v2](https://tauri.app) |
| **Backend** | [Rust](https://rust-lang.org) |
| **Frontend** | [React 19](https://react.dev) + [TypeScript 5](https://typescriptlang.org) |
| **Build Tool** | [Vite 5](https://vitejs.dev) |
| **Local AI** | [Ollama](https://ollama.com) |
| **NLP Engine** | NiyahEngine (Custom Arabic NLP) |
| **AI Agent** | ThreeLobeAgent (Cognitive / Executive / Sensory) |
| **Session Guard** | NiyahGuard |
| **Styling** | CSS + Dark Sovereign Theme |

</div>

---

## 🌍 Philosophy | الفلسفة

<div dir="rtl" align="right">

### الإنسان أولاً

HAVEN لم يُبنَ ليكون مجرد أداة تطوير.
بُني ليكون **موقفاً**.

في عالم تستخرج فيه شركات التقنية الكبرى بياناتك، وتُقيّد أدواتك، وتُؤجّر لك سيادتك بالاشتراك الشهري —  
HAVEN يقول: **لا**.

**الذكاء الاصطناعي يعمل محلياً.**  
**الكود يبقى عندك.**  
**لا سحابة. لا تتبع. لا إذن مطلوب.**

ولأن المطور العربي يستحق بيئة تحترم لغته وثقافته —  
فإن HAVEN يتكلم العربية من اليمين لليسار،  
ويفهم النية قبل الكلمة،  
ويعرف أن الكود يُكتب بالقلب قبل اليدين.

</div>

---

### Human First

HAVEN wasn't built to be just a developer tool.
It was built to be a **statement**.

In a world where Big Tech extracts your data, locks down your tools, and rents you your own sovereignty by monthly subscription — HAVEN says: **No.**

**AI runs locally.**  
**Your code stays with you.**  
**No cloud. No tracking. No permission required.**

The Arabic-speaking developer deserves an environment that respects their language and culture — an IDE that speaks Arabic right-to-left, understands intent before words, and knows that code is written with the heart before the hands.

---

## 🔗 Related Projects | المشاريع ذات الصلة

| Project | Description |
|---|---|
| [haven403/Haven](https://github.com/haven403/Haven) | The original HAVEN — foundational architecture / البنية الأصلية |
| [Grar00t/haven-electron](https://github.com/Grar00t/haven-electron) | Haven Electron Edition — cross-platform / إصدار Electron |
| [haven403/sovereign-stack](https://github.com/haven403/sovereign-stack) | Sovereign infrastructure stack / البنية التحتية السيادية |
| [haven403/KhawrizmOS](https://github.com/haven403/KhawrizmOS) | KhawrizmOS — Sovereign Arabic OS / نظام التشغيل السيادي |

---

## 👤 Credits | الفريق

<div align="center">

**Built by / بناه**

**Sulaiman Alshammari — سليمان الشمري**

*أبو خوارزم · [@Grar00t](https://github.com/Grar00t)*

Riyadh, Kingdom of Saudi Arabia 🇸🇦 · 2026

> *"أبنيها لأن العالم الرقمي السيادي يبدأ من سطر كود."*
> *"I build it because the sovereign digital world begins with one line of code."*

</div>

---

## 📄 License | الرخصة

```
MIT License

Copyright (c) 2026 Sulaiman Alshammari (@Grar00t)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

---

<div align="center">

```
الخوارزمية دائماً تعود للوطن
The Algorithm Always Returns Home
```

*HAVEN IDE · Tauri Edition · v2.0.0*
*Built with Rust 🦀 + React ⚛️ + Sovereignty 🇸🇦*

</div>
