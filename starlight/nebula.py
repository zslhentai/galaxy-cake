"""Generate the backdrop's violet dust clouds and engraved-film grain."""
from pathlib import Path
import numpy as np
from PIL import Image

w, h = 1360, 940
rng = np.random.default_rng(614)
y, x = np.mgrid[-1:1:complex(h), -1.45:1.45:complex(w)]


def noise(width, height):
    layer = Image.fromarray(rng.random((height, width), dtype=np.float32))
    return np.asarray(layer.resize((w, h), Image.Resampling.BICUBIC)) - .5


fold = noise(8, 7)
veins = noise(18, 12)
detail = noise(52, 32)
grain = noise(290, 168)
gas = np.maximum(0, .58 + 1.13*fold + .49*veins + .23*detail + .18*grain)
bias = y + .36*x - .31*np.sin(x*2.45) + .19*fold
stream = np.exp(-((bias + .34*veins)**2)*5.9) * (.28 + .72*gas)
lapis = np.exp(-((x+.57)**2*1.6 + (y-.13)**2*2.4)) * gas
violet = np.exp(-((x-.71)**2*1.68 + (y+.2)**2*1.9)) * gas
rose = np.exp(-((x-.95)**2*2.9 + (y+.54)**2*3.1)) * gas ** 1.25
fine = np.exp(-((bias-.29+.18*veins)**2)*19) * gas ** 2
shade = np.exp(-((x*.52)**2+(y*.6)**2)*1.34)
linear = np.zeros((h, w, 3), dtype=np.float32)
for density, tint in [
    (np.ones_like(x), (6, 7, 22)),
    (stream, (19, 22, 58)),
    (lapis, (17, 35, 89)),
    (violet, (61, 22, 80)),
    (rose, (92, 39, 40)),
    (fine, (26, 32, 64)),
]:
    linear += density[..., None]*np.array(tint)
linear = linear * shade[..., None] + 2.8 * grain[..., None]
result = Image.fromarray(np.uint8(np.clip(linear, 0, 255)))
result.save(Path(__file__).with_name("nebula.webp"), quality=87, method=6)
