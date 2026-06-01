# Sign Language App - Design Guidelines

## 1. Architecture & Navigation

### No Authentication Required
Local-only learning/utility app. Profile stores preferences locally.

### Navigation: Tab Bar (4 tabs) + Floating Action Button
1. **Learn** - Lesson categories → Lesson details (modal)
2. **Practice** - Exercise modes → Exercise interface (modal)
3. **Library** - Search/browse → Sign details (modal)
4. **Profile** - Settings, language toggle, preferences
5. **Translate FAB** - Camera translation (modal)

---

## 2. Screen Layouts

### Universal Safe Area Insets
- **Tab screens:** Top: `headerHeight + Spacing.xl`, Bottom: `tabBarHeight + Spacing.xl`
- **Modal screens:** Top: `Spacing.xl`, Bottom: `insets.bottom + Spacing.xl`
- **Full-screen camera:** Custom insets, bottom card: `insets.bottom + Spacing.xl`

### Learn Tab (Home)
- Header: Transparent, centered "Learn Sign Language", right: language toggle (🇺🇸/🇵🇭)
- Content: 2-column grid of category cards (Greetings, Alphabet, Numbers, Common Phrases, Emotions, Daily Activities)
- Pull-to-refresh enabled

### Lesson Details (Modal)
- Header: Back, share button, category title
- Content: 16:9 video player, playback controls (play/pause, replay, speed), word (EN/TL), description, favorite button, next/previous navigation

### Practice Tab
- Header: Transparent, "Practice", right: stats button
- Content: Practice mode cards (Alphabet Quiz, Number Recognition, Phrase Match, Camera Challenge) showing icon, difficulty, best score, start button

### Practice Exercise (Modal)
- Header: Back, score counter (center), close
- Top: Progress bar, Middle: Question + answer area, Bottom: Floating submit button with shadow
- Fixed layout (non-scrollable), feedback overlay for correct/incorrect

### Library Tab
- Header: Transparent with integrated search bar, filter button
- Content: Alphabetical list with section headers, filter chips (horizontal scroll)
- List items: thumbnail animation (60x60pt), word (EN), word (TL), category tag

### Sign Detail (Modal)
- Header: Back, favorite button, word title
- Content: Large looping animation, word (EN/TL), step-by-step instructions, hand diagrams, related signs (horizontal scroll), "Practice this sign" button

### Translate Screen (FAB → Modal)
- Full-screen camera with skeletal hand tracking overlay
- Custom transparent header: close (top-left), language toggle (top-right), "Translate" title
- Bottom sheet: Recognized text (large), confidence indicator, TTS button, alternate language translation, save button
- Hand position guide (dotted rectangle), floating capture button at bottom-center

### Text-to-Sign (From Translate long-press or Library)
- Header: Back, "Text to Sign"
- Content: Text input field, language toggle, character counter, translate button, animation preview area, playback controls, save/share buttons

### Profile Tab
- Header: Transparent, "Profile"
- Content: Avatar selector (3 presets), display name field
- Settings groups:
  - **Language:** EN/TL toggle (primary)
  - **Camera:** Permissions, calibration
  - **Audio:** TTS voice, volume
  - **Playback:** Speed (slow/normal/fast)
  - **Accessibility:** High contrast, larger text
  - **About:** Version, privacy, help
- Optional: Progress stats

---

## 3. Design System

### Colors
- **Primary:** #2563EB (Deep Blue)
- **Secondary:** #14B8A6 (Teal - success)
- **Accent:** #F59E0B (Amber - CTA)
- **Error:** #EF4444
- **Success:** #10B981
- **Neutral:**
  - Background: #F9FAFB (light), #111827 (dark)
  - Surface: #FFFFFF (light), #1F2937 (dark)
  - Text Primary: #111827 (light), #F9FAFB (dark)
  - Text Secondary: #6B7280

