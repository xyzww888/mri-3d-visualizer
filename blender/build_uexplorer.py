#!/usr/bin/env python3
"""
Authentic United Imaging uEXPLORER® (探索者 Total-Body PET/CT) & uCT 960+ Builder
=================================================================================
Apple / UIH Industrial Minimalism — Full Blender 4.x Parametric Pipeline

Usage in Cloud Blender environment:
  1. Generate 2K decals, 4-panel OLED UI & Starlight textures first:
       python blender/generate_uexplorer_textures.py

  2. Build & export MI Flagship — uEXPLORER Total-Body PET/CT:
       blender --background --python blender/build_uexplorer.py
       -> Saves `blender/uexplorer.blend` & `public/models/uexplorer.glb`

  3. Build & export Derived CT — uCT 960+ Wide-Bore Helical CT:
       blender --background --python blender/build_uexplorer.py -- --ct-only
       -> Saves `blender/uct_scanner.blend` & `public/models/uct_scanner.glb`
"""

import math
import os
import sys
import bpy
import bmesh

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(SCRIPT_DIR, "textures")
OUT_MODELS_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "public", "models"))
os.makedirs(OUT_MODELS_DIR, exist_ok=True)

CT_ONLY = "--ct-only" in sys.argv

# 1:1 Metric Coordinates (Blender: Z-up, -Y = Front -> glTF: +Y Up, +Z Front)
BORE_Z = 1.12
BORE_R = 0.410 if CT_ONLY else 0.380   # 82cm for uCT 960+, 76cm for uEXPLORER
CAB_R = 1.08 if CT_ONLY else 1.05
MED_R = 1.02 if CT_ONLY else 1.005


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def create_empty(name: str, location=(0.0, 0.0, 0.0), parent=None):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.2
    obj.location = location
    bpy.context.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    return obj


def set_smooth_shading(obj, auto_smooth_deg: float = 38.0):
    mesh = obj.data
    if not isinstance(mesh, bpy.types.Mesh):
        return
    mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    if hasattr(mesh, "use_auto_smooth"):
        mesh.use_auto_smooth = True
        mesh.auto_smooth_angle = math.radians(auto_smooth_deg)
    mesh.update()


def add_mesh_object(name: str, bm: bmesh.types.BMesh, material=None, parent=None,
                    location=(0, 0, 0), rotation=(0, 0, 0), smooth_deg: float = 40.0):
    mesh = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    obj.rotation_euler = rotation
    bpy.context.collection.objects.link(obj)
    if parent:
        obj.parent = parent
    if material:
        obj.data.materials.append(material)
    set_smooth_shading(obj, smooth_deg)
    return obj


