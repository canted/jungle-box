---
name: Jungle Box SP–1
description: Silver instrument panels unfolded into a playable paper net.
colors:
  ink: "#30332f"
  muted: "#61645d"
  paper: "#83f2d1"
  seam: "#a6a8a2"
  red: "#9e3028"
  led-active: "#b83c32"
  pressed: "#b8bcb2"
  focus: "#a0372c"
typography:
  display:
    fontFamily: "Georgia, serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-.03em"
  shortcut:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 700
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "11px"
  control-title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "15px"
    fontWeight: 600
rounded:
  button: "3px"
  panel: "10px"
  fader-thumb: "9px"
spacing:
  compact: "12px"
  control-gap: "18px"
  page-inline: "24px"
  section: "28px"
components:
  button:
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
  button-pressed:
    backgroundColor: "{colors.pressed}"
  volume-button:
    width: "36px"
  performance-pad:
    width: "38px"
    height: "72px"
    padding: "6px 7px"
  transport:
    textColor: "{colors.red}"
    width: "42px"
    height: "96px"
---

# Design System: Jungle Box SP–1

## Overview

**Creative North Star: "The unfolded SP–1"**

This scoped instrument surface follows the user's paper-box brief: silver face, top, left and right panels, laid flat with visible folds. The Adafruit photographs recorded in `references/sp1/README.md` establish the physical cues; proportions are estimates adapted for readable musical controls. This document captures `junglebox.html` and `junglebox.css`, not a broader product identity.

**Key Characteristics:**

- Silver gradients and dashed fold seams.
- Four parallel faders and narrow performance pads.
- Practical printed legends and restrained red state indicators.

## Colors

The palette combines warm paper, gray-green metal and dark printed ink. `red` marks transport and beat activity; `led-active` is the brighter performance-pad light. `muted` supports values and captions. `seam` distinguishes adjoining panels without adding heavy outlines. `focus` makes keyboard position visible.

Metal uses the shared diagonal gradient recorded in the sidecar; it is a material treatment rather than a solid color token.

## Typography

The page heading is bold italic Georgia; the instrument, controls and explanatory copy use Arial with Helvetica and sans-serif fallbacks. Numeric values use tabular figures. The heading reduces to 36px on compact screens, while control titles reduce to 12px. Printed legends remain 11px after the final legibility overrides. Guide copy is 14px with 1.7 paragraph line height. Vertical writing is reserved for narrow side controls and performance pads.

## Layout

The page has an 880px maximum width; the instrument and caption cap at 720px. The paper net has three columns (76px, flexible face, 88px) and two rows (82px top, content-height body). Only the top panel occupies the first row. Four equal fader and pad columns share an 18px gap. The face retains a 60px breathing space above the faders.

At 560px and below, side columns become 48px and 54px, the top becomes 70px, control gaps become 5px, and face breathing space becomes 40px. Fader travel reduces from 154px to 136px. Labels wrap rather than force photographic proportions; guide and reference content follow the instrument in normal document flow.

## Elevation & Depth

Diagonal metal gradients establish the shell; small outer shadows lift buttons, inset shadows recess tracks and the rocker, and a faint drop shadow separates the whole paper net from the page. Pressed controls switch to a solid gray-green fill and inset shadow. There is no animation system or transition timing in the current implementation.

## Shapes

Outer panel corners are softly rounded while shared fold edges meet flush along dashed seams. Buttons have small corners; volume buttons, LEDs and beat indicators are circular. Fader slots and caps have rounded ends. Preserve the open corners above the left and right panels so the unfolded construction remains visible.

## Components

- **Faders:** Weight, Reach, Reply and Angle retain their musical names, current values and endpoint descriptions. Native vertical range inputs have 44px-wide interaction regions, recessed tracks and silver caps. Browser-specific track rendering is intentional.
- **Performance pads:** Home, Drop, Catch and Fill use narrow vertical buttons, keyboard legends and one indicator each. Active indicators become opaque red; pressed state uses the shared inset treatment.
- **Edge controls:** the top holds a perforated speaker cue and volume pair; the left rocker selects breaks; the right holds Play and the percussion gesture control. Side controls retain their text labels and keyboard cues.
- **Break selector and status:** a native underlined select precedes the instrument; the status region remains readable alongside it and can wrap on compact screens.
- **Guide disclosures:** native details and summary elements use fine dividing lines. Reference photos appear as linked evidence, not metal textures.
- **Interaction states:** buttons darken slightly on hover; active and pressed states recess. Buttons, ranges, selects, summaries and links receive a 3px focus outline with a 4px offset. Pad and gesture touch behavior supports held interactions.

## Do's and Don'ts

