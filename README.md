# HAVEN IDE — بيئة التطوير السيادية

> **الإنسان أولاً** | Zero Telemetry | 100% Local AI | No Microsoft

HAVEN IDE is a sovereign, Arabic-first development environment built on Tauri v2 + React 19 + TypeScript. Every line of code runs on your machine — no cloud, no tracking, no compromises.

---

## نظرة عامة / Overview

| | |
|---|---|
| **المؤلف / Author** | Sulaiman Alshammari (أبو خوارزم) |
| **الشركة / Company** | Ghala Rafaa Al-Omari Co. (CR: 7050426415) |
| **الموقع / Website** | [khawrizm.com](https://khawrizm.com) |
| **تويتر / Twitter** | [@khawrzm](https://twitter.com/khawrzm) |
| **الإصدار / Version** | 2.0.0 |
| **الرخصة / License** | MIT |

---

## 🏗 Architecture — Three-Lobe Intelligence

```
                    ┌─────────────────────────────────┐
                    │      NiyahEngine (LOI v3)        │
                    │  Arabic NLP · Intent Analysis    │
                    │  Dialect Detection · Root Ext.   │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │         ModelRouter              │
                    │  Smart routing based on intent   │
                    └─┬──────────────┬──────────────┬─┘
                      │              │              │
              ┌───────▼──────┐ ┌────▼────┐ ┌──────▼──────┐
              │  🧠 Cognitive │ │⚡ Exec.  │ │  👁 Sensory  │
              │  Understanding│ │  Code   │ │  Perception │
              │  Reasoning    │ │  Action │ │  Creative   │
              └──────────────┘ └─────────┘ └─────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │        Ollama (Local)            │
                    │  Qwen · LLaMA · DeepSeek · etc  │
                    │  100% on-device inference        │
                    └─────────────────────────────────┘
```

---

## 🚀 Quick Start / البدء السريع

### Prerequisites / المتطلبات

1. **Rust** (1.70+): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. **Node.js** (20+): [nodejs.org](https://nodejs.org)
3. **Tauri CLI v2**: `npm install -g @tauri-apps/cli@next`
4. **Ollama**: [ollama.ai](https://ollama.ai) — Install and run locally
5. **Pull a model**: `ollama pull qwen2.5-coder:7b`

### Development / التطوير

```bash
# Clone
git clone https://github.com/khawrizm/haven-ide.git
cd haven-ide

# Install dependencies
npm install

# Run in dev mode (hot reload)
npm run tauri:dev
```

### Production Build / البناء للإنتاج

```bash
# Build for your platform
npm run tauri:build

# Output:
# Linux:   src-tauri/target/release/bundle/deb/
# macOS:   src-tauri/target/release/bundle/dmg/
# Windows: src-tauri/target/release/bundle/msi/
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop** | Tauri v2 (Rust) |
| **Frontend** | React 19 + TypeScript |
| **Build** | Vite 6 |
| **Styling** | Tailwind CSS v4 |
| **State** | Zustand 5 |
| **Editor** | Monaco Editor |
| **Terminal** | xterm.js |
| **AI Backend** | Ollama (local) |
| **NLP** | NiyahEngine (custom Arabic NLP) |

---

## 🧠 Core Engines

### NiyahEngine (LOI v3)
Arabic-first NLP engine. Processes intention, not text.
- **2,976 Arabic word forms** across 283 roots
- **7 dialects**: Saudi, Khaleeji, Egyptian, Levantine, Maghrebi, MSA, Mixed
- **LRU Cache**: 512 entries for fast intent lookup
- **Intent Graph**: 200-session lookback for context tracking
- **Sovereignty alignment**: Detects and flags cloud/telemetry intent

### ModelRouter
Three-lobe intelligence routing:
- **Cognitive Lobe**: Understanding, reasoning, education
- **Executive Lobe**: Code generation, infrastructure
- **Sensory Lobe**: Creative, content, security perception
- **20+ model families**: Qwen, LLaMA, DeepSeek, Gemma, Mistral, Phi, etc.
- **Smart scoring**: Picks best model per task and dialect

### OllamaService
Full Ollama integration:
- Connection management with health checks
- Streaming (SSE-based) chat and generation
- Code completion (fill-in-middle)
- Model management (list, pull, delete, show)
- Abort controller support

### SovereignSessionCleaner
AES-256-GCM encrypted session management:
- All sessions encrypted at rest
- Device-unique key derivation (PBKDF2)
- Auto-purge of sessions older than 7 days
- Sovereign wipe: complete data erasure

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle File Explorer |
| `Ctrl+Shift+A` | Toggle AI Panel |
| `Ctrl+Shift+J` | Toggle Terminal |
| `Ctrl+Shift+I` | Toggle Intent Graph |
| `Ctrl+S` | Save File |

---

## 🌍 Languages / اللغات

HAVEN IDE supports 10 languages:

| Code | Language | اللغة |
|------|----------|-------|
| `ar` | Arabic (default) | العربية |
| `en` | English | الإنجليزية |
| `fr` | French | الفرنسية |
| `es` | Spanish | الإسبانية |
| `ja` | Japanese | اليابانية |
| `de` | German | الألمانية |
| `zh` | Chinese | الصينية |
| `ko` | Korean | الكورية |
| `tr` | Turkish | التركية |
| `hi` | Hindi | الهندية |

---

## 🎨 Design System

### Colors / الألوان

```css
--haven-base:    #0a0a0a  /* Deep black background */
--haven-gold:    #d4af37  /* Sovereignty gold accent */
--haven-green:   #00ff41  /* Terminal green — life */
```

### Theme: Haven Dark
- **Background**: Deep black `#0a0a0a` — sovereign silence
- **Gold**: `#d4af37` — the color of heritage and knowledge
- **Green**: `#00ff41` — terminal green, alive and local

---

## 🔐 Privacy & Sovereignty / الخصوصية والسيادة

```
✓ Zero telemetry — no data sent anywhere
✓ Zero cloud — all inference runs on your GPU/CPU
✓ Zero Microsoft — no VSCode APIs, no Azure, no Teams
✓ Zero tracking — no analytics, no error reporting to external
✓ AES-256-GCM — session data encrypted on device
✓ SovereignBridge — blocked patterns for data exfiltration
✓ Open source — audit every line
```

---

## 🦀 Tauri Commands (Rust)

| Command | Description |
|---------|-------------|
| `ollama_health_check` | Ping Ollama server |
| `ollama_generate` | Non-streaming generation |
| `ollama_chat` | Non-streaming chat |
| `ollama_list_models` | List available models |
| `ollama_running_models` | Get running model list |
| `ollama_show_model` | Get model details |
| `ollama_delete_model` | Remove a model |
| `read_file` | Read file content |
| `write_file` | Write file content |
| `create_directory` | Create directory |
| `delete_path` | Delete file/directory |
| `list_directory` | List directory contents |
| `run_command` | Execute shell command |
| `get_system_info` | CPU, RAM, disk usage |
| `get_home_dir` | Get home directory path |
| `get_app_data_dir` | Get app data directory |

---

## 📂 Project Structure

```
haven-tauri/
├── src/                          # Frontend (React)
│   ├── engine/
│   │   ├── NiyahEngine.ts        # Arabic NLP engine
│   │   ├── OllamaService.ts      # Ollama integration
│   │   ├── ModelRouter.ts        # Three-lobe routing
│   │   ├── ThreeLobeAgent.ts     # Cognitive orchestrator
│   │   ├── SovereignSessionCleaner.ts  # Encrypted sessions
│   │   └── SovereignBridge.ts    # Process sandboxing
│   ├── components/
│   │   ├── TopBar.tsx            # Window controls + branding
│   │   ├── Sidebar.tsx           # File explorer
│   │   ├── CodeEditor.tsx        # Monaco editor
│   │   ├── AIPanel.tsx           # Chat interface
│   │   ├── Terminal.tsx          # xterm.js terminal
│   │   ├── IntentGraph.tsx       # Canvas intent visualization
│   │   ├── StatusBar.tsx         # Bottom status bar
│   │   └── NotificationStack.tsx # Toast notifications
│   ├── i18n/index.ts             # 10-language system
│   ├── store/index.ts            # Zustand state
│   ├── styles/globals.css        # Haven dark theme
│   ├── App.tsx                   # Main layout
│   └── main.tsx                  # React entry point
├── src-tauri/                    # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   └── lib.rs                # All Tauri commands
│   ├── Cargo.toml                # Rust dependencies
│   ├── tauri.conf.json           # App configuration
│   └── build.rs                  # Build script
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 📦 Recommended Ollama Models

```bash
# Code (Executive Lobe)
ollama pull qwen2.5-coder:7b
ollama pull deepseek-coder-v2:16b

# Chat/Analysis (Cognitive Lobe)
ollama pull qwen2.5:14b
ollama pull llama3.3:latest

# Creative/Sensory (Sensory Lobe)
ollama pull llama3.2:latest
ollama pull gemma2:9b

# Arabic support
ollama pull qwen2.5:7b  # Best Arabic support
```

---

## 🤝 Contributing

Built for the Arabic developer community. Contributions in Arabic welcome.

```bash
git checkout -b feature/your-feature
git commit -m "feat: وصف الميزة بالعربية"
git push origin feature/your-feature
```

---

## 📄 License

MIT © 2026 Sulaiman Alshammari — Ghala Rafaa Al-Omari Co.

---

> **بُني HAVEN IDE إيماناً بأن البرمجي العربي يستحق أدوات سيادية تحترم خصوصيته وتتكلم لغته.**
>
> *HAVEN IDE was built in the belief that Arab developers deserve sovereign tools that respect their privacy and speak their language.*
