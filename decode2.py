import os, glob
from PIL import Image
from pyzbar.pyzbar import decode

files = glob.glob(r'C:\Users\HP\.gemini\antigravity\brain\9cd34d8e-2586-4b72-84c9-a22b5509aa8e\.tempmediaStorage\*.*')

res = []
for f in files:
    try:
        decoded = decode(Image.open(f))
        for d in decoded:
            res.append((f, d.data.decode('utf-8')))
    except:
        pass

for r in res[-5:]:
    print(r[1])
