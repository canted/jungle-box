# Breakroom desktop comparison

Open renders/Listen.html directly for synchronized, looping A/B playback. The two stereo WAVs in renders/ also line up in a DAW.

To rebuild from this directory, install Node.js, a C++17 compiler, and Python with NumPy and SciPy, then run:

```sh
npm ci
node capture.mjs
c++ -std=c++17 -O2 engine.cpp -o /tmp/breakroom-engine
/tmp/breakroom-engine
python3 compare.py
```

take.tsv records gestures at zero-based sixteenth-note positions. The eight-bar take is scripted and repeatable. capture.mjs executes the production JavaScript scheduler and voice graph with an offline Web Audio implementation, writes its event trace, and exports all six banks. Each recording is stored once as interleaved signed 16-bit little-endian PCM at 48 kHz. Each bank/index.txt row contains bank number, name, sixteenth count, frame count, channel count, role, first frame, and exclusive end frame.

The native host independently sequences the gestures, reads the PCM files in 512-frame windows, and renders stereo in 128-frame blocks. It uses linear interpolation and a stereo peak compressor. The listening export compensates the measured reference output delay and matches whole-take RMS. compare.py checks both schedulers for identical event times, banks, cuts, gains and gates before writing either WAV.

This desktop implementation uses synchronous file reads and standard-library containers. Device integration still needs bounded real-time scheduling, storage prefetch, codec output and measurements on the physical board.

The gesture comparison uses percussion/take.tsv. Run `node capture.mjs percussion`, then run the compiled engine with `percussion` as its argument and run `python3 compare.py percussion`. Open percussion/Listen.html. Both engines receive record, fader movement, and commit gestures. The trace includes pitched percussion voices as well as the underlying break.
