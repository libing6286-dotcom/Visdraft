---
name: Scenva
description: Open-source, self-hostable AI creative canvas for image and video workflows.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent-lime: "oklch(0.90 0.17 115)"
  border: "oklch(0.922 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  success: "oklch(0.60 0.15 145)"
  warning: "oklch(0.75 0.15 85)"
  info: "oklch(0.65 0.1 250)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
    typography: "{typography.label}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
    typography: "{typography.label}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    height: "32px"
    typography: "{typography.body}"
  dialog:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
  sidebar-rail:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
    width: "60px"
---

# Design System: Scenva

## 1. Overview

**Creative North Star: "Quiet Studio"**

Scenva's product UI is a quiet creative studio: the canvas, chat, generation controls, and brand assets stay readable and close at hand while the interface itself remains compact. The visual system earns trust through restraint. It uses familiar product patterns, a monochrome foundation, and one sharp lime accent for focus, selection, and creative spark.

The product should feel professional, open, and creator-friendly without turning into a decorative AI showcase. Landing and pricing pages may carry more expression, but authenticated workspace surfaces must keep the controls direct and the canvas central. Scenva explicitly rejects the feel of a closed SaaS template tool, a traditional timeline-first editing suite, or a flashy but untrustworthy AI generator.

**Key Characteristics:**
- Compact 32px controls for fast repeated use.
- Monochrome surfaces with lime used sparingly as a signal.
- Tonal layering before heavy elevation.
- Geist as a single product type family.
- Direct controls, visible state, and restrained motion.

## 2. Colors

The palette is restrained: clean white and near-black neutrals carry the workspace, with lime reserved for active navigation, focus rings, creative highlights, and brand moments.

### Primary
- **Ink Primary**: the near-black action color used for primary buttons, strong foreground, and high-confidence controls.
- **Studio Lime**: the accent used for active states, focus rings, logo marks, landing highlights, and limited creative emphasis.

### Neutral
- **Canvas White**: the base application background and card surface.
- **Panel Mist**: the soft secondary and muted layer used for sidebars, tabs, dialog footers, skeletons, and grouped controls.
- **Quiet Border**: the divider and input stroke color. It should define structure without boxing every element.
- **Muted Text**: secondary labels, helper text, placeholders, and inactive navigation.
- **Foreground Ink**: body text, titles, dense tool labels, and active icons.

### Named Rules

**The Lime Is Rare Rule.** Studio Lime is a state and identity signal, not decoration. If a screen starts to read green, the accent has been overused.

**The Monochrome Workspace Rule.** Workspace surfaces stay neutral so generated images, videos, and brand assets carry the color.

## 3. Typography

**Display Font:** Geist, with ui-sans-serif and system-ui fallback
**Body Font:** Geist, with ui-sans-serif and system-ui fallback
**Label/Mono Font:** no distinct mono family in the current system

**Character:** Geist gives Scenva a crisp product voice that works across marketing headings, compact labels, chat content, and dense controls. The system uses weight and spacing more than font pairing.

### Hierarchy
- **Display** (700, 3.5rem, 1 line-height): landing and major empty-state headlines only. Keep display letter-spacing no tighter than -0.03em.
- **Headline** (700, 1.875rem, 1.2 line-height): marketing sections and large feature headings.
- **Title** (600, 1rem, 1.25 line-height): panel titles, dialog titles, settings headers, and card labels.
- **Body** (400, 0.875rem, 1.5 line-height): product copy, settings text, chat prose, helper text, and descriptions. Long prose should stay under 75ch.
- **Label** (500, 0.875rem, 1 line-height): buttons, form labels, tabs, compact nav labels, and inline actions.

### Named Rules

**The Product Scale Rule.** Authenticated UI uses fixed rem sizes, not fluid typography. Fluid display type belongs to marketing surfaces, not sidebars, dialogs, or tools.

**The One Family Rule.** Do not introduce a second display or body family unless a full brand refresh commits to it.

## 4. Elevation

Scenva is flat by default and layered through tone, borders, and motion. Shadows exist, but they are quiet and functional: small ambient shadows for cards, stronger shadows for floating surfaces, and glow only when the lime accent is actively drawing attention.

