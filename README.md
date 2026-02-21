# CyberPad

Minimalist industrial notepad for people who prefer terminals over toys.

CyberPad is a lightweight, frameless, transparent **Tauri-based
multi-tab editor** written in Rust and Vanilla JavaScript, designed to
feel like a small system utility rather than a traditional application.

Fast launch. Zero clutter. Keyboard-first. Persistent state. Native
performance.

Inspired by the **Memory Shards** interface from Cyberpunk 2077.

------------------------------------------------------------------------

# ✦ What's New (Tab Engine)

-   Multi-tab system with persistent state
-   Per-tab undo / redo history
-   Full tab session restore on launch
-   Per-tab autosave tracking
-   Persistent tab storage
-   Dirty tab protection
-   Header preview system

------------------------------------------------------------------------

# ✦ Features

## Core

-   Frameless transparent HUD window
-   Native Rust backend (Tauri)
-   Instant startup
-   Extremely low memory footprint
-   Portable executable

## Tabs System

-   Unlimited tabs
-   Independent content per tab
-   Independent history per tab
-   Persistent tabs on restart
-   Dirty state tracking
-   Scratch tabs

## File Operations

-   Open
-   Save
-   Save As
-   Drag & Drop
-   Recent files

## History Engine

-   Per-tab undo / redo
-   No cross-tab history corruption
-   Deterministic behavior

## Autosave

-   Per-tab autosave
-   Idle autosave
-   Autosave indicator

## HUD Interface

-   Cyberpunk Memory Shard UI
-   Header preview layers
-   Slide-out drawer
-   Character counter

------------------------------------------------------------------------

# ✦ Keyboard Shortcuts

## File

Open file\
Ctrl + O

Save\
Ctrl + S

Save As\
Ctrl + Shift + S

------------------------------------------------------------------------

## Tabs

New tab\
Ctrl + T

Close tab\
Double click tab

Switch tab\
Click tab

Preview filename\
Hover tab

------------------------------------------------------------------------

## Editing

Undo\
Ctrl + Z

Redo\
Ctrl + Y

------------------------------------------------------------------------

# ✦ Architecture

src/ features/ tabs/ history/ autosave/ ui/

src-tauri/ src/

TabState is the single source of truth.

------------------------------------------------------------------------

# ✦ Tech Stack

Frontend - Vanilla JavaScript - CSS HUD styling - Vite

Backend - Rust - Tauri v2

------------------------------------------------------------------------

# ✦ Development

Install

npm install

Run

npm run tauri dev

Build

npm run tauri build

------------------------------------------------------------------------

# ✦ Portable executable

Run directly

cyberpad.exe

------------------------------------------------------------------------

# ✦ License

MIT

------------------------------------------------------------------------

CyberPad\
by Nutcracker
