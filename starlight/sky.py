from PIL import Image,ImageDraw
from math import pi,sin,cos
import random
r=random.Random(29); w,h=780,1160
im=Image.new('RGBA',(w,h));d=ImageDraw.Draw(im)
def sparkle(x,y,s,alpha):
    pts=[]
    for i in range(8):
        a=i*pi/4;rad=s if i%2==0 else s*.18
        pts.append((x+cos(a)*rad,y+sin(a)*rad))
    d.polygon(pts,fill=(245,211,150,alpha))
for i in range(1550):
    x,y=r.randrange(w),r.randrange(h)
    a=r.randint(35,157); rad=r.choices([.6,1,1.5,2.3],[5,5,3,1])[0]
    d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=(*r.choice([(158,172,213),(235,204,154),(170,138,197)]),a))
for x,y,R in [(48,289,27),(710,238,37),(102,781,15),(645,970,18),(190,166,12),(385,90,19)]:
    d.ellipse((x-R,y-R,x+R,y+R),outline=(203,176,123,110),width=1)
    sparkle(x,y,R*1.25,213)
    for j in range(8):
        a=j*pi/4;xx=x+cos(a)*R*.86;yy=y+sin(a)*R*.86;d.ellipse((xx-1,yy-1,xx+1,yy+1),fill=(243,201,149,180))
for x,y,side in [(19,420,1),(760,706,-1),(43,935,1),(733,108,-1)]:
    nodes=[(x+side*(i*13+r.randrange(16)),y+i*15+r.randrange(28)) for i in range(7)]
    d.line(nodes,fill=(167,168,204,94),width=1)
    for i,(a,b) in enumerate(nodes):sparkle(a,b,4+i%3*2,180)
# Broken engraved arcs and index marks of the celestial chart.
for radius,lo,hi in [(338,191,254),(346,201,258),(340,277,344),(351,286,327),(355,21,64),(355,129,158)]:
    box=(390-radius,518-radius,390+radius,518+radius);d.arc(box,lo,hi,fill=(209,173,121,115),width=1)
    for deg in range(lo,hi,3):
        a=deg*pi/180;size=6 if deg%2 else 3
        d.line([(390+radius*cos(a),518+radius*sin(a)),(390+(radius+size)*cos(a),518+(radius+size)*sin(a))],fill=(189,165,133,95))
im.save('atlas.png',optimize=True)
