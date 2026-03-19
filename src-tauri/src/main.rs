// ═══════════════════════════════════════════════════════════════════════
// HAVEN IDE — Tauri Backend Entry Point
// بيئة التطوير السيادية — نقطة دخول الواجهة الخلفية
// Built by أبو خوارزم — Sulaiman Alshammari
// Zero telemetry. Zero cloud. Pure sovereignty.
// ═══════════════════════════════════════════════════════════════════════

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    haven_ide_lib::run()
}
