# Angle pattern studies

These are authored candidates, not transcriptions or a claim of musical approval. The listening page uses the production JavaScript scheduler with the same Amen bank and fixed levels. Rebuild with `node desktop/render-angle-studies.mjs` from the project root. Each WAV is two bars, 168 BPM, Weight 42 / Reach 50 / Reply 50.

## Research basis

- [Transmission Samples / Stranjah rhythm guide](https://www.transmissionsamples.com/tutorials/drum-and-bass-production/dnb-drum-patterns): kick/snare/ghost placement, core rhythmic families, and call-and-response are useful dimensions for variation. The page does not supply the exact patterns below.
- [Stranjah jungle sequencing guide](https://www.transmissionsamples.com/tutorials/drum-and-bass-production/drum-and-bass-jungle-stranjah-part-3): programmed patterns can work alongside chopped breaks while preserving their groove.
- [Ableton / Side Brain on Move](https://www.ableton.com/en/blog/how-to-create-a-jungle-inspired-track-on-ableton-move/): a sequencer-based jungle workflow on constrained hardware. Consulted for workflow, not exact snare placements.

## Authored collection

All positions below are zero-based sixteenths (beats 2 and 4 are 4 and 12). Every bar starts with a kick at 0. C/R means call/response. Reply above 28 enables the response.

| Study | C snares | R snares | C/R second kick | C/R shuffle |
|---|---|---|---|---|
| Backbeat | 4,12 | 4,12 | 8 / 10 | 6 / 14 |
| Anticipated answer | 4,12 | 4,11 | 8 / 10 | 6 / 14 |
| Open answer | 4,12 | 4,11 | 8 / 7 | 6 / 14 |
| Early exchange | 2,11 | 3,9 | 9 / 14 | 6 / 11 |
| Anticipated call | 4,11 | 3,11 | 8 / 7 | 6 / 14 |
| Offbeat kick | 1,10 | 1,9 | 7 / 14 | 4 / 11 |
| Early call | 3,11 | 3,11 | 9 / 7 | 6 / 14 |
| Wide answer | 3,11 | 3,10 | 9 / 7 | 6 / 13 |
| Turnaround | 3,12 | 3,10 | 9 / 7 | 6 / 13 |

## Transition contract

Angle selects neighboring authored studies, not interpolated note times. Stable pockets occupy 40% of each interval; between them a deterministic eight-phrase distribution gradually introduces the neighbor. A fixed Angle repeats over sixteen bars. Balanced exposes 41 distinct sequences across 101 integer settings. Other routes expose 33–41 sequences. Angle updates at bar boundaries to avoid relocating a hit halfway through a bar. There is no random reseeding or gain crossfade between patterns.

Structural notes, ghost notes and hat triggers stay on sixteenths; existing fill embellishments can use thirty-seconds. The source chops retain their internal timing, and the separate recorded percussion voice retains its existing subdivision behavior. Shuffle durations are capped before the next structural hit. Event tests check these constraints; they cannot decide whether a candidate sounds good. Compare on multiple banks before settling the final route.

This experiment updates the browser JavaScript only. The independent C++ desktop sequencer has not been ported to this new pattern model.

## Listening feedback and revised ordering

The user's evaluation prioritizes surprise in the kick/snare exchange over busyness or displacement alone:

- Backbeat, Anticipated answer, Open answer and Early exchange worked.
- Anticipated call added little; omit from the active routes.
- Offbeat kick was a strong, high-angularity pattern.
- Early call and Wide answer were usable but not especially angular. Repeated beat-sized shapes felt even despite their displaced hits; retain only as comparisons.
- Turnaround was one of the better grooves, but its coherent syncopation belongs in the middle. Early exchange's snares felt more angular.

Balanced now uses Backbeat (0), Anticipated answer (20), Open answer (40), Turnaround (60), Early exchange (80), Offbeat kick (100). These positions are an implementation of the relative feedback, not measured scores. No individual study notes changed. The audition renderer now selects studies by identity rather than their old slider positions, keeping comparison files stable when the routes change.

## Hat-density balancing

The user's next comparison identified uneven hat activity between Open answer, Early exchange and Turnaround, and asked to separate angularity from busyness while keeping Turnaround's feel available.

At Weight 42 the old explicit hat counts were 11, 12 and 13 per two bars respectively. Those triggers were eighth notes, not extra sixteenths; the break slices and relationships between voices also contribute perceived density.

Every study now has five call hats and six response hats. Open answer and Early exchange use response positions 0,2,6,8,12,13: a short late-bar variation approaching Turnaround's 0,2,6,8,12,14 around its shuffle at 13. Their kick, snare, ghost and shuffle events are unchanged. Turnaround removes its hat at step 4 of each bar at low drive. Weight above 70 fades these counterpulses back in; at 85 they are fully restored. Above 85, lighter sixteenths enter. Existing Weight changes to other voices remain independent.

The comparison player preserves the previous renders and includes a hat-only drive render at unchanged Weight 42. This isolates density from Weight's kick/ghost/gain changes. Its Turnaround hat-drive value of .5 is the same hat setting as production Weight 85. Tests verify exact original hat-event restoration, unchanged non-hat events at the reference settings, equal baseline counts and monotonically increasing hat gains with drive. Equal explicit counts do not guarantee equal perceived busyness; the listening comparison decides that.

## Anticipated opening snares

Following listening feedback, Early exchange and Offbeat kick now start their call snares at step 3 instead of 4, matching Turnaround's sixteenth-note anticipation. Both response first snares already used step 3. Their other structural placements and balanced hats are unchanged. Historical before-hat-balance recordings remain untouched; they also predate this snare correction.

## Stronger upper-Angle revision

The next listening pass found the upper studies too close to Turnaround. Turnaround remains unchanged. Early exchange now has call snares 3/11 with kick 9, then response snares 3/9 and a late kick at 14 (shuffle 11). Offbeat kick moves the opening snare to 1, uses call second snare 10 / kick 7 / shuffle 4, then response second snare 9 / kick 14 / shuffle 11. This moves the response snare ahead of Turnaround's step 10, delays the kick until after that snare, and creates a longer gap between the principal voices. It is an audition candidate for increasing surprise, not a verified perceptual score.

Base hat counts remain five/six. Offbeat kick's call hat at 10 moves to 6 to avoid the new snare. The listening page preserves previous upper-pattern WAVs and places the upper-angle comparison first. Lower studies, timing grid, levels, and the Weight/hat-density mapping remain unchanged.

## Early exchange opening refinement

After approval of the stronger upper patterns, Early exchange's call first snare moves from step 3 to step 2. Turnaround opens at 3, Early exchange at 2, and Offbeat kick at 1. The response and other event placements remain unchanged. The hat-balance section is removed from the listening page; the upper-range comparison and full Angle progression remain.
