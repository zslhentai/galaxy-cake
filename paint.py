import numpy as np, random, math, os, io, base64
from PIL import Image, ImageDraw, ImageFont
os.chdir(os.path.dirname(os.path.abspath(__file__)))
rng=random.Random(32)
W,H=1536,512
v,u=np.mgrid[0:1:complex(H),0:2*math.pi:complex(W)]
def field(x,y):
    return np.sin(x*3+2*np.sin(2*x+y*5)+y*9)+.55*np.sin(7*x-y*14+2*np.sin(x*3+y*12))+.3*np.cos(13*x+23*y)
f=field(u,v)
f=field(u+.24*f,v+.105*f)
band=np.exp(-((v-.73-.2*np.sin(2*u+.4)-.11*np.sin(5*u))/.17)**2)
# Twist periodic coordinates locally, preserving cylindrical continuity.
phase=u+.42*np.sin(2*u+4*v)+.16*np.sin(5*u-7*v)
ridge=v-.59-.17*np.sin(2*phase)-.11*np.cos(3*phase+5*v)
mist=np.exp(-(ridge/.22)**2)
striations=np.sin(40*ridge+3*np.sin(phase*3+8*v)+1.2*f)
filament=(.5+.5*striations)**5
def palette(t,colors):
    return np.stack([np.interp(t,np.linspace(0,1,len(colors)),[c[i] for c in colors]) for i in range(3)],-1)
arr=palette(np.clip(.15+.09*f+mist*(.27+.24*filament+.12*np.sin(5*phase)),0,1),
            [(9,12,28),(20,23,50),(49,39,87),(59,67,124),(45,108,145),(74,156,165),(191,151,137)])
arr+=((2.4*np.sin(82*ridge+5*f)+1.6*np.sin(109*f))*mist)[:,:,None]
im=Image.fromarray(np.uint8(np.clip(arr,0,255))); d=ImageDraw.Draw(im)
colors=['#fff4cb','#bbdfff','#edb45b','#426bbc','#f2d47b','#f9b4aa']
# Broken palette-knife marks follow the broad S-shaped nebula.
for i in range(640):
    x=rng.randrange(W); a=x/W*2*math.pi
    y=int(H*(.73+.20*math.sin(2*a+.4)+.11*math.sin(5*a)+rng.gauss(0,.052)))
    if not 0<=y<H: continue
    col=rng.choice(['#1e4071','#36779b','#487bb1','#738baa','#3594a6','#be9f70','#343858'])
    length=rng.uniform(2,23); slope=H/W*2*math.pi*(.40*math.cos(2*a+.4)+.55*math.cos(5*a))
    d.polygon([(x,y),(x+length*.65,y+length*slope*.65-1.5),(x+length,y+length*slope),(x+length*.3,y+length*slope*.3+1)],fill=col)
for i in range(2300):
    x=rng.randrange(W); y=rng.randrange(H); r=rng.choices([.5,1,2,3],[.52,.41,.06,.01])[0]
    d.ellipse((x-r,y-r,x+r,y+r),fill=rng.choice(colors))
for i in range(68):
    x=rng.randrange(W); y=rng.randrange(H); r=rng.uniform(2,9); n=rng.choice([4,5])
    d.polygon([(x+math.sin(j*math.pi/n)*r*(.38 if j%2 else 1),y-math.cos(j*math.pi/n)*r*(.38 if j%2 else 1)) for j in range(n*2)],fill=rng.choice(colors))
from atelier import illuminate
illuminate(im)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf',21)
d.text((W//2,H*.49),'Happy birthday',font=font,anchor='mm',fill='#ffefc7')
# Marbled buttercream, warped veins with hand-mixed pastel and saffron.
g=field(u,v+.13*np.sin(u*2)); g=field(u+.20*g,v+.06*g)
top=Image.fromarray(np.uint8(palette((np.sin(g*1.1)+1)/2,[(165,121,146),(198,154,156),(219,180,162),(234,207,177),(216,173,134),(235,207,179)])))
with open('textures.js','w') as out:
    for name,img in [('glaze',im),('cream',top.resize((768,256),Image.Resampling.LANCZOS))]:
        buf=io.BytesIO();img.save(buf,'JPEG',quality=91)
        out.write("const "+name+"='data:image/jpeg;base64,"+base64.b64encode(buf.getvalue()).decode()+"';\n")
