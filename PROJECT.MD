# 🧾 MVP PRD: DnD.ai – AI-Assisted Dungeon Master Tool

---

## 1. Overview

**Product Name:** DnD.ai  
**Type:** Mobile-first Web Application (DM-only tool)

**Summary:**  
DnD.ai is a mobile-friendly web app for Dungeon Masters running Dungeons & Dragons sessions. It combines AI-assisted storytelling with character tracking, dice rolling, and note management.

The AI provides structured story outcomes, while the DM retains full control and can customize results.

---

## 2. MVP Goal

Allow a Dungeon Master to:
- Create and manage multiple campaigns  
- Run sessions using AI-generated story outcomes  
- Track characters and notes  
- Customize AI behavior  
- Save and return to campaigns anytime on their device  

---

## 3. Core Features

---

## 3.1 Campaign System (Multi-Campaign Support)

### A. Multiple Campaigns
- Create campaigns  
- Save campaigns  
- Load/select campaigns  
- Delete campaigns  

---

### B. Campaign Creation
- Input campaign idea (free text)
- AI generates 3 campaign bases:
  - World description  
  - Starting scenario  
  - Main conflict  
  - Tone  

- DM selects one

---

### C. Pre-Made Campaigns
- Built-in campaigns selectable by user  

---

### D. Campaign Persistence (DEVICE STORAGE – REQUIRED)

All data MUST be saved locally on the user's device (e.g., localStorage).

Each campaign stores:
- Characters  
- Stats (HP, Gold, XP, custom values)  
- Character notes  
- DM notes  
- Event log  
- Story progress  
- Custom outcomes  

User must be able to:
- Close the app  
- Reopen later  
- Continue where they left off  

No login required.

---

## 3.2 Character System

### Character Creation

**Required:**
- Name  
- HP  
- Gold  
- XP  

**Optional:**
- Class  
- Level  
- Status  
- Custom stats  

---

### Value Tracking (Per Character)

Each character has:
- HP  
- Gold  
- XP  
- Custom stats  