- **Do** preserve the face, top, left and right paper-net arrangement on this instrument.
- **Do** keep existing musical control labels and readable legends when adjusting proportions.
- **Do** use source photographs as approximate physical references and retain their attribution.
- **Don't** add bottom or rear panels to this scoped surface.
- **Don't** sacrifice practical control legibility to reproduce the device's exact aspect ratio.
- **Don't** use the reference photos' blue research annotations as UI decoration.

### Current physical layout and shortcuts

The page background is #83f2d1; warm pale plastic is #eeede7. The face plastic strip occupies 6.5% of the face width and continues across the top edge at the same width. The grille remains on the aluminum top, with two rows of five holes. The right panel is plastic. Four animated LEDs remain on the right panel and two representational indicators remain on the face strip. Unidentified side holes, panel-name labels, the unfolded caption, and photo references have been removed.

Select break reads in the same vertical direction as the performance labels. Shortcut indicators use bold 11px monospace without separator bullets. Up/down arrows select previous/next breaks unless a native field is focused; plus, equals, and keypad plus raise volume, while minus and keypad minus lower it. Focused range inputs retain native arrow-key adjustments. Home stores faders on hold and recalls on tap. Tempo starts at 168 BPM. Four short, steady Home/H taps set tempo from 60–240 BPM, averaging recent intervals with an 18% consistency tolerance. A single tap still recalls the groove; holding for 550ms stores it. Taps longer than 250ms, gaps outside 250–1000ms, other controls, canceled presses, transport changes, and window blur reset detection. Tempo changes preserve the sequencer position.

### Typeset refinement

`typography.css` defines shared roles for the instrument and both listening pages. Background: #83f2d1, explicitly chosen by the user. Main text remains #30332f. Georgia italic 700 headings use 2.75rem / 1.1, reducing to 2.25rem on compact screens; section and subsection headings use Arial 700 at 1.5rem / 1.25 and 1.125rem / 1.35. Reading copy is 1rem / 1.6 with a 65ch maximum measure; clip metadata is .875rem / 1.5 with tabular numerals. Dense physical legends retain 11px and upright bold monospace shortcuts. No downloaded fonts or new font families. Header wrapping and stacked mobile audio rows support narrow screens. These typography values supersede earlier reading-size notes; physical device dimensions are unchanged.

Typeset validation: live computed headings are 44px / 24px / 18px with 16px prose (36px title on mobile). All three pages were captured at 1440px and 390px without horizontal overflow; the instrument was also checked at 320px. Arial is intentionally retained as established control typography. The type detector's remaining “flat hierarchy” reports on the generated listening pages conflict with these computed sizes and the rendered hierarchy; its remaining “overused font” reports are accepted to preserve the established family. Shortcut-family declaration now matches the implementation. Screenshot evidence is in `.impeccable/review/typeset-*.jpg`.

### Canonical instrument boundary

The approved canonical font pairing is DIN Condensed Bold for the uppercase title (3.5rem desktop, 2.75rem compact) and fader names (20px / 16px), with Avenir Next reading and device text. These use locally installed faces with sans-serif fallbacks. Upright bold monospace keyboard shortcuts use the user's exact green, `rgb(22, 161, 0)`. This supersedes the earlier Georgia/Arial specification for the canonical instrument; separate study pages retain their existing typography.

`junglebox.html` is the canonical Jungle Box instrument, not an experiment launcher. Keep research links, comparison players, and alternative phrasing selectors off this page. The approved Angle progression is fixed here. Separate listening pages and render harnesses remain research tools.

### Gesture tempo modifier and Amen level

Hold Gesture/G and press Select break up/down to adjust tempo by +1/−1 BPM, bounded to 60–240 BPM, playing or stopped. The modifier takes priority over break selection (and focused-fader arrow adjustment while Gesture is held). Using it preserves the existing percussion motif, discards this hold’s draft, and prevents release from clearing the motif. Ordinary Gesture tap-to-clear remains available. Amen accent2 gesture strokes above 65% Weight receive a 0.5 gain multiplier (approximately −6 dB); other banks and lower-Weight strokes retain their existing gain.

Tempo nudging repeats while Gesture and a Select break arrow are held (keyboard or pointer): immediate 1 BPM step, 500ms delay, then 280ms intervals easing to 60ms over four seconds. After 4.5 seconds held, a second gentle four-second ramp reduces the interval to 45ms (about 22 BPM/second). From 8.5 to 12 seconds, a further gentle ramp reduces it to 30ms (about 33 BPM/second), capped there. Release, gesture cancellation, or window blur stops the timer. Switching direction resets the acceleration. OS key repeat is suppressed for the chord.