### Typography (System Font)
| Style | Size | Weight | Use |
|-------|------|--------|-----|
| Heading 1 | 32pt | Bold | Screen titles |
| Heading 2 | 24pt | Semibold | Section headers |
| Heading 3 | 20pt | Semibold | Card titles |
| Body | 16pt | Regular | Content, instructions |
| Caption | 14pt | Regular | Metadata |
| Button | 16pt | Semibold | All buttons |

### Component Specs

**Category Cards**
- Border radius: 16pt, aspect ratio: 1:1 or 4:3
- Icon: 48x48pt (Feather icons), white surface with subtle border
- Press: Scale 0.98, opacity 0.7

**Sign List Items**
- Height: 80pt, thumbnail: 60x60pt (looped animation)
- Text: Body (title), Caption (subtitle, secondary color)
- Separator: 1px neutral gray
- Press: Background → neutral-100

**Floating Action Button (Translate)**
- Size: 56x56pt circle, background: #F59E0B
- Icon: Camera (white, 24pt), position: bottom-center above tab bar
- Shadow: `{width: 0, height: 2}`, opacity: 0.10, radius: 2
- Press: Scale 0.92, brightness -10%

**Search Bar**
- Height: 44pt, radius: 12pt, background: Neutral-100 (light), Neutral-800 (dark)
- Icon: Search (20pt, secondary), placeholder: "Search signs..." (localized)
- Clear button when active

**Progress Indicators**
- Linear: 4pt height, rounded ends, primary color
- Circular: 40pt diameter (category cards)
- Background: Neutral-200

**Video/Animation Player**
- Aspect ratio: 16:9, background: #000000
- Controls: 44pt minimum touch targets
- Loading: Skeleton loader with shimmer

**Buttons (Submit/Floating)**
- Shadow: `{width: 0, height: 2}`, opacity: 0.10, radius: 2

### Visual Feedback
- Press: Scale 0.98, duration: 200ms
- Success: Checkmark animation (500ms)
- Error: Horizontal shake (3 vibrations, 300ms)
- Loading: Skeleton loaders (no spinners)

---

## 4. Accessibility (WCAG AA)

**Required:**
- Minimum touch targets: 44x44pt
- Color contrast: 4.5:1 (text), 3:1 (UI components)
- Screen reader labels on all images/icons
- Video captions for demonstrations
- High contrast mode setting (7:1 AAA)
- Dynamic type support up to 200%
- Haptic feedback for interactions
- **Never use color alone** - always pair with icons/text

---

## 5. Critical Assets to Generate

**Profile Avatars (3):**
Minimalist human silhouettes with diverse skin tones incorporating sign language hand gestures

**Category Icons (6, Feather-style line icons):**
1. Greetings - Waving hand
2. Alphabet - Letter A fingerspelling
3. Numbers - Hand counting 3
4. Common Phrases - Speech bubble with hands
5. Emotions - Smiling face with expressive hands
6. Daily Activities - Hand tools

**Hand Position Guides:**
Skeletal hand diagram overlays (frontal + profile views) for camera guidance

**DO NOT generate:** Generic UI icons (use Feather icons via `@expo/vector-icons`), placeholder photos, backgrounds

---

## 6. Language Support (EN/TL)

- All UI strings require English + Tagalog translations
- Language toggle: Flag icons (🇺🇸/🇵🇭 as text) in header
- Store preference locally
- Signs display both languages simultaneously
- Text-to-speech: Platform TTS for both languages

---

## 7. Critical Rules

**DO:**
- Use Feather icons from `@expo/vector-icons`
- Apply safe area insets to all screens
- Add shadow to floating buttons (submit, FAB)
- Support pull-to-refresh on browsing screens
- Show progress indicators (linear/circular)
- Provide immediate visual feedback (scale, color, haptic)
- Include both EN/TL text in sign demonstrations

**DON'T:**
- Use emoji icons (except flag text in language toggle)
- Implement authentication
- Skip accessibility requirements
- Use color-only indicators
- Ignore 44pt minimum touch targets
- Forget caption text on videos