def add_bevel(obj, width=0.008, segments=3, angle_deg=30.0):
    mod = obj.modifiers.new(name="Bevel", type="BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(angle_deg)
    return mod


def create_rounded_stadium_prism(name, width, length, height, corner_r, location=(0, 0, 0),
                                 material=None, parent=None, bevel_z=0.006, segs_corner=10):
    bm = bmesh.new()
    hx = max(0.001, width / 2.0 - corner_r)
    hy = max(0.001, length / 2.0 - corner_r)
    hz = height / 2.0

    pts_2d = []
    corners = [
        (hx, hy, 0.0),
        (-hx, hy, math.pi * 0.5),
        (-hx, -hy, math.pi),
        (hx, -hy, math.pi * 1.5),
    ]
    for cx, cy, a0 in corners:
        for s in range(segs_corner):
            ang = a0 + (math.pi * 0.5) * (s / segs_corner)
            pts_2d.append((cx + corner_r * math.cos(ang), cy + corner_r * math.sin(ang)))

    n = len(pts_2d)
    bz = min(bevel_z, hz * 0.35)
    z_levels = [(-hz, 0.96), (-hz + bz, 1.0), (hz - bz, 1.0), (hz, 0.96)] if bz > 0.0005 else [(-hz, 1.0), (hz, 1.0)]

    rings = []
    for zv, shrink in z_levels:
        ring = []
        for px, py in pts_2d:
            if shrink < 1.0:
                dx = px - max(-hx, min(hx, px))
                dy = py - max(-hy, min(hy, py))
                dlen = math.hypot(dx, dy)
                if dlen > 1e-6:
                    px -= (dx / dlen) * (bz * 0.75)
                    py -= (dy / dlen) * (bz * 0.75)
            ring.append(bm.verts.new((px, py, zv)))
        rings.append(ring)

    for r_idx in range(len(rings) - 1):
        for i in range(n):
            ni = (i + 1) % n
            bm.faces.new((rings[r_idx][i], rings[r_idx][ni], rings[r_idx + 1][ni], rings[r_idx + 1][i]))

    c_bot = bm.verts.new((0.0, 0.0, -hz))
    c_top = bm.verts.new((0.0, 0.0, hz))
    for i in range(n):
        ni = (i + 1) % n
        bm.faces.new((rings[0][ni], rings[0][i], c_bot))
        bm.faces.new((rings[-1][i], rings[-1][ni], c_top))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add_mesh_object(name, bm, material, parent, location, smooth_deg=42.0)


def create_cylinder(name, radius, depth, segments=28, location=(0, 0, 0), rotation=(0, 0, 0),
                    material=None, parent=None, bevel_width=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segments,
                          radius1=radius, radius2=radius, depth=depth)
    obj = add_mesh_object(name, bm, material, parent, location, rotation)
    if bevel_width > 0:
        add_bevel(obj, width=bevel_width, segments=2)
    return obj


def set_bsdf_input(bsdf, names, value):
    for n in (names if isinstance(names, (list, tuple)) else [names]):
        if n in bsdf.inputs:
            bsdf.inputs[n].default_value = value
            return


def make_material(name: str, base_color=(0.965, 0.972, 0.982, 1.0), metallic=0.0,
                  roughness=0.20, coat=0.0, coat_roughness=0.08, emission_color=None,
                  emission_strength=0.0, albedo_tex=None, alpha_mask=False):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    if alpha_mask:
        mat.blend_method = "CLIP"
        mat.alpha_threshold = 0.35

    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (100, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    set_bsdf_input(bsdf, "Base Color", base_color)
    set_bsdf_input(bsdf, "Metallic", metallic)
    set_bsdf_input(bsdf, "Roughness", roughness)
    set_bsdf_input(bsdf, ["Coat Weight", "Clearcoat"], coat)
    set_bsdf_input(bsdf, ["Coat Roughness", "Clearcoat Roughness"], coat_roughness)

    if emission_color is not None and emission_strength > 0:
        set_bsdf_input(bsdf, ["Emission Color", "Emission"], emission_color)
        set_bsdf_input(bsdf, "Emission Strength", emission_strength)

    if albedo_tex:
        tex_path = os.path.join(TEX_DIR, albedo_tex)
        if os.path.exists(tex_path):
            img = bpy.data.images.load(tex_path, check_existing=True)
            img.pack()
            tex = nt.nodes.new("ShaderNodeTexImage")
            tex.image = img
            tex.location = (-320, 160)
            nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
            if alpha_mask:
                nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
            if emission_strength > 0 and emission_color is None:
                em_inp = bsdf.inputs.get("Emission Color") or bsdf.inputs.get("Emission")
                if em_inp:
                    nt.links.new(tex.outputs["Color"], em_inp)
                set_bsdf_input(bsdf, "Emission Strength", emission_strength)
    return mat


def build_materials():
    return {
        "shell": make_material("Mat_MRI_Shell", (0.968, 0.972, 0.980, 1.0), 0.01, 0.20, coat=0.42),
        "bore": make_material("Mat_MRI_Bore", (0.952, 0.960, 0.972, 1.0), 0.0, 0.45),
        "silver": make_material("Mat_MRI_Anodized_Silver", (0.80, 0.82, 0.86, 1.0), 0.86, 0.23),
        "seam": make_material("Mat_MRI_Seam_Reveal", (0.42, 0.45, 0.50, 1.0), 0.35, 0.38),
        "screen": make_material("Mat_MRI_Screen", (1.0, 1.0, 1.0, 1.0), 0.05, 0.05, coat=1.0,
                                albedo_tex="uexplorer_touchscreen_ui.jpg", emission_strength=0.95),
        "decal": make_material("Mat_UIH_Brand_Decal", (0.45, 0.48, 0.53, 1.0), 0.65, 0.28,
                               albedo_tex="uih_uexplorer_decal.png", alpha_mask=True),
        "halo": make_material("Mat_MRI_Halo", (0.70, 0.92, 1.0, 1.0), 0.0, 0.10,
                              emission_color=(0.40, 0.85, 1.0, 1.0), emission_strength=2.8),
        "starlight": make_material("Mat_MRI_Starlight_Canopy", (1.0, 1.0, 1.0, 1.0), 0.0, 0.25,
                                   albedo_tex="starlight_canopy.jpg", emission_strength=0.68),
        "carbon": make_material("Mat_Carbon_Fiber_Pallet", (0.09, 0.11, 0.14, 1.0), 0.22, 0.30, coat=0.35),
        "mattress": make_material("Mat_MRI_Mattress", (0.34, 0.37, 0.42, 1.0), 0.0, 0.58),
        "estop": make_material("Mat_MRI_EStop_Red", (0.84, 0.12, 0.14, 1.0), 0.05, 0.25),
        "rotor_alu": make_material("Mat_CT_SlipRing_Alloy", (0.74, 0.78, 0.83, 1.0), 0.90, 0.22),
        "copper": make_material("Mat_CT_XRay_Copper", (0.85, 0.46, 0.18, 1.0), 0.94, 0.20),
        "gold_lyso": make_material("Mat_Detector_LYSO_Gold", (0.88, 0.70, 0.26, 1.0), 0.88, 0.24),
        "sipm_teal": make_material("Mat_SiPM_Digital_Readout", (0.10, 0.46, 0.58, 1.0), 0.55, 0.28),
        "hv_dark": make_material("Mat_CT_HV_Generator", (0.18, 0.23, 0.30, 1.0), 0.65, 0.30),
    }


def add_decal_quad(name, width, height, uv_rect, location, rotation, material, parent):
    bm = bmesh.new()
    hw, hh = width / 2.0, height / 2.0
    v0 = bm.verts.new((-hw, 0.0, -hh))
    v1 = bm.verts.new((hw, 0.0, -hh))
    v2 = bm.verts.new((hw, 0.0, hh))
    v3 = bm.verts.new((-hw, 0.0, hh))
    f = bm.faces.new((v0, v1, v2, v3))
    uv_l = bm.loops.layers.uv.new("UVMap")
    u0, v_bot, u1, v_top = uv_rect
    for lp, uv in zip(f.loops, [(u0, v_bot), (u1, v_bot), (u1, v_top), (u0, v_top)]):
        lp[uv_l].uv = uv
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add_mesh_object(name, bm, material, parent, location, rotation, smooth_deg=20.0)


def build_flush_touchscreens(parent, mats, y_face: float, name_prefix: str, face_front=True):
    z_scr_bot, z_scr_top = 1.145, 1.380
    r_scr_in, r_scr_out = 0.590, 0.980
    for side, sname in ((-1, "Left"), (1, "Right")):
        bm_scr = bmesh.new()
        rows_v, cols_u = 10, 14
        grid = []
        dz_mid = 0.5 * (z_scr_bot + z_scr_top) - BORE_Z
        xc_in = side * math.sqrt(r_scr_in ** 2 - dz_mid ** 2)
        xc_out = side * math.sqrt(r_scr_out ** 2 - dz_mid ** 2)
        x_mid = 0.5 * (xc_in + xc_out)

        for iv in range(rows_v + 1):
            v = iv / rows_v
            z = z_scr_bot + v * (z_scr_top - z_scr_bot)
            dz = z - BORE_Z
            x_a = side * math.sqrt(r_scr_out ** 2 - dz ** 2)
            x_b = side * math.sqrt(r_scr_in ** 2 - dz ** 2)
            x_left, x_right = (x_a, x_b) if x_a < x_b else (x_b, x_a)
            row = []
            for iu in range(cols_u + 1):
                u = iu / cols_u
                x = x_left + u * (x_right - x_left)
                u_uv = max(0.01, min(0.99, 0.5 + (x - x_mid) / 0.43))
                row.append((bm_scr.verts.new((x, y_face, z)), u_uv, v))
            grid.append(row)

        uv_l = bm_scr.loops.layers.uv.new("UVMap")
        for iv in range(rows_v):
            for iu in range(cols_u):
                p0, u0, v0 = grid[iv][iu]
                p1, u1, v1 = grid[iv][iu + 1]
                p2, u2, v2 = grid[iv + 1][iu + 1]
                p3, u3, v3 = grid[iv + 1][iu]
                verts = (p0, p1, p2, p3) if face_front else (p0, p3, p2, p1)
                uvs = [(u0, v0), (u1, v1), (u2, v2), (u3, v3)] if face_front else [(u0, v0), (u3, v3), (u2, v2), (u1, v1)]
                f = bm_scr.faces.new(verts)
                for lp, uv in zip(f.loops, uvs):
                    lp[uv_l].uv = uv
        bmesh.ops.recalc_face_normals(bm_scr, faces=bm_scr.faces)
        add_mesh_object(f"{name_prefix}_{sname}", bm_scr, mats["screen"], parent, smooth_deg=25.0)


def sample_p_arch_perimeter(x_left=-1.24, z_bot=0.026):
    pts = []
    z_top = BORE_Z + CAB_R
    x_right_foot = 0.80
    r_tl = 0.052
    for i in range(12):
        t = i / 12.0
        pts.append((-0.02 + (x_left + r_tl + 0.02) * t, z_top))
    for i in range(9):
        ang = math.pi * 0.5 + (math.pi * 0.5) * (i / 8.0)
        pts.append((x_left + r_tl + r_tl * math.cos(ang), (z_top - r_tl) + r_tl * math.sin(ang)))
    r_bl = 0.020
    for i in range(1, 13):
        t = i / 12.0
        pts.append((x_left, (z_top - r_tl) * (1 - t) + (z_bot + r_bl) * t))
    for i in range(1, 6):
        ang = math.pi + (math.pi * 0.5) * (i / 5.0)
        pts.append((x_left + r_bl + r_bl * math.cos(ang), (z_bot + r_bl) + r_bl * math.sin(ang)))
    r_br = 0.020
    for i in range(1, 13):
        t = i / 12.0
        pts.append(((x_left + r_bl) * (1 - t) + (x_right_foot - r_br) * t, z_bot))
    for i in range(1, 6):
        ang = math.pi * 1.5 + (math.pi * 0.5) * (i / 5.0)
        pts.append(((x_right_foot - r_br) + r_br * math.cos(ang), (z_bot + r_br) + r_br * math.sin(ang)))
    theta_join = -math.acos(x_right_foot / CAB_R)
    z_join = BORE_Z + CAB_R * math.sin(theta_join)
    for i in range(1, 6):
        t = i / 5.0
        pts.append((x_right_foot, (z_bot + r_br) * (1 - t) + z_join * t))
    arc_steps = 36
    for i in range(1, arc_steps):
        t = i / arc_steps
        th = theta_join + (math.pi * 0.5 - theta_join) * t
        pts.append((CAB_R * math.cos(th), BORE_Z + CAB_R * math.sin(th)))
    return pts


def build_lofted_cabinet(name, y_front, y_rear, inner_r, mat, parent):
    pts_outer = sample_p_arch_perimeter()
    n = len(pts_outer)
    pts_inner = [(inner_r * math.cos(math.atan2(pz - BORE_Z, px)),
                  BORE_Z + inner_r * math.sin(math.atan2(pz - BORE_Z, px)))
                 for px, pz in pts_outer]
    bev = 0.042
    stations = [
        (0.0, y_rear - bev, 0.0),
        (0.0, y_front + bev, 0.0),
        (0.38, y_front, 0.0),
        (0.86, y_front, 0.0),
        (1.0, y_front, -bev * 0.9),
        (1.0, y_front + bev * 0.35, -bev * 0.35),
        (1.0, y_front + bev, 0.0),
        (1.0, y_rear - bev, 0.0),
        (1.0, y_rear - bev * 0.35, -bev * 0.35),
        (1.0, y_rear, -bev * 0.9),
        (0.86, y_rear, 0.0),
        (0.38, y_rear, 0.0),
    ]
    bm = bmesh.new()
    rings = []
    for t_out, y_val, inset in stations:
        ring = []
        for i in range(n):
            ox, oz = pts_outer[i]
            ix, iz = pts_inner[i]
            if t_out < 1.0:
                x = ix + (ox - ix) * t_out
                z = iz + (oz - iz) * t_out
            else:
                x, z = ox, oz
                if inset != 0.0:
                    dx, dz = ox, oz - BORE_Z
                    dl = max(1e-5, math.hypot(dx, dz))
                    x += (dx / dl) * inset
                    z += (dz / dl) * inset
            ring.append(bm.verts.new((x, y_val, z)))
        rings.append(ring)
    nr = len(rings)
    for r_i in range(nr):
        nr_i = (r_i + 1) % nr
        for i in range(n):
            ni = (i + 1) % n
            bm.faces.new((rings[r_i][i], rings[r_i][ni], rings[nr_i][ni], rings[nr_i][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add_mesh_object(name, bm, mat, parent, smooth_deg=42.0)


def create_annular_ring(name, r_in, r_out, y0, y1, mat, parent, z_center=BORE_Z, segs=64, th0=0.0, th1=2 * math.pi):
    bm = bmesh.new()
    full = abs((th1 - th0) - 2 * math.pi) < 1e-4
    cnt = segs if full else segs + 1
    prof = [(r_in, y0), (r_in, y1), (r_out, y1), (r_out, y0)]
    loops = []
    for rad, yv in prof:
        lp = []
        for i in range(cnt):
            th = th0 + (th1 - th0) * (i / segs)
            lp.append(bm.verts.new((rad * math.cos(th), yv, z_center + rad * math.sin(th))))
        loops.append(lp)
    for p in range(4):
        np_i = (p + 1) % 4
        for i in range(segs):
            ni = (i + 1) % cnt if full else i + 1
            bm.faces.new((loops[p][i], loops[p][ni], loops[np_i][ni], loops[np_i][i]))
    if not full:
        for end_idx, rev in ((0, False), (segs, True)):
            ev = [loops[k][end_idx] for k in range(4)]
            if rev:
                ev.reverse()
            bm.faces.new(ev)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add_mesh_object(name, bm, mat, parent, smooth_deg=48.0)


def build_bore_tunnel(parent, mats, y_front, y_rear):
    bore_grp = create_empty("MRI_Bore", parent=parent)
    bm = bmesh.new()
    segs = 72
    stations = [
        (0.565, y_front + 0.08),
        (0.565, y_front),
        (BORE_R + 0.11, y_front + 0.03),
        (BORE_R + 0.04, y_front + 0.10),
        (BORE_R, y_front + 0.22),
        (BORE_R, y_rear - 0.22),
        (BORE_R + 0.04, y_rear - 0.10),
        (BORE_R + 0.11, y_rear - 0.03),
        (0.555, y_rear),
    ]
    loops = []
    for rad, yv in stations:
        lp = [bm.verts.new((rad * math.cos(2 * math.pi * i / segs), yv, BORE_Z + rad * math.sin(2 * math.pi * i / segs)))
              for i in range(segs)]
        loops.append(lp)
    for s in range(len(loops) - 1):
        for i in range(segs):
            ni = (i + 1) % segs
            bm.faces.new((loops[s][i], loops[s + 1][i], loops[s + 1][ni], loops[s][ni]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        c = f.calc_center_median()
        if (y_front + 0.2) < c.y < (y_rear - 0.2):
            if f.normal.x * c.x + f.normal.z * (c.z - BORE_Z) > 0:
                f.normal_flip()
    add_mesh_object("Bore_Lining", bm, mats["bore"], bore_grp, smooth_deg=55.0)

    # Starlight ceiling canopy inside bore
    bm_star = bmesh.new()
    s_arc, s_y = 24, 8
    r_star = BORE_R - 0.003
    sa0, sa1 = math.radians(48), math.radians(132)
    sgrid = []
    for iy in range(s_y + 1):
        v = iy / s_y
        yp = (y_front + 0.28) + (y_rear - y_front - 0.56) * v
        row = [(bm_star.verts.new((r_star * math.cos(sa0 + (sa1 - sa0) * (ia / s_arc)), yp,
                                   BORE_Z + r_star * math.sin(sa0 + (sa1 - sa0) * (ia / s_arc)))), ia / s_arc, v)
               for ia in range(s_arc + 1)]
        sgrid.append(row)
    uv_s = bm_star.loops.layers.uv.new("UVMap")
    for iy in range(s_y):
        for ia in range(s_arc):
            p0, u0, v0 = sgrid[iy][ia]
            p1, u1, v1 = sgrid[iy][ia + 1]
            p2, u2, v2 = sgrid[iy + 1][ia + 1]
            p3, u3, v3 = sgrid[iy + 1][ia]
            f = bm_star.faces.new((p0, p3, p2, p1))
            for lp, uv in zip(f.loops, [(u0, v0), (u3, v3), (u2, v2), (u1, v1)]):
                lp[uv_s].uv = uv
    add_mesh_object("Bore_Starlight_Canopy", bm_star, mats["starlight"], bore_grp, smooth_deg=60.0)


def build_scene():
    reset_scene()
    mats = build_materials()
    root = create_empty("UCT_Root" if CT_ONLY else "UEXPLORER_Root")

    # 1. Front CT Gantry Unit (Blender -Y = glTF +Z Front)
    ct_unit = create_empty("Gantry_CT_Front_Unit", parent=root)
    y_ct_front = -0.48 if CT_ONLY else -1.38
    y_ct_rear = 0.48 if CT_ONLY else -0.54
    cab_name = "Gantry_Shell_Main" if CT_ONLY else "CT_Shell_Main"
    build_lofted_cabinet(cab_name, y_ct_front, y_ct_rear, 0.54, mats["shell"], ct_unit)

    create_rounded_stadium_prism("CT_Silver_Floor_Base", 2.06, y_ct_rear - y_ct_front - 0.02, 0.026, 0.048,
                                 location=(-0.21, 0.5 * (y_ct_front + y_ct_rear), 0.013),
                                 material=mats["silver"], parent=ct_unit)

    y_med_face = y_ct_front - 0.086
    create_annular_ring("Medallion_Silver_Collar", MED_R - 0.014, MED_R + 0.020, y_med_face, y_ct_front + 0.004, mats["silver"], ct_unit, segs=84)
    create_annular_ring("Medallion_White_Face", 0.565, MED_R - 0.013, y_med_face + 0.002, y_ct_front, mats["shell"], ct_unit, segs=84)
    create_annular_ring("Bore_Halo_Light", BORE_R + 0.052, BORE_R + 0.068, y_med_face + 0.028, y_med_face + 0.052, mats["halo"], ct_unit, segs=56)

    ts_grp = create_empty("Gantry_Touch_Screen", parent=ct_unit)
    build_flush_touchscreens(ts_grp, mats, y_med_face - 0.002, "Touchscreen_Flush", face_front=True)

    # High-DPI Brand Decals
    add_decal_quad("Decal_Front_UnitedImaging", 0.35, 0.114, (0.04, 0.68, 0.52, 0.95),
                   (0.01, y_med_face - 0.003, 1.855), (0, 0, 0), mats["decal"], ct_unit)
    wing_uv = (0.04, 0.12, 0.42, 0.32) if CT_ONLY else (0.04, 0.40, 0.48, 0.60)
    add_decal_quad("Decal_Wing_ModelName", 0.33, 0.068, wing_uv,
                   (-0.91, y_ct_front - 0.002, 1.92), (0, 0, 0), mats["decal"], ct_unit)
    add_decal_quad("Decal_LeftWall_UShield", 0.15, 0.21, (0.74, 0.35, 0.92, 0.84),
                   (-1.242, 0.5 * (y_ct_front + y_ct_rear), 1.24), (0, 0, -math.pi / 2), mats["decal"], ct_unit)

    # Rotating CT Slip-Ring + X-Ray Tube + HV Tank + Curved Z-Detector Arc
    y_rotor = 0.0 if CT_ONLY else -0.96
    rotor_parent = create_empty("MRI_Internal_Cryostat", parent=ct_unit) if CT_ONLY else ct_unit
    rotor = create_empty("CT_Internal_Rotor", location=(0, y_rotor, BORE_Z), parent=rotor_parent)
    create_annular_ring("CT_SlipRing_Drum", 0.59, 0.68, -0.22, 0.22, mats["rotor_alu"], rotor, z_center=0.0, segs=64)
    create_cylinder("CT_XRay_Tube_Assembly", 0.118, 0.44, 24, (0, 0, 0.77), (0, math.pi / 2, 0), mats["copper"], rotor, 0.012)
    create_rounded_stadium_prism("CT_HV_Generator_Tank", 0.30, 0.34, 0.22, 0.03, (0.68, 0, -0.32), mats["hv_dark"], rotor)
    create_rounded_stadium_prism("CT_Tube_HeatExchanger", 0.28, 0.32, 0.20, 0.03, (-0.68, 0, -0.32), mats["hv_dark"], rotor)
    det_name = "CT_ZDetector_WideArc_320Row" if CT_ONLY else "CT_ZDetector_Arc_80Row"
    create_annular_ring(det_name, 0.53, 0.585, -0.18, 0.18, mats["gold_lyso"], rotor, z_center=0.0,
                        segs=36, th0=math.radians(-142), th1=math.radians(-38))

    if CT_ONLY:
        build_bore_tunnel(ct_unit, mats, y_med_face, y_ct_rear)
    else:
        # 2. Rear 194cm 8-Ring Total-Body PET Gantry Unit
        pet_unit = create_empty("Gantry_PET_Rear_Unit", parent=root)
        build_lofted_cabinet("Gantry_Shell_Main", -0.525, 1.66, 0.52, mats["shell"], pet_unit)
        create_annular_ring("Tandem_Service_Seam_Trim", 0.54, 1.035, -0.541, -0.524, mats["seam"], pet_unit, segs=64)

        create_rounded_stadium_prism("PET_Silver_Floor_Base", 2.06, 2.18, 0.026, 0.048, (-0.21, 0.57, 0.013), mats["silver"], pet_unit)
        for rx in (-0.68, 0.52):
            create_rounded_stadium_prism(f"PET_Tandem_Rail_{rx:.2f}", 0.055, 2.85, 0.022, 0.008, (rx, -0.22, 0.014), mats["silver"], pet_unit)

        create_rounded_stadium_prism("PET_Top_Silver_Reveal", 1.16, 2.02, 0.018, 0.052, (-0.62, 0.56, 2.178), mats["silver"], pet_unit)
        create_rounded_stadium_prism("Gantry_Top_Cryo_Shroud", 1.08, 1.92, 0.19, 0.085, (-0.62, 0.56, 2.275), mats["shell"], pet_unit, bevel_z=0.015)

        # Rear Medallion & Panels 3 & 4 of Four Touchscreen Control Panels
        create_annular_ring("Rear_Silver_Collar", 0.98, 1.02, 1.655, 1.700, mats["silver"], pet_unit, segs=64)
        create_annular_ring("Rear_Medallion_Face", 0.555, 0.98, 1.660, 1.698, mats["shell"], pet_unit, segs=64)
        build_flush_touchscreens(ts_grp, mats, 1.702, "Touchscreen_Rear", face_front=False)

        build_bore_tunnel(pet_unit, mats, y_med_face, 1.698)

        # Internal 8 PET Detector Rings (24 Modules/Ring) + Chilled-Water Manifold
        cryo = create_empty("MRI_Internal_Cryostat", parent=pet_unit)
        for r_idx in range(8):
            yc = -0.28 + r_idx * 0.2428
            for m_idx in range(24):
                ang = 2 * math.pi * m_idx / 24
                rm = 0.432
                mod = create_rounded_stadium_prism(
                    f"PET_R{r_idx+1}_M{m_idx+1}", 0.095, 0.226, 0.068, 0.008,
                    location=(rm * math.cos(ang), yc, BORE_Z + rm * math.sin(ang)),
                    material=mats["gold_lyso"], parent=cryo, segs_corner=3
                )
                mod.rotation_euler = (0, ang - math.pi / 2, 0)
            create_annular_ring(f"PET_Cooling_Loop_{r_idx+1}", 0.512, 0.530, yc - 0.016, yc + 0.016, mats["copper"], cryo, segs=48)
        create_cylinder("PET_Top_Chiller_Drum", 0.085, 1.35, 24, (-0.58, 0.56, 2.24), (math.pi / 2, 0, 0), mats["copper"], cryo)

    # 3. Carbon-Fiber Cantilever Patient Table
    table_root = create_empty("MRI_Patient_Table", parent=root)
    base = create_empty("Table_Base", parent=table_root)
    y_col = -1.80 if CT_ONLY else -2.62

    create_rounded_stadium_prism("Table_Silver_Floor_Plate", 0.65, 1.88, 0.036, 0.066, (0, y_col + 0.10, 0.018), mats["silver"], base)
    create_rounded_stadium_prism("Table_Silver_Docking_Bridge", 0.54, 0.56, 0.024, 0.032, (0, y_ct_front - 0.18, 0.012), mats["silver"], base)
    for tname, tw, tl, th, tz in (("Tier1", 0.52, 1.30, 0.245, 0.155), ("Tier2", 0.54, 1.35, 0.240, 0.395), ("Tier3", 0.56, 1.40, 0.245, 0.635)):
        create_rounded_stadium_prism(f"Table_Column_{tname}", tw, tl, th, 0.075, (0, y_col, tz), mats["shell"], base)

    couch = create_empty("Table_Couch_Movable", location=(0, y_col + 0.10, 0.785), parent=table_root)
    pallet_len = 2.24 if CT_ONLY else 2.52
    create_rounded_stadium_prism("Couch_CarbonFiber_Pallet", 0.49, pallet_len, 0.038, 0.045, (0, 0.10, 0.025), mats["carbon"], couch)
    create_rounded_stadium_prism("Couch_White_Rear_Cradle", 0.62, 1.15, 0.076, 0.052, (0, -0.58, 0.0), mats["shell"], couch)
    create_rounded_stadium_prism("Table_Mattress", 0.45, pallet_len - 0.22, 0.032, 0.040, (0, 0.08, 0.056), mats["mattress"], couch)
    create_rounded_stadium_prism("Table_Head_Cradle", 0.28, 0.30, 0.055, 0.035, (0, 1.02 if CT_ONLY else 1.16, 0.075), mats["mattress"], couch)

    for side, sname in ((-1, "Left"), (1, "Right")):
        create_cylinder(f"Couch_Side_EStop_{sname}", 0.012, 0.016, 16, (side * 0.315, -0.22, 0.012), (0, math.pi / 2, 0), mats["estop"], couch)

    blend_name = "uct_scanner.blend" if CT_ONLY else "uexplorer.blend"
    glb_name = "uct_scanner.glb" if CT_ONLY else "uexplorer.glb"
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SCRIPT_DIR, blend_name))
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT_MODELS_DIR, glb_name),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_normals=True,
        export_draco_mesh_compression_enable=False,
    )
    print(f"[Builder] Saved {blend_name} & exported {glb_name} successfully.")


if __name__ == "__main__":
    build_scene()