### Shadow Vocabulary
- **Subtle** (`0 1px 3px rgba(0, 0, 0, 0.04)`): tiny separation for low-priority surfaces.
- **Card** (`0 4px 20px rgba(0, 0, 0, 0.04)`): non-interactive cards that need gentle lift.
- **Card Hover** (`0 8px 30px rgba(0, 0, 0, 0.08)`): hover response on meaningful interactive cards.
- **Float** (`0 12px 40px rgba(0, 0, 0, 0.12)`): popovers, menus, and floating tool surfaces.
- **Accent Glow** (`0 0 20px oklch(0.90 0.17 115 / 0.25)`): rare emphasis for brand or generation moments.

### Named Rules

**The Flat At Rest Rule.** Surfaces are flat until interaction or layering demands depth. A border plus a large decorative shadow is forbidden.

**The Glow Has A Job Rule.** Lime glow must indicate focus, active creation, or a deliberate CTA. It must not be used as background decoration.

## 5. Components

### Buttons
- **Shape:** compact rounded rectangles (8px base radius), with icon buttons at fixed square sizes.
- **Primary:** near-black background with near-white text, 32px height, 10px horizontal padding, 500 weight label text.
- **Hover / Focus:** all buttons transition quickly; focus uses a 3px lime ring at 50% opacity. Active state may translate down by 1px.
- **Secondary / Ghost / Destructive:** outline and ghost variants stay neutral; destructive actions use a red tint rather than a fully saturated red block unless confirmation is final.

### Chips
- **Style:** small rounded tokens with muted backgrounds and compact text. Badges such as Beta or Default use restrained fills, not loud pills.
- **State:** selected chips may use muted fill or primary tint; inactive chips stay neutral.

### Cards / Containers
- **Corner Style:** 10px to 14px for dialogs and significant containers; 8px for compact controls and list items.
- **Background:** cards stay on Canvas White or Panel Mist, with borders used to define structure.
- **Shadow Strategy:** cards are mostly flat; only hoverable or floating surfaces receive shadow.
- **Border:** use Quiet Border for structure. Do not use thick colored side stripes.
- **Internal Padding:** compact product panels use 16px to 24px; larger marketing feature panels use 24px to 32px.

### Inputs / Fields
- **Style:** 32px height, 8px radius, transparent background, Quiet Border stroke, 10px horizontal padding.
- **Focus:** switch border to Studio Lime and apply a 3px lime focus ring at 50% opacity.
- **Error / Disabled:** error uses destructive border and a low-opacity ring; disabled controls reduce opacity and may use a muted input fill.

### Navigation
- **Style:** the authenticated app uses a 60px desktop icon rail and a fixed mobile bottom bar. Active icons use neutral foreground plus a small lime-tinted active surface.
- **Typography:** desktop navigation is icon-first; mobile adds 10px labels for clarity.
- **Motion:** active rail movement uses a spring, but navigation must remain instant enough for repeated workspace use.

### Dialogs
- **Style:** centered panels with 14px radius, white background, 16px padding, ring at 10% foreground, and a soft shadow.
- **Behavior:** use dialogs for confirmation and contained creation flows. Do not make modal dialogs the first answer for every task.

### Toasts
- **Style:** foreground background with inverse text, rounded 14px corners, compact spacing, and semantic icon color.
- **Motion:** short fade and translate transitions are acceptable; toasts should never block the workspace.

### Signature Component: Canvas Workspace

The canvas is the visual priority. Surrounding controls should stay compact, fixed, and predictable. AI generation panels, chat input, brand kit controls, and layer tools must preserve space for work rather than becoming decorative feature panels.

## 6. Do's and Don'ts

### Do:
- **Do** keep authenticated workspace UI restrained, compact, and familiar.
- **Do** reserve Studio Lime for focus rings, selected navigation, active generation, logo marks, and rare CTA emphasis.
- **Do** use the existing 32px control height and 8px radius for standard buttons and inputs.
- **Do** use tonal surfaces, borders, skeletons, and clear empty states before adding heavy visual effects.
- **Do** keep AI generation status legible, steerable, and recoverable.

### Don't:
- **Don't** make Scenva feel like a closed SaaS template tool.
- **Don't** make Scenva feel like a traditional timeline-first editing suite.
- **Don't** make Scenva feel like a flashy but untrustworthy AI generator.
- **Don't** use thick colored side-stripe borders, gradient text, decorative glassmorphism, or generic hero metric blocks.
- **Don't** pair a 1px border with large decorative shadows on cards or buttons.
- **Don't** introduce oversized radii above 16px on product cards, panels, inputs, or dialogs.
- **Don't** add decorative motion that does not communicate state, progress, or feedback.
