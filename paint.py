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
val=np.clip((f+1.9)/3.8,0,1)*band
def palette(t,colors):
    return np.stack([np.interp(t,np.linspace(0,1,len(colors)),[c[i] for c in colors]) for i in range(3)],-1)
arr=palette(val,[(9,12,29),(19,24,56),(28,46,94),(28,94,154),(26,153,177),(113,131,206),(201,152,196)])
arr+=((np.sin(34*f+3*np.sin(11*u))*2.8+np.sin(76*f)*2)*(.2+band))[:,:,None]
im=Image.fromarray(np.uint8(np.clip(arr,0,255))); d=ImageDraw.Draw(im)
colors=['#fff4cb','#bbdfff','#edb45b','#426bbc','#f2d47b','#f9b4aa']
# Broken palette-knife marks follow the broad S-shaped nebula.
for i in range(1600):
    x=rng.randrange(W); a=x/W*2*math.pi
    y=int(H*(.73+.20*math.sin(2*a+.4)+.11*math.sin(5*a)+rng.gauss(0,.052)))
    if not 0<=y<H: continue
    col=rng.choice(['#1e4071','#36779b','#487bb1','#738baa','#3594a6','#be9f70','#343858'])
    length=rng.uniform(2,23); slope=H/W*2*math.pi*(.40*math.cos(2*a+.4)+.55*math.cos(5*a))
    d.polygon([(x,y),(x+length*.65,y+length*slope*.65-1.5),(x+length,y+length*slope),(x+length*.3,y+length*slope*.3+1)],fill=col)
for i in range(3100):
    x=rng.randrange(W); y=rng.randrange(H); r=rng.choices([.5,1,2,3],[.52,.41,.06,.01])[0]
    d.ellipse((x-r,y-r,x+r,y+r),fill=rng.choice(colors))
for i in range(125):
    x=rng.randrange(W); y=rng.randrange(H); r=rng.uniform(2,9); n=rng.choice([4,5])
    d.polygon([(x+math.sin(j*math.pi/n)*r*(.38 if j%2 else 1),y-math.cos(j*math.pi/n)*r*(.38 if j%2 else 1)) for j in range(n*2)],fill=rng.choice(colors))
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf',21)
d.text((W//2,H*.49),'Happy birthday',font=font,anchor='mm',fill='#ffefc7')
# Marbled buttercream, warped veins with hand-mixed pastel and saffron.
g=field(u,v+.13*np.sin(u*2)); g=field(u+.20*g,v+.06*g)
top=Image.fromarray(np.uint8(palette((np.sin(g*1.1)+1)/2,[(175,104,166),(238,162,178),(255,207,163),(255,229,164),(247,194,104),(255,234,181)])))
with open('textures.js','w') as out:
    for name,img in [('glaze',im),('cream',top)]:
        buf=io.BytesIO();img.save(buf,'JPEG',quality=95)
        out.write("const "+name+"='data:image/jpeg;base64,"+base64.b64encode(buf.getvalue()).decode()+"';\n")
