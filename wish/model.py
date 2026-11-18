import bpy, math, os, json
from math import sin, cos, pi
os.chdir(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.read_factory_settings(use_empty=True)
models={}
def vessel(name, rings, organic=False):
    n=160
    points=[]; uv=[]; idx=[]
    for r,y in rings:
        for i in range(n+1):
            a=2*pi*i/n
            ripple=(.006*sin(7*a+y*3)+.004*cos(13*a-y)) if organic else 0
            rr=r*(1+ripple)
            h=y+(.012*sin(8*a)+.008*sin(15*a))*(r**3)*min(1,y) if organic else y
            points.append([round(rr*sin(a),5),round(h,5),round(rr*cos(a),5)])
            uv.append([i/n,y/1.44])
    for row in range(len(rings)-1):
        for i in range(n):
            v=row*(n+1)+i
            idx.extend([v,v+1,v+n+1,v+1,v+n+2,v+n+1])
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([(x,-z,y) for x,y,z in points],[],[idx[i:i+3] for i in range(0,len(idx),3)])
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    for p in mesh.polygons:p.use_smooth=True
    models[name]=[points,uv,idx]
vessel('Glaze',[(.94,.075),(.986,.09),(1,.13),(1.005,.26),(1.002,.64),(1.004,1.08),(1,1.35),(.992,1.40),(.96,1.435),(.9,1.44)],True)
vessel('Porcelain',[(.001,-.065),(.93,-.065),(1,-.053),(1.40,.004),(1.49,.035),(1.51,.061),(1.505,.08),(1.48,.09),(1.40,.077),(1.12,.042),(.96,.04),(.001,.04)])
open('model.js','w').write('const models='+json.dumps(models,separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath('Cake.blend'))
