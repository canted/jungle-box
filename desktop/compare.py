"""Validate event parity, compensate reference DSP latency, and export the listening pair."""
from pathlib import Path
import sys
import base64
import numpy as np
from scipy.signal import correlate
from scipy.io import wavfile
root=Path(__file__).resolve().parent/(sys.argv[1] if len(sys.argv)>1 else 'renders')
def trace(name):
    rows=[line.split() for line in (root/(name+'.tsv')).read_text().splitlines()]
    return sorted((int(f),int(b),r,round(float(g),9),round(float(d),9)) for f,b,r,g,d in rows)
assert trace('reference')==trace('native'), 'Sequencer mismatch'
def signal(name):
    return np.fromfile(root/(name+'.f32'),'<f4').reshape(-1,2)
ref,native=signal('reference'),signal('native')
window=20000
lag=int(np.argmax(correlate(ref[:window,0],native[:window,0]))-window+1)
assert 0<=lag<=1024
ref=ref[lag:lag+len(native)]
assert ref.shape==native.shape and np.isfinite(ref).all() and np.isfinite(native).all()
def rms(x):return np.sqrt(np.mean(x*x))
native=native*(rms(ref)/rms(native))
scale=min(1,.98/max(abs(ref).max(),abs(native).max()))
assets=[]
for name,x in [('Breakroom',ref),('Desktop',native)]:
    path=root/(name+'.wav')
    wavfile.write(path,48000,np.round(x*32767*scale).astype('<i2'))
    assets.append(base64.b64encode(path.read_bytes()).decode())
page=(root.parent/'listen-template.html').read_text()
if root.name=='percussion':
    page=page.replace('Amen → Think → Amen','Amen · percussion gestures').replace('Listen for the clipped Amen in bar 2, the two Fill and Drop combinations in bars 3–4, and Catch carrying into Think in bar 6. Home brings Amen back in bar 8.', 'Bars 2 and 4 answer in dotted eighths. Bars 6 and 8 answer in eighth-note triplets. Switch A/B while the phrase loops.')
(root/'Listen.html').write_text(page.replace('AUDIO_PAIR',repr(assets)))
print(f'{len(trace("native"))} matching events; reference latency {lag} frames; {len(native)} stereo frames')
