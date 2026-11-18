"""Gouache ribbons, gilt vines and engraved celestial ornaments on the glaze."""
import math, random
from PIL import ImageDraw
def illuminate(image):
    pen=ImageDraw.Draw(image); w,h=image.size; r=random.Random(441); tau=math.tau
    shades=['#376784','#55789c','#8980ae','#528b97','#43517d','#ae8d9a','#40617a']
    # Asymmetric folds following three local spiral centres. Split bristles vary in width.
    for cx,cy,rx,ry in [(217,265,192,97),(711,288,219,124),(1220,220,186,99)]:
        for _ in range(740):
            a=r.uniform(-1,7); radial=.09+.109*a+r.uniform(-.21,.21)
            if radial<.02:continue
            yj=r.gauss(0,5); xj=r.gauss(0,7); length=r.uniform(.035,.28)
            pts=[]
            for j in range(8):
                t=a+length*j/7; rr=radial+.1*(t-a)
                pts.append((cx+rx*rr*math.cos(t)+xj,cy+ry*rr*math.sin(t)+yj))
            pen.line(pts,fill=r.choice(shades),width=r.choices([2,3,5,7],[5,5,3,1])[0])
    def leaf(x,y,angle,L,b):
        dx,dy=math.cos(angle),math.sin(angle)
        polygon=[]
        for side in [1,-1]:
            for j in (range(13) if side==1 else reversed(range(13))):
                t=j/12; v=b*math.sin(math.pi*t)*side+L*.10*math.sin(math.pi*t)
                polygon.append((x+dx*t*L-dy*v,y+dy*t*L+dx*v))
        pen.polygon(polygon,fill=r.choice(['#84809c','#a98880','#708c98','#87859e']),outline='#d4b685')
        pen.line([(x,y),(x+dx*L,y+dy*L)],fill='#e0bf85',width=1)
    for k in range(9):
        x=k*w/9+6; base=440+r.uniform(-24,24); pts=[]
        for j in range(61):
            t=j/60; pts.append((x+115*t+24*math.sin(t*5),base-126*t+12*math.sin(t*7)))
        pen.line(pts,fill='#c4a575',width=2)
        for j in range(7,59,7):
            px,py=pts[j];leaf(px,py,-.65+(.94 if j%2 else -1.41),r.uniform(12,25),r.uniform(2,4.6))
    for k in range(7):
        x=int((k+.28)*w/7);y=int(117+40*math.sin(k*1.8));R=r.randint(11,19)
        pen.ellipse((x-R,y-R,x+R,y+R),outline='#947a65',width=1)
        for j in range(12):
            a=j*tau/12;rr=R*(1.6 if j%3==0 else .78);pen.line([(x,y),(x+rr*math.cos(a),y+rr*math.sin(a))],fill='#e9c786',width=2 if j%3==0 else 1)
        pen.ellipse((x-3,y-3,x+3,y+3),fill='#ffe6ad')
