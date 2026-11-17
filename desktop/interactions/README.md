# Slider interaction pass

Scope: browser instrument. The approved Angle study notes and routes are unchanged. `before.js` preserves the pre-interaction implementation for regression comparisons; the independent native C++ sequencer is not updated by this experiment.

## Behaviors

- Weight: anchor kicks retain a minimum level, then reinforce smoothly. Ghosts fade in instead of entering at a fixed substantial gain. Drive pickups fade in over the upper range. Existing balanced hat lanes and drive density remain intact.
- Reach: short settings retain an attack floor for kicks/snares. Gates grow smoothly across the range instead of disappearing at 50. Shuffle changes from short to long using complementary gains between 58 and 82; the combined shuffle gain remains constant, and both cuts stop before the next structural hit. Internal events inside recorded cuts can still affect perceived busyness.
- Reply: 0 repeats the call. Between 0 and 40, a deterministic eight-phrase sequence introduces more responses; from 40 upward every second bar answers. Above the reference setting, response ghost articulation increases gently without changing Angle's structural placements. Reply and Angle latch at bar boundaries, avoiding partial in-bar pattern changes.

Reference W42 / Reach50 / Reply50 is preserved at every integer Angle value on all four routes. Low Reply intentionally replaces the old abrupt threshold. The transitions are not a guarantee that every combination sounds equally good.

## Listening matrix

Run `node desktop/render-interactions.mjs` from the project root. Open `desktop/interactions/Listen.html` or the served equivalent. It contains Amen and Think at Angle 40, 60, 100, each with Reference, Light, Driven, Short, Long, Occasional reply, Strong reply, Light + long, Driven + short, Driven + long. These are four-bar clips, extended to eight bars for Reply below 40. A full Reply repetition cycle is sixteen bars. Output gain is fixed across clips; no per-file normalization. Only one player runs at once; changing bank pauses playback.

Useful audition order: compare Reference across the three Angle columns, then Light/Driven, Short/Long, the Reply rows, and finally the mixed settings. Listen for structural snare clarity, long-cut crowding, abrupt timbre changes, and whether the upper Angle patterns keep their identity under drive. The code tests cannot establish perceived musical sweet spots.

## Validation

`node tests/angle.cjs` retains grid, approved-pattern, density, shuffle-gap, and repeatability checks. `node tests/interactions.cjs` checks reference event equality against `before.js`, progressive Reply frequency, monotonic Reach gates, structural-hit preservation, shuffle gain sums, and 82,944 combination cases. Offline exports reject silence, non-finite peaks and clipping. Browser playback verifies loading and controls; no claim of independent human listening approval.
