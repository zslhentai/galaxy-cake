"""Model sugar ornaments in Blender and export the evaluated meshes for Three.js."""
import json
import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parent
TAU = math.tau
materials = {
    "Gilded sugar": ((1, .64, .22, 1), .57),
    "Moon pearl": ((.95, .84, .59, 1), .22),
    "Sapphire sugar": ((.11, .27, .59, 1), .18),
}
bpy.ops.wm.open_mainfile(filepath=str(ROOT.parent / 'Cake.blend'))
assets = bpy.data.collections.new('Celestial sugarwork')
bpy.context.scene.collection.children.link(assets)


def make_mesh(name, positions, polygons, material, bevel=0):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(positions, [], polygons)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    assets.objects.link(obj)
    mat = bpy.data.materials.get(material)
    if mat is None:
        color, metallic = materials[material]
        mat = bpy.data.materials.new(material)
        mat.diffuse_color = color
        mat.metallic = metallic
        mat.roughness = .32
    mesh.materials.append(mat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj['pastry_material'] = material
    if bevel:
        mod = obj.modifiers.new('Softened sugar edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 3
        mod.affect = 'EDGES'
    return obj


def sugar_shape(name, outline, center, turn, tilt, depth, edge, material):
    n = len(outline)
    orientation = Matrix.Rotation(turn, 3, 'Z') @ Matrix.Rotation(tilt, 3, 'X')
    verts = [orientation @ Vector((x, z, y)) + Vector(center)
             for z in (-depth / 2, depth / 2) for x, y in outline]
    faces = [tuple(range(n)), tuple(range(2*n - 1, n - 1, -1))]
    faces.extend((i, n+i, n+(i+1)%n, (i+1)%n) for i in range(n))
    obj = make_mesh(name, verts, faces, material, edge)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')


def crescent(radius, spin):
    # Outer and inner circles share their endpoints so both sugar tips taper.
    a = math.radians(57)
    tip_x, tip_y = math.cos(a), math.sin(a)
    inner_x = .39
    theta = math.atan2(tip_y, tip_x - inner_x)
    size = math.hypot(tip_x - inner_x, tip_y)
    outer = [(math.cos(a+(TAU-2*a)*j/45), math.sin(a+(TAU-2*a)*j/45)) for j in range(46)]
    inner = [(inner_x + size*math.cos(-theta-(TAU-2*theta)*j/37), size*math.sin(-theta-(TAU-2*theta)*j/37))
             for j in range(1, 37)]
    return [(radius*(x*math.cos(spin) - y*math.sin(spin)), radius*(x*math.sin(spin) + y*math.cos(spin)))
            for x, y in outer+inner]


def star(radius, points, phase=.0):
    return [
        (math.sin(j*math.pi/points+phase)*r, math.cos(j*math.pi/points+phase)*r*(1.27 if points == 4 else 1))
        for j in range(points*2) for r in [radius*(.36 if j%2 else 1)]
    ]


def tube(name, path, thickness, material, sides=7, closed=False):
    verts = []
    for i, p in enumerate(path):
        before = path[(i-1) % len(path)] if closed else path[max(0, i-1)]
        after = path[(i+1) % len(path)] if closed else path[min(len(path)-1, i+1)]
        direction = (after - before).normalized()
        u = direction.cross(Vector((0, 0, 1))).normalized()
        v = direction.cross(u)
        for side in range(sides):
            a = side * TAU / sides
            verts.append(p + thickness * (math.cos(a)*u + math.sin(a)*v))
    faces = []
    for i in range(len(path) if closed else len(path)-1):
        j = (i+1) % len(path)
        for s in range(sides):
            faces.append((i*sides+s, i*sides+(s+1)%sides, j*sides+(s+1)%sides, j*sides+s))
    if not closed:
        faces.extend((tuple(range(sides-1, -1, -1)), tuple(range(len(verts)-sides, len(verts)))))
    make_mesh(name, verts, faces, material)


sugar_shape('Crescent in gold sugar', crescent(.232, -.28), (.49, .064, 1.685),
            -.22, .15, .048, .012, 'Gilded sugar')
sugar_shape('Moonstone companion', star(.092, 4, .1), (.25, .035, 1.81),
            -.36, .12, .025, .008, 'Moon pearl')
sugar_shape('Blue sugar star', star(.15, 5, .22), (-.48, .09, 1.59),
            .35, -.29, .047, .012, 'Sapphire sugar')
sugar_shape('Gilded evening star', star(.125, 4, -.29), (-.42, -.35, 1.63),
            .78, .36, .039, .01, 'Gilded sugar')
sugar_shape('Pearlescent star', star(.105, 5, .19), (.24, -.53, 1.59),
            -.52, .32, .037, .007, 'Moon pearl')

for index in range(9):
    a = (index + .5) * TAU / 9
    z = .239 + (.07 if index % 2 == 0 else 0)
    radius = .027 + (.012 if index % 3 == 0 else 0)
    # Shape stands flush to the glaze, aligned to the nearest tangent plane.
    sugar_shape(f'Pressed gold star {index+1}', star(radius, 4, .15),
                (1.008 * math.sin(a), 1.008 * math.cos(a), z), -a, .02, .008, .002, 'Gilded sugar')


for index, level in enumerate((.106, .146, 1.344)):
    def filament(a):
        r = 1.005 + .009*math.sin(7*a+level*3) + .004*math.cos(13*a-level)
        wave = (.011+.005*index)*math.sin(6*a+index*.86) + .004*math.sin(13*a)
        return Vector((r*math.sin(a), r*math.cos(a), level+wave))
    tube(f'Piped metallic rim {index+1}', [filament(j*TAU/138) for j in range(138)],
         (.008, .0043, .0052)[index], 'Gilded sugar', sides=5, closed=True)


def helix(t):
    a = t * TAU * 4.45
    radius = .052 - .01 * t
    return Vector((math.sin(a)*radius, math.cos(a)*radius, 1.515+.771*t))


tube('Candle gold spiral', [helix(j/144) for j in range(145)], .0049, 'Gilded sugar', sides=6)


def export(obj, graph):
    evaluated = obj.evaluated_get(graph)
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    positions = [round(value, 5) for v in mesh.vertices for value in (v.co.x, v.co.z, -v.co.y)]
    indices = [index for tri in mesh.loop_triangles for index in tri.vertices]
    result = [obj['pastry_material'], positions, indices]
    evaluated.to_mesh_clear()
    return result


graph = bpy.context.evaluated_depsgraph_get()
batches = {}
for obj in assets.objects:
    material, positions, faces = export(obj, graph)
    merged_positions, merged_faces = batches.setdefault(material, ([], []))
    offset = len(merged_positions) // 3
    merged_positions.extend(positions)
    merged_faces.extend(index + offset for index in faces)
out = [[material, *batch] for material, batch in batches.items()]
(ROOT / 'adornments.js').write_text('const blenderAdornments = ' + json.dumps(out, separators=(',', ':')) + ';\n')
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'Cake.blend'), compress=True)
