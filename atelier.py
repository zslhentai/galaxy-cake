"""Paint two cylindrical UV canvases. Strokes wrap cleanly at the seam."""
import math
import random
from PIL import ImageDraw

TAU = math.tau

def tint(color, factor):
    return tuple(max(0, min(255, round(v * factor))) for v in color)

def paint_stroke(draw, w, x, y, length, width, angle, bend, color, randomizer):
    """A curved palette-knife mark with a broken edge and a raised highlight."""
    c, s = math.cos(angle), math.sin(angle)
    edges = [[], []]
    for i in range(10):
        t = i / 9
        reach = length * (t - .5)
        offset = bend * math.sin(t * math.pi)
        local_width = width * math.sin(math.pi * (.06 + .88 * t)) ** .68
        for side, edge in zip((-1, 1), edges):
            v = offset + side * local_width * randomizer.uniform(.82, 1.18)
            edge.append((x + reach*c - v*s, y + reach*s + v*c))
    for shift in (-w, 0, w):
        for face, factor in [(edges[0] + list(reversed(edges[1])), .81),
                             (edges[0] + list(reversed([(a+s*width*.55,b-c*width*.55) for a,b in edges[1]])), 1.0)]:
            draw.polygon([(a+shift,b) for a,b in face], fill=tint(color,factor))
        draw.line([(a+shift,b) for a,b in edges[0][2:8]], fill=tint(color,1.18), width=max(1,int(width*.13)))

def illuminate(image):
    draw = ImageDraw.Draw(image)
    w, h = image.size
    r = random.Random(441)
    mineral = [(25,53,127),(31,79,174),(26,116,205),(23,148,186),(25,176,152),
               (56,87,145),(65,54,132),(118,81,146),(192,104,143),(214,150,91)]
    # Heavier curls of coloured glaze rise unevenly from the base.
    for i in range(210):
        x = r.uniform(0,w)
        phase = x/w*TAU
        y = h*(.85+.09*math.sin(4*phase)+.044*math.cos(7*phase))+r.gauss(0,30)
        paint_stroke(draw,w,x,y,r.uniform(20,102),r.uniform(4,19),
                     .55*math.sin(4*phase)+r.uniform(-1.15,1.05),r.uniform(-13,12),r.choice(mineral[:7]),r)
    for cx,cy,rx,ry in [(143,328,132,96),(530,341,147,107),(892,320,176,115),(1305,346,144,99)]:
        for j in range(96):
            a = r.uniform(-.5,6.7)
            distance = .3+.10*a+r.gauss(0,.10)
            x,y = cx+rx*distance*math.cos(a),cy+ry*distance*math.sin(a)
            angle = math.atan2(ry*math.cos(a),-rx*math.sin(a))
            paint_stroke(draw,w,x,y,r.uniform(7,36),r.uniform(1.5,6.5),angle,r.uniform(-3,3),r.choice(mineral),r)
    # Chipped pieces of confetti spill from the cake top down the glaze.
    sugar = [(23,139,229),(17,191,189),(251,198,58),(252,124,62),
             (218,54,115),(143,103,212),(245,213,186),(235,241,211)]
    for j in range(320):
        x = r.uniform(0,w)
        y = 15 + abs(r.gauss(0,65)) + 32*(.5+.5*math.sin(x/w*TAU*5))
        paint_stroke(draw,w,x,y,r.uniform(3,24),r.uniform(1,6),
                     r.uniform(-1.6,1.6),r.uniform(-3,3),r.choice(sugar),r)
    for j in range(68):
        x,y = r.randrange(w),r.randrange(32,h-20)
        radius = r.uniform(2.7,10.4)
        spin = r.random()*TAU
        color = r.choice(sugar)
        points = []
        for k in range(10):
            a = spin+k*TAU/10
            length = radius * (1 if k%2==0 else .41)*r.uniform(.88,1.12)
            points.append((x+length*math.cos(a),y+length*math.sin(a)))
        draw.polygon(points,fill=color)

def frost(image):
    draw=ImageDraw.Draw(image)
    w,h=image.size
    r=random.Random(29)
    colors=[(231,174,82),(237,200,128),(250,218,163),(213,155,115),(176,114,153),
            (101,132,165),(56,142,184),(110,167,158),(247,179,138),(247,218,166)]
    for _ in range(510):
        x=r.uniform(0,w)
        y=r.uniform(12,h)
        index=r.randrange(len(colors))
        if y<h*.44:
            index=r.choice([0,1,2,3,9])
        paint_stroke(draw,w,x,y,r.uniform(14,72),r.uniform(2,8),
                     r.uniform(-.46,.46),r.uniform(-7,7),colors[index],r)
