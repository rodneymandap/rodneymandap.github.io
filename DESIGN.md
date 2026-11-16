---
name: Rodney Jan Mandap Portfolio
description: A working index in dark navy and soft blue.
colors:
  ink: "#e4edf4"
  blue: "#9ac8ef"
  accent: "#1d3142"
  paper: "#101923"
  muted: "#adc1ce"
  light: "#adc1ce"
  deep: "#0a121b"
  field: "#142536"
  line: "#7898b0"
  button: "#b4d5ef"
  button-hover: "#d2e8fa"
  button-text: "#101f2b"
  white: "#ffffff"
typography:
  display:
    fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif'
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1
  title:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: "1.75rem"
  body:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: "1.25rem"
rounded:
  none: "0px"
spacing:
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  "12": "3rem"
  "16": "4rem"
  "20": "5rem"
  "24": "6rem"
  "32": "8rem"
components:
  button-primary:
    backgroundColor: "{colors.button}"
    textColor: "{colors.button-text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.button-hover}"
  link-inline:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.75rem 1rem"
  navigation:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  work-index:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.6}"
  highlight:
    textColor: "{colors.ink}"
---

# Design System: Rodney Jan Mandap Portfolio

## Overview

**Creative North Star: "The Working Index"**

The Working Index is a calm, useful field guide. Dark navy surfaces, soft light text, condensed headings, and clear rules make information easy to scan without relying on conventional cards.

Solid deep and elevated fields create contrast without decorative layering. Restrained blue accents, generous space, direct labels, and crisp controls keep the presentation practical and legible.

**Key Characteristics:**
- Dark navy surfaces, soft light text, and restrained blue accents.
- Condensed headings paired with clear sans-serif text.
- Square edges, ruled rows, and generous margins.
- Direct controls with visible keyboard focus.

This record covers the public portfolio in `pages/index.tsx`. Its palette and font families are defined in `tailwind.config.js`; the font imports are in `styles/globals.css`. The separate private application and older shared styles are not this system.

## Colors

The palette is cool and restrained, with solid fields rather than decorative color effects.

### Primary

- **Soft light ink** (`ink`): primary text and subtle rules.
- **Soft blue** (`blue`): headline emphasis, link underlines, hover color, and focus indicators.

### Secondary

- **Deep blue** (`accent`): flat feature fields and the contact background.
- **Pale blue** (`button`, `button-hover`): primary action fills, paired with dark `button-text`.

### Neutral

- **Dark canvas** (`paper`): the main background.
- **Muted blue-gray** (`muted`, `light`): supporting text on dark fields.
- **Deep ink** (`deep`): the skills section, identity panel, and footer.
- **Field** (`field`) and **line** (`line`): contact controls and their visible borders.
- **White** (`white`): high-contrast text and light rules on the deepest fields.

The sidecar's derived tonal strips are previews, not additional implemented palette tokens.

### Named Rules

**The Dark Field Rule.** Pair soft light text with dark navy fields. Reserve pale blue for primary actions and use dark text on those fills.

## Typography

Barlow Condensed supplies the compact display voice; Manrope supplies the readable interface and body voice. The font stacks and repeated sizes are defined in the frontmatter.

### Hierarchy

- **Display:** Semibold condensed section headings use `display`, increasing to `3.75rem` at the small breakpoint. The opening statement is a larger, fluid expression of the same face.
- **Title:** Bold `title` text identifies index entries, categories, and short highlights.
- **Body:** `body` describes the open leading used for longer paragraphs. Short supporting text can use tighter leading.
- **Label:** Bold `label` text identifies form fields and actions; navigation links use a semibold weight.

### Named Rules

**The Condensed Headlines Rule.** Use the condensed face for section headings, the large statement, the monogram, and display numerals; keep body copy, labels, and controls in Manrope.

## Layout

Center the content within a `1440px` maximum width. Horizontal gutters step from `spacing.6` to `spacing.10` at `640px` and `spacing.16` at `1024px`. Repeated major sections use vertical padding from `spacing.20`, `spacing.24`, and `spacing.32` at those same stages.

Stack content by default. At `640px`, suitable lists and the first pair of form fields can use two columns. At `768px`, navigation becomes a horizontal link row and the short highlights can form three columns. At `1024px`, major heading-and-content sections use an asymmetric `0.8fr : 1.2fr` grid. Keep text measures constrained rather than filling the entire grid.

In-page navigation scrolls smoothly; reduced-motion preferences restore ordinary scrolling.

## Elevation & Depth

Ordinary surfaces are flat at rest. Solid dark canvas, blue, and deep-ink fields and subtle rules establish hierarchy instead of ambient shadows. The transient notification is a raised exception; a form focus ring is an indicator, not surface elevation.

### Named Rules

**The Ruled Separation Rule.** Separate repeated items with thin translucent rules and flat fields rather than individual raised cards. Transient feedback may lift above the page.

## Shapes

Use the square `rounded.none` silhouette for buttons, fields, and flat panels. Fine rules are one pixel, using light ink or white at reduced opacity; input borders use the opaque line color. The design uses simple rectangles and directional line arrows, not ornamental containers.

## Components

### Buttons

The primary action is a square pale-blue button or link with a dark bold label and a right arrow. Its minimum height is `spacing.12`; its padding is defined by `button-primary`. On hover, the fill becomes lighter with a short color transition. Keyboard focus uses a `2px` blue outline with a `4px` offset. The submit button uses reduced opacity and a not-allowed cursor while disabled.

### Inline links

Secondary actions are bold, underlined text links with small arrows. The underline and hover text are blue; the link in the deep identity panel uses white. Internal links use a right arrow and external links use a diagonal arrow. Preserve visible focus, including a white outline on the identity panel.

### Inputs and fields

Place a bold label above each square dark field. Fields have a visible line-colored border, a minimum height of `3.25rem`, and the padding defined by `field`. Focus changes the border to blue and adds a `2px` blue ring. Disabled fields use reduced opacity. Native validation and the notification provide feedback; no separate field-error color is established.

### Navigation

The dark navigation has a thin bottom rule, a pale-blue monogram, and a compact name-and-role lockup. Desktop links are semibold and shift to blue on hover. Below `768px`, a menu button opens a stacked, in-flow list; links retain visible focus and close the menu when selected. No active-link style is established.

### Ruled index and content rows

The blue work index groups linked specialties with light rules, bold titles, muted descriptions, and right arrows. Each row has a `5.5rem` minimum height. An arrow shifts `4px` on hover; its transition is removed for reduced motion. Elsewhere, short highlights and credentials use flat, rule-separated rows rather than separate cards.

## Do's and Don'ts

### Do:

- **Do** pair light text with dark fields, and dark text with pale-blue actions.
- **Do** group repeated information with rules and generous spacing.
- **Do** preserve visible keyboard focus and the reduced-motion treatment.
- **Do** let multi-column content stack at narrow widths.

### Don't:

- **Don't** turn index or evidence rows into rounded, shadowed cards.
- **Don't** remove the underline from inline links and rely on color alone.
- **Don't** make the notification's shadow the default elevation for ordinary surfaces.
