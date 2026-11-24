#!/usr/bin/env python3
"""
Authentic United Imaging (联影医疗) uMR Omega 3.0T 3D Model Builder (Apple-Style Minimalism)
===========================================================================================
Modeled directly from official United Imaging uMR Omega 3.0T industrial photography:
  1. Signature Asymmetric "P-Arch" White Monolithic Cabinet:
     - Vertical floor-to-roof architectural left wing (X = -1.24m) tangentially merging
       into the concentric circular right half (R = 1.04m)
     - Razor-thin brushed anodized silver-aluminum floor trim & top reveal strip
     - Enclosed Apple-white rounded-corner top cryo shroud (no exposed industrial pipes!)
  2. Protruding Concentric Pure-White Circular Front Medallion (R = 1.015m):
     - Framed 360° by a sleek brushed anodized silver-aluminum cylindrical collar
     - Dual FLUSH curved-trapezoid obsidian black-glass OLED side consoles (9 & 3 o'clock)
       bounded by concentric circles and horizontal planes — zero protruding stalks/boxes!
     - Direct-on-white alpha-masked silver 'UNITED IMAGING [U]', 'uMR Omega', 'uAIFI Inside',
       and side-wall '[U]' shield emblem (zero black billboard plates!)
  3. 75cm Ultra-Wide Pure-White Bore Funnel & Starlight Vault:
     - Seamless pure-white trumpet flare with U-shaped lower table trough
     - Delicate flush crescent ice-blue/white LED light arcs & Starlight starry-sky vault
  4. Pure Apple-White 3-Tier Stadium Patient Table:
     - Brushed anodized silver floor plate & docking bridge
     - 3-tier pure-white rounded stadium lift column (zero black rubber bellows!)
     - Sculpted white cantilevered cradle with integrated white loop handle & dove-gray pad
  5. Internal 97cm Superconducting Magnet Core (revealed in Cutaway / X-Ray mode!)
"""

import math
import os
import bpy
import bmesh
from mathutils import Vector

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEX_DIR = os.path.join(SCRIPT_DIR, "textures")
BLEND_OUT = os.path.join(SCRIPT_DIR, "mri_scanner.blend")
GLB_OUT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "public", "models", "mri_scanner.glb"))

# 1:1 Metric Coordinates (Blender: Z-up, -Y = Front -> glTF: Y-up, +Z = Front)
BORE_Z = 1.12          # Bore center height (m) — matches real uMR Omega proportions
BORE_R = 0.375         # 75.0cm clear ultra-wide bore radius!
CAB_R = 1.04           # Right circular arch radius -> roof height Z = 1.12 + 1.04 = 2.16m
MED_R = 1.005          # Protruding circular front medallion radius
COUCH_INIT_Y = -1.94   # Initial sliding tabletop center Y (= +1.94m Z in glTF)
COUCH_Z = 0.805        # Sliding tabletop base Z


# ==============================================================================
# Core Blender Helpers
# ==============================================================================
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0


def create_empty(name: str, location=(0.0, 0.0, 0.0), parent=None):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = 'PLAIN_AXES'
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
                    location=(0, 0, 0), rotation=(0, 0, 0), smooth_deg: float = 38.0):
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
    mod = obj.modifiers.new(name="Bevel", type='BEVEL')
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.angle_limit = math.radians(angle_deg)
    return mod


def create_box(name, size, location=(0, 0, 0), rotation=(0, 0, 0), material=None,
               parent=None, bevel_width=0.008, bevel_segments=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    obj = add_mesh_object(name, bm, material, parent, location, rotation)
    if bevel_width > 0:
        add_bevel(obj, width=bevel_width, segments=bevel_segments)
    return obj


def create_rounded_stadium_prism(name, width, length, height, corner_r, location=(0, 0, 0),
                                 material=None, parent=None, bevel_z=0.005, segs_corner=10):
    """
    Creates an Apple Mac-Studio-style vertical prism with super-smooth rounded XY corners
    and subtle top/bottom Z chamfers — essential for United Imaging's clean forms.
    """
    bm = bmesh.new()
    hx = max(0.001, width / 2.0 - corner_r)
    hy = max(0.001, length / 2.0 - corner_r)
    hz = height / 2.0

    # Generate 2D rounded-rect perimeter counter-clockwise
    pts_2d = []
    corners = [
        ( hx,  hy, 0.0),
        (-hx,  hy, math.pi * 0.5),
        (-hx, -hy, math.pi),
        ( hx, -hy, math.pi * 1.5),
    ]
    for cx, cy, a0 in corners:
        for s in range(segs_corner):
            ang = a0 + (math.pi * 0.5) * (s / segs_corner)
            pts_2d.append((cx + corner_r * math.cos(ang), cy + corner_r * math.sin(ang)))

    n = len(pts_2d)
    # 4 Z-stations for clean rounded top/bottom edges
    bz = min(bevel_z, hz * 0.35)
    if bz > 0.0005:
        z_levels = [
            (-hz,         1.0 - bz / corner_r if corner_r > bz else 0.96),
            (-hz + bz,    1.0),
            ( hz - bz,    1.0),
            ( hz,         1.0 - bz / corner_r if corner_r > bz else 0.96),
        ]
    else:
        z_levels = [(-hz, 1.0), (hz, 1.0)]

    rings = []
    for zv, shrink in z_levels:
        ring = []
        for px, py in pts_2d:
            # Inset slightly along corner normal for top/bottom chamfer
            dx = px - max(-hx, min(hx, px))
            dy = py - max(-hy, min(hy, py))
            dlen = math.hypot(dx, dy)
            if dlen > 1e-6 and shrink < 1.0:
                ins = bz * 0.75
                px = px - (dx / dlen) * ins
                py = py - (dy / dlen) * ins
            ring.append(bm.verts.new((px, py, zv)))
        rings.append(ring)

    for r_idx in range(len(rings) - 1):
        for i in range(n):
            ni = (i + 1) % n
            bm.faces.new((rings[r_idx][i], rings[r_idx][ni], rings[r_idx + 1][ni], rings[r_idx + 1][i]))

    # Cap bottom & top cleanly using inset center fan / grid
    c_bot = bm.verts.new((0.0, 0.0, -hz))
    c_top = bm.verts.new((0.0, 0.0,  hz))
    for i in range(n):
        ni = (i + 1) % n
        bm.faces.new((rings[0][ni], rings[0][i], c_bot))
        bm.faces.new((rings[-1][i], rings[-1][ni], c_top))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add_mesh_object(name, bm, material, parent, location, smooth_deg=42.0)


def create_cylinder(name, radius, depth, segments=32, location=(0, 0, 0), rotation=(0, 0, 0),
                    material=None, parent=None, cap_ends=True, bevel_width=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=cap_ends, cap_tris=False,
        segments=segments, radius1=radius, radius2=radius, depth=depth,
    )
    obj = add_mesh_object(name, bm, material, parent, location, rotation)
    if bevel_width > 0 and cap_ends:
        add_bevel(obj, width=bevel_width, segments=2)
    return obj


def create_torus(name, major_radius, minor_radius, major_seg=64, minor_seg=14,
                 location=(0, 0, 0), rotation=(0, 0, 0), material=None, parent=None):
    bm = bmesh.new()
    ring_verts = []
    for i in range(major_seg):
        theta = 2.0 * math.pi * i / major_seg
        ct, st = math.cos(theta), math.sin(theta)
        ring = []
        for j in range(minor_seg):
            phi = 2.0 * math.pi * j / minor_seg
            r = major_radius + minor_radius * math.cos(phi)
            ring.append(bm.verts.new((r * ct, r * st, minor_radius * math.sin(phi))))
        ring_verts.append(ring)

    for i in range(major_seg):
        ni = (i + 1) % major_seg
        for j in range(minor_seg):
            nj = (j + 1) % minor_seg
            bm.faces.new((ring_verts[i][j], ring_verts[ni][j], ring_verts[ni][nj], ring_verts[i][nj]))
    return add_mesh_object(name, bm, material, parent, location, rotation, smooth_deg=60.0)


# ==============================================================================
# Apple / United Imaging Minimalist PBR Material Library
# ==============================================================================
def load_image(filename: str, non_color: bool = False):
    path = os.path.join(TEX_DIR, filename)
    if not os.path.exists(path):
        print(f"[Warn] Missing texture: {path}")
        return None
    img = bpy.data.images.load(path, check_existing=True)
    if non_color:
        img.colorspace_settings.name = 'Non-Color'
    img.pack()
    return img


def set_bsdf_input(bsdf, names, value):
    for n in (names if isinstance(names, (list, tuple)) else [names]):
        if n in bsdf.inputs:
            bsdf.inputs[n].default_value = value
            return


def make_material(name: str, base_color=(0.96, 0.97, 0.98, 1.0), metallic=0.0, roughness=0.22,
                  emission_color=None, emission_strength=0.0, coat=0.0, coat_roughness=0.08,
                  albedo_tex=None, alpha_mask=False):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    if alpha_mask:
        mat.blend_method = 'CLIP'
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
        img = load_image(albedo_tex, non_color=False)
        if img:
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


def create_material_library():
    mats = {}
    # 1. Apple / United Imaging Pure Ceramic-White Satin Polycarbonate
    mats["shell"] = make_material(
        "Mat_MRI_Shell",
        base_color=(0.968, 0.972, 0.980, 1.0),
        metallic=0.01,
        roughness=0.20,
        coat=0.42,
        coat_roughness=0.09,
    )
    # 2. Pure Matte-Satin White Inner Bore Surface
    mats["bore"] = make_material(
        "Mat_MRI_Bore",
        base_color=(0.955, 0.962, 0.972, 1.0),
        metallic=0.0,
        roughness=0.46,
    )
    # 3. Apple MacBook-Grade Brushed Bead-Blasted Anodized Silver Aluminum
    mats["silver_alu"] = make_material(
        "Mat_MRI_Anodized_Silver",
        base_color=(0.80, 0.82, 0.85, 1.0),
        metallic=0.86,
        roughness=0.24,
    )
    # 4. Subtle Seam Shadow Silver-Gray (for delicate 3mm architectural reveals)
    mats["seam_gray"] = make_material(
        "Mat_MRI_Seam_Reveal",
        base_color=(0.56, 0.59, 0.64, 1.0),
        metallic=0.35,
        roughness=0.38,
    )
    # 5. Deep Obsidian Flush Glass (for bezel & latch pocket)
    mats["obsidian_glass"] = make_material(
        "Mat_MRI_Obsidian_Glass",
        base_color=(0.03, 0.038, 0.052, 1.0),
        metallic=0.10,
        roughness=0.06,
        coat=1.0,
        coat_roughness=0.02,
    )
    # 6. Flush OLED Console Display Glass
    mats["screen"] = make_material(
        "Mat_MRI_Screen",
        base_color=(1.0, 1.0, 1.0, 1.0),
        metallic=0.05,
        roughness=0.05,
        coat=1.0,
        coat_roughness=0.02,
        albedo_tex="touchscreen_ui.jpg",
        emission_color=None,
        emission_strength=0.95,
    )
    # 7. Alpha-Clipped Brushed Silver Brand Typography & [U] Shield Decal
    mats["brand_decal"] = make_material(
        "Mat_UIH_Brand_Decal",
        base_color=(0.45, 0.48, 0.53, 1.0),
        metallic=0.65,
        roughness=0.28,
        albedo_tex="uih_brand_decal.png",
        alpha_mask=True,
    )
    # 8. Delicate Ice-Blue / Cool-White Recessed Crescent Halo Light
    mats["halo"] = make_material(
        "Mat_MRI_Halo",
        base_color=(0.72, 0.93, 1.0, 1.0),
        roughness=0.10,
        emission_color=(0.42, 0.86, 1.0, 1.0),
        emission_strength=2.8,
    )
    # 9. Serene Starlight Bore Vault Canopy
    mats["starlight"] = make_material(
        "Mat_MRI_Starlight_Canopy",
        base_color=(1.0, 1.0, 1.0, 1.0),
        roughness=0.25,
        albedo_tex="starlight_canopy.jpg",
        emission_color=None,
        emission_strength=0.65,
    )
    # 10. Warm Dove-Gray Minimalist Comfort Mattress Pad (Linear RGB -> sRGB #959CA8!)
    mats["mattress"] = make_material(
        "Mat_MRI_Mattress",
        base_color=(0.30, 0.33, 0.38, 1.0),
        metallic=0.0,
        roughness=0.58,
    )
    # 11. Tiny Recessed Table E-Stop Red
    mats["estop_red"] = make_material(
        "Mat_MRI_EStop_Red",
        base_color=(0.82, 0.12, 0.14, 1.0),
        roughness=0.25,
    )
    # 12. Internal 97cm Superconducting Magnet Core (Cutaway / X-Ray Mode)
    mats["cryo_copper"] = make_material(
        "Mat_Cryo_Superconducting_Copper",
        base_color=(0.84, 0.46, 0.18, 1.0),
        metallic=0.95,
        roughness=0.22,
    )
    mats["cryo_gold"] = make_material(
        "Mat_Cryo_Thermal_Shield",
        base_color=(0.88, 0.68, 0.25, 1.0),
        metallic=0.92,
        roughness=0.26,
    )
    mats["cryo_steel"] = make_material(
        "Mat_Cryo_Vacuum_Vessel",
        base_color=(0.72, 0.76, 0.81, 1.0),
        metallic=0.88,
        roughness=0.26,
    )
    mats["cryo_gradient"] = make_material(
        "Mat_Cryo_Gradient_Epoxy",
        base_color=(0.12, 0.40, 0.68, 1.0),
        metallic=0.25,
        roughness=0.30,
    )
    return mats


# ==============================================================================
# 1. Signature Asymmetric "P-Arch" White Cabinet + Silver Trims + Top Shroud
# ==============================================================================
def sample_p_arch_perimeter() -> list:
    """
    Generates the exact 2D (x, z) counter-clockwise outer silhouette of the real
    United Imaging uMR Omega 3.0T main cabinet (viewed from front -Y):
      - Flat horizontal roof from (0.0, 2.16) to top-left rounded corner (-1.24, 2.16)
      - Vertical flat left architectural wall at X = -1.24m down to Z = 0.024m
      - Flat floor line along Z = 0.024m across to right recessed foot X = +0.78m
      - Smooth vertical rise on right foot meeting the R = 1.04m concentric circle
        around (0, 1.12) and sweeping smoothly back up to (0.0, 2.16)!
    """
    pts = []
    z_top = BORE_Z + CAB_R      # 2.16m
    z_bot = 0.024               # top of 24mm anodized silver floor trim
    x_left = -1.24
    x_right_foot = 0.80

    # 1. Top roof from X = -0.02 to top-left corner (-1.24, 2.16) with R=0.05m fillet
    r_tl = 0.050
    for i in range(12):
        t = i / 12.0
        pts.append((-0.02 + (x_left + r_tl + 0.02) * t, z_top))
    for i in range(9):
        ang = math.pi * 0.5 + (math.pi * 0.5) * (i / 8.0)
        pts.append((x_left + r_tl + r_tl * math.cos(ang), (z_top - r_tl) + r_tl * math.sin(ang)))

    # 2. Left vertical wall down to bottom-left corner (-1.24, 0.024) with R=0.018m fillet
    r_bl = 0.018
    for i in range(1, 15):
        t = i / 14.0
        pts.append((x_left, (z_top - r_tl) * (1 - t) + (z_bot + r_bl) * t))
    for i in range(1, 6):
        ang = math.pi + (math.pi * 0.5) * (i / 5.0)
        pts.append((x_left + r_bl + r_bl * math.cos(ang), (z_bot + r_bl) + r_bl * math.sin(ang)))

    # 3. Floor line from left to right foot (X = +0.80m)
    r_br = 0.018
    for i in range(1, 14):
        t = i / 13.0
        pts.append(((x_left + r_bl) * (1 - t) + (x_right_foot - r_br) * t, z_bot))
    for i in range(1, 6):
        ang = math.pi * 1.5 + (math.pi * 0.5) * (i / 5.0)
        pts.append(((x_right_foot - r_br) + r_br * math.cos(ang), (z_bot + r_br) + r_br * math.sin(ang)))

    # 4. Right lower foot rising to meet R=1.04m circle at X = +0.80m
    #    dz = -sqrt(1.04^2 - 0.80^2) = -0.6645 -> z_join = 1.12 - 0.6645 = 0.4555m
    theta_join = -math.acos(x_right_foot / CAB_R)  # ~ -0.693 rad (-39.7 deg)
    z_join = BORE_Z + CAB_R * math.sin(theta_join)
    for i in range(1, 7):
        t = i / 6.0
        pts.append((x_right_foot, (z_bot + r_br) * (1 - t) + z_join * t))

    # 5. Concentric circular right arch sweeping from theta_join (-39.7°) up to +90° (0.0, 2.16)
    arc_steps = 36
    for i in range(1, arc_steps):
        t = i / arc_steps
        th = theta_join + (math.pi * 0.5 - theta_join) * t
        pts.append((CAB_R * math.cos(th), BORE_Z + CAB_R * math.sin(th)))

    return pts


def build_asymmetric_cabinet(gantry_root, mats):
    pts_outer = sample_p_arch_perimeter()
    n = len(pts_outer)

    # Matching N-point inner circle (r = 0.55m, hidden behind front medallion & bore liner)
    pts_inner = []
    for px, pz in pts_outer:
        ang = math.atan2(pz - BORE_Z, px)
        pts_inner.append((0.55 * math.cos(ang), BORE_Z + 0.55 * math.sin(ang)))

    # Loft smooth quad cabinet from Y_front = -0.74m to Y_rear = +0.84m with 45mm Apple corner bevels
    bm = bmesh.new()
    # (t_outer, y_val, shrink_inset)
    stations = [
        (0.0,   0.64,  0.0),
        (0.0,  -0.64,  0.0),
        (0.35, -0.740, 0.0),
        (0.85, -0.740, 0.0),
        # 5-step smooth rounded front cabinet edge (R = 0.045m)
        (1.0,  -0.740, -0.042),
        (1.0,  -0.733, -0.022),
        (1.0,  -0.718, -0.008),
        (1.0,  -0.695,  0.000),
        # Subtle clean side panel seam at Y = +0.05
        (1.0,   0.046,  0.000),
        (1.0,   0.050, -0.003),
        (1.0,   0.054,  0.000),
        # 5-step smooth rounded rear cabinet edge (R = 0.045m)
        (1.0,   0.795,  0.000),
        (1.0,   0.818, -0.008),
        (1.0,   0.833, -0.022),
        (1.0,   0.840, -0.042),
        (0.85,  0.840,  0.0),
        (0.35,  0.840,  0.0),
    ]

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
                    dlen = max(1e-5, math.hypot(dx, dz))
                    x += (dx / dlen) * inset
                    z += (dz / dlen) * inset
            ring.append(bm.verts.new((x, y_val, z)))
        rings.append(ring)

    num_r = len(rings)
    for r_idx in range(num_r):
        nr = (r_idx + 1) % num_r
        for i in range(n):
            ni = (i + 1) % n
            bm.faces.new((rings[r_idx][i], rings[r_idx][ni], rings[nr][ni], rings[nr][i]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    cab_obj = add_mesh_object("Gantry_Shell_Main", bm, mats["shell"], gantry_root, smooth_deg=42.0)

    # --- Anodized Silver-Aluminum Floor Base Trim (Z = 0.0 to 0.024m) ---
    accents = create_empty("Gantry_Accents", parent=gantry_root)
    create_rounded_stadium_prism(
        "Gantry_Silver_Floor_Base",
        width=2.04,
        length=1.56,
        height=0.024,
        corner_r=0.048,
        location=(-0.22, 0.05, 0.012),
        material=mats["silver_alu"],
        parent=accents,
        bevel_z=0.003,
    )

    # --- Anodized Silver-Aluminum Top Roof Reveal Strip (Z = 2.160 to 2.178m) ---
    create_rounded_stadium_prism(
        "Gantry_Top_Silver_Reveal",
        width=1.20,
        length=1.54,
        height=0.018,
        corner_r=0.052,
        location=(-0.635, 0.05, 2.169),
        material=mats["silver_alu"],
        parent=accents,
        bevel_z=0.002,
    )

    # --- Pure Apple-White Enclosed Top Cryo & Electronics Shroud (matches omega_value.jpg!) ---
    create_rounded_stadium_prism(
        "Gantry_Top_Cryo_Shroud",
        width=1.06,
        length=1.38,
        height=0.20,
        corner_r=0.085,
        location=(-0.62, 0.05, 2.278),
        material=mats["shell"],
        parent=accents,
        bevel_z=0.016,
    )

    # --- Subtle Flush Lower-Left Service Access Door Hairline Outline (zero Z-fighting!) ---
    door_x, door_z, door_w, door_h, line_t = -1.02, 0.165, 0.30, 0.20, 0.0025
    for dname, sx, sz, dx, dz in (
        ("Top",    door_w, line_t, 0.0,  door_h / 2),
        ("Bottom", door_w, line_t, 0.0, -door_h / 2),
        ("Left",   line_t, door_h, -door_w / 2, 0.0),
        ("Right",  line_t, door_h,  door_w / 2, 0.0),
    ):
        create_box(
            f"Gantry_Service_Door_{dname}",
            size=(sx, 0.002, sz),
            location=(door_x + dx, -0.7418, door_z + dz),
            material=mats["seam_gray"],
            parent=accents,
            bevel_width=0.0,
        )
    # Tiny silver keyhole ring inside upper-left corner of service door (matches omega_value.jpg!)
    create_cylinder(
        "Gantry_Service_Keyhole",
        radius=0.0045, depth=0.003, segments=16,
        location=(door_x - door_w / 2 + 0.024, -0.7420, door_z + door_h / 2 - 0.024),
        rotation=(math.pi / 2, 0, 0),
        material=mats["seam_gray"],
        parent=accents,
    )

    return cab_obj, accents


# ==============================================================================
# 2. Protruding Concentric Front Medallion + Silver Collar + Flush Consoles
# ==============================================================================
def build_front_medallion_and_consoles(gantry_root, mats):
    front_group = create_empty("Gantry_Front_Panel", parent=gantry_root)

    ang_start = math.radians(-68.0)
    ang_end = math.radians(248.0)
    arc_segs = 96

    # 1. Outer 360° Brushed Anodized Silver-Aluminum Collar Ring (Y = -0.738 to -0.842m)
    bm_ring = bmesh.new()
    r_ring_out = MED_R + 0.018   # 1.023m
    r_ring_in  = MED_R - 0.014   # 0.991m
    ring_prof = [
        (r_ring_out, -0.735),
        (r_ring_out, -0.832),
        (r_ring_out - 0.005, -0.844),
        (r_ring_in  + 0.005, -0.846),
        (r_ring_in,  -0.840),
        (r_ring_in,  -0.735),
    ]
    full_segs = 96
    p_loops = []
    for rp, yp in ring_prof:
        lp = []
        for i in range(full_segs):
            th = 2.0 * math.pi * i / full_segs
            lp.append(bm_ring.verts.new((rp * math.cos(th), yp, BORE_Z + rp * math.sin(th))))
        p_loops.append(lp)
    for k in range(len(p_loops) - 1):
        for i in range(full_segs):
            ni = (i + 1) % full_segs
            bm_ring.faces.new((p_loops[k][i], p_loops[k][ni], p_loops[k + 1][ni], p_loops[k + 1][i]))
    bmesh.ops.recalc_face_normals(bm_ring, faces=bm_ring.faces)
    add_mesh_object("Medallion_Silver_Collar", bm_ring, mats["silver_alu"], front_group, smooth_deg=48.0)

    # 2. Satin-White Protruding Circular Medallion Face (r = 0.580m to 0.992m, gently crowned)
    bm_med = bmesh.new()
    r_med_in = 0.580
    r_med_out = 0.992
    med_prof = [
        (r_med_in,        -0.835),
        (r_med_in + 0.004, -0.848),
        (0.70,            -0.853),
        (0.85,            -0.851),
        (r_med_out,       -0.844),
        (r_med_out,       -0.740),
    ]
    m_loops = []
    for rp, yp in med_prof:
        lp = []
        for i in range(arc_segs + 1):
            th = ang_start + (ang_end - ang_start) * (i / arc_segs)
            lp.append(bm_med.verts.new((rp * math.cos(th), yp, BORE_Z + rp * math.sin(th))))
        m_loops.append(lp)
    for k in range(len(m_loops) - 1):
        for i in range(arc_segs):
            bm_med.faces.new((m_loops[k][i], m_loops[k][i + 1], m_loops[k + 1][i + 1], m_loops[k + 1][i]))
    for end_idx, rev in ((0, False), (arc_segs, True)):
        end_verts = [m_loops[k][end_idx] for k in range(len(m_loops))]
        if rev:
            end_verts.reverse()
        bm_med.faces.new(end_verts)
    bmesh.ops.recalc_face_normals(bm_med, faces=bm_med.faces)
    med_obj = add_mesh_object("Medallion_White_Face", bm_med, mats["shell"], front_group, smooth_deg=45.0)

    # Thin hairline circular seam ring at r = 0.579m between outer medallion & inner bore funnel
    bm_seam = bmesh.new()
    s0, s1 = [], []
    for i in range(arc_segs + 1):
        th = ang_start + (ang_end - ang_start) * (i / arc_segs)
        s0.append(bm_seam.verts.new((0.577 * math.cos(th), -0.843, BORE_Z + 0.577 * math.sin(th))))
        s1.append(bm_seam.verts.new((0.581 * math.cos(th), -0.843, BORE_Z + 0.581 * math.sin(th))))
    for i in range(arc_segs):
        bm_seam.faces.new((s0[i], s0[i + 1], s1[i + 1], s1[i]))
    bmesh.ops.recalc_face_normals(bm_seam, faces=bm_seam.faces)
    add_mesh_object("Medallion_Inner_Seam", bm_seam, mats["seam_gray"], front_group, smooth_deg=45.0)

    # 3. Dual FLUSH Curved-Trapezoid Obsidian Black-Glass Side Consoles (9 & 3 o'clock!)
    screens_root = create_empty("Gantry_Touch_Screen", parent=gantry_root)
    z_scr_bot = 1.150
    z_scr_top = 1.385
    r_scr_in  = 0.584
    r_scr_out = 0.985

    for side, sname in ((-1, "Left"), (1, "Right")):
        bm_scr = bmesh.new()
        rows_v = 12
        cols_u = 16
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
                r_cur = math.hypot(x, dz)
                t_r = (r_cur - r_med_in) / (r_med_out - r_med_in)
                y_surf = -0.8545 + 0.008 * ((t_r - 0.45) ** 2)
                u_uv = 0.5 + (x - x_mid) / 0.43
                u_uv = max(0.01, min(0.99, u_uv))
                row.append((bm_scr.verts.new((x, y_surf, z)), u_uv, v))
            grid.append(row)

        uv_l = bm_scr.loops.layers.uv.new("UVMap")
        for iv in range(rows_v):
            for iu in range(cols_u):
                p0, u0, v0 = grid[iv][iu]
                p1, u1, v1 = grid[iv][iu + 1]
                p2, u2, v2 = grid[iv + 1][iu + 1]
                p3, u3, v3 = grid[iv + 1][iu]
                f = bm_scr.faces.new((p0, p1, p2, p3))
                for lp, uv in zip(f.loops, [(u0, v0), (u1, v1), (u2, v2), (u3, v3)]):
                    lp[uv_l].uv = uv

        perim = (
            [grid[0][iu][0] for iu in range(cols_u)] +
            [grid[iv][cols_u][0] for iv in range(rows_v)] +
            [grid[rows_v][iu][0] for iu in range(cols_u, 0, -1)] +
            [grid[iv][0][0] for iv in range(rows_v, 0, -1)]
        )
        back_perim = [bm_scr.verts.new((v.co.x, v.co.y + 0.008, v.co.z)) for v in perim]
        np_len = len(perim)
        for k in range(np_len):
            nk = (k + 1) % np_len
            f_rim = bm_scr.faces.new((perim[nk], perim[k], back_perim[k], back_perim[nk]))
            for lp in f_rim.loops:
                lp[uv_l].uv = (0.01, 0.01)

        bmesh.ops.recalc_face_normals(bm_scr, faces=bm_scr.faces)
        add_mesh_object(f"Touchscreen_Flush_{sname}", bm_scr, mats["screen"], screens_root, smooth_deg=25.0)

    # 4. High-DPI Direct-on-White Alpha-Masked Silver Logos & Wordmarks (exact 2048x1024 UVs!)
    add_decal_quad(
        "Decal_Front_UnitedImaging",
        width=0.35, height=0.114,
        uv_rect=(0.160, 0.710, 0.520, 0.950),
        location=(0.01, -0.8558, 1.855),
        rotation=(0, 0, 0),
        material=mats["brand_decal"],
        parent=front_group,
    )
    # Band 2 (PIL y: 415..575 -> v: 0.438..0.595, x: 100..820 -> u: 0.049..0.400)
    add_decal_quad(
        "Decal_Wing_uMROmega",
        width=0.29, height=0.065,
        uv_rect=(0.049, 0.438, 0.400, 0.595),
        location=(-0.93, -0.7422, 1.92),
        rotation=(0, 0, 0),
        material=mats["brand_decal"],
        parent=front_group,
    )
    # Band 3 (PIL y: 725..865 -> v: 0.155..0.292, x: 100..660 -> u: 0.049..0.322)
    add_decal_quad(
        "Decal_Cheek_uAIFI",
        width=0.195, height=0.048,
        uv_rect=(0.049, 0.155, 0.322, 0.292),
        location=(0.75, -0.8562, 1.03),
        rotation=(0, 0, 0),
        material=mats["brand_decal"],
        parent=front_group,
    )
    # Band 4: Large [U] Shield on flat white left cabinet side wall (PIL y: 180..640 -> v: 0.375..0.824, x: 1520..1880 -> u: 0.742..0.918)
    add_decal_quad(
        "Decal_LeftWall_UShield",
        width=0.150, height=0.210,
        uv_rect=(0.742, 0.375, 0.918, 0.824),
        location=(-1.2418, 0.02, 1.24),
        rotation=(0, 0, -math.pi / 2),
        material=mats["brand_decal"],
        parent=front_group,
    )

    return med_obj


def add_decal_quad(name, width, height, uv_rect, location, rotation, material, parent):
    """Creates a razor-thin floating decal quad mapped to a specific UV sub-rectangle."""
    bm = bmesh.new()
    hw, hh = width / 2.0, height / 2.0
    v0 = bm.verts.new((-hw, 0.0, -hh))
    v1 = bm.verts.new(( hw, 0.0, -hh))
    v2 = bm.verts.new(( hw, 0.0,  hh))
    v3 = bm.verts.new((-hw, 0.0,  hh))
    f = bm.faces.new((v0, v1, v2, v3))
    uv_l = bm.loops.layers.uv.new("UVMap")
    u0, v_bot, u1, v_top = uv_rect
    for lp, uv in zip(f.loops, [(u0, v_bot), (u1, v_bot), (u1, v_top), (u0, v_top)]):
        lp[uv_l].uv = uv
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add_mesh_object(name, bm, material, parent, location, rotation, smooth_deg=20.0)


# ==============================================================================
# 3. Pure-White 75cm Bore Funnel, U-Trough, Flush Crescent Lights & Starlight
# ==============================================================================
def build_bore(root, mats):
    bore_group = create_empty("MRI_Bore", parent=root)

    ang_start = math.radians(-62.0)
    ang_end = math.radians(242.0)
    arc_segs = 88

    # 1. Seamless Sculpted Pure-White Front Bore Funnel + Inner Bore Tunnel + Rear Funnel
    bm = bmesh.new()
    # Smooth Apple-like trumpet curve from r = 0.576m (front) -> r = 0.375m (bore) -> rear
    funnel_stations = [
        (0.576, -0.740),
        (0.576, -0.846),
        (0.550, -0.848),
        (0.505, -0.834),
        (0.455, -0.800),
        (0.415, -0.748),
        (0.388, -0.680),
        (BORE_R, -0.580),
        (BORE_R,  0.580),
        (0.392,  0.680),
        (0.435,  0.755),
        (0.495,  0.815),
        (0.555,  0.842),
        (0.555,  0.740),
    ]
    f_loops = []
    for rp, yp in funnel_stations:
        lp = []
        for i in range(arc_segs + 1):
            th = ang_start + (ang_end - ang_start) * (i / arc_segs)
            lp.append(bm.verts.new((rp * math.cos(th), yp, BORE_Z + rp * math.sin(th))))
        f_loops.append(lp)

    for k in range(len(f_loops) - 1):
        for i in range(arc_segs):
            # Inward-facing bore & outward-facing funnel normals handled automatically
            bm.faces.new((f_loops[k][i], f_loops[k + 1][i], f_loops[k + 1][i + 1], f_loops[k][i + 1]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # Note: funnel faces face -Y / inward toward bore axis; flip if needed so inward normals face axis!
    # Check middle bore face normal: at theta=0 (x=+BORE_R), inward normal should have nx < 0
    for f in bm.faces:
        c = f.calc_center_median()
        if -0.65 < c.y < 0.65:
            if f.normal.x * c.x + f.normal.z * (c.z - BORE_Z) > 0:
                f.normal_flip()
        elif c.y <= -0.65:
            if f.normal.y > 0 and abs(c.y + 0.74) > 0.02:
                f.normal_flip()
    bore_lining = add_mesh_object("Bore_Lining", bm, mats["bore"], bore_group, smooth_deg=55.0)

    # 2. Clean U-Shaped White Bore Lower Trough Walls & Bridge (matches omega_value.jpg!)
    # Connects bottom-left & bottom-right edges of the bore opening down to the table dock!
    create_rounded_stadium_prism(
        "Bore_Lower_U_Trough_Bed",
        width=0.66,
        length=1.68,
        height=0.055,
        corner_r=0.03,
        location=(0, -0.02, 0.765),
        material=mats["shell"],
        parent=bore_group,
        bevel_z=0.006,
    )
    for side, sname in ((-1, "Left"), (1, "Right")):
        create_box(
            f"Bore_Trough_Cheek_{sname}",
            size=(0.045, 1.66, 0.16),
            location=(side * 0.332, -0.02, 0.835),
            material=mats["shell"],
            parent=bore_group,
            bevel_width=0.010,
        )

    # 3. Whisper-Thin Flush 12-o'clock Laser Slit Window on Upper Bore Funnel
    create_box(
        "Bore_Flush_Laser_Slit",
        size=(0.14, 0.012, 0.006),
        location=(0.0, -0.822, 1.605),
        rotation=(math.radians(24), 0, 0),
        material=mats["seam_gray"],
        parent=bore_group,
        bevel_width=0.001,
    )

    # 4. Delicate Flush Crescent Ice-Blue / White LED Arc Strips inside Bore Rim!
    #    (Matches omega_value.jpg & omega_banner.png — refined thin crescents, not chunky neon rings!)
    bm_halo = bmesh.new()
    for a_deg_0, a_deg_1 in ((144, 214), (-34, 36)):
        h_segs = 28
        r_h = 0.438
        l0, l1 = [], []
        for i in range(h_segs + 1):
            th = math.radians(a_deg_0 + (a_deg_1 - a_deg_0) * (i / h_segs))
            l0.append(bm_halo.verts.new((r_h * math.cos(th), -0.778, BORE_Z + r_h * math.sin(th))))
            l1.append(bm_halo.verts.new(((r_h + 0.009) * math.cos(th), -0.785, BORE_Z + (r_h + 0.009) * math.sin(th))))
        for i in range(h_segs):
            f = bm_halo.faces.new((l0[i], l1[i], l1[i + 1], l0[i + 1]))
            # Ensure face points inward/forward (-Y and toward bore center)
            if f.normal.y > 0:
                f.normal_flip()
    add_mesh_object("Bore_Halo_Light", bm_halo, mats["halo"], bore_group, smooth_deg=55.0)

    # 5. Calming Starlight Bore Ceiling Vault Canopy
    bm_star = bmesh.new()
    s_arc, s_y = 24, 6
    r_star = BORE_R - 0.003
    sa0, sa1 = math.radians(48), math.radians(132)
    sgrid = []
    for iy in range(s_y + 1):
        v = iy / s_y
        yp = -0.55 + 1.10 * v
        row = []
        for ia in range(s_arc + 1):
            u = ia / s_arc
            th = sa0 + (sa1 - sa0) * u
            row.append((bm_star.verts.new((r_star * math.cos(th), yp, BORE_Z + r_star * math.sin(th))), u, v))
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
    add_mesh_object("Bore_Starlight_Canopy", bm_star, mats["starlight"], bore_group, smooth_deg=60.0)

    return bore_lining


# ==============================================================================
# 4. Internal 97cm Superconducting Magnet Core (For Cutaway / X-Ray Mode!)
# ==============================================================================
def build_internal_cryostat(root, mats):
    cryo = create_empty("MRI_Internal_Cryostat", parent=root)

    for idx, cy in enumerate((-0.48, -0.29, -0.10, 0.10, 0.29, 0.48)):
        create_torus(
            f"Cryo_Main_NbTi_Coil_{idx+1}",
            major_radius=0.66, minor_radius=0.052,
            major_seg=52, minor_seg=14,
            location=(0, cy, BORE_Z), rotation=(math.pi / 2, 0, 0),
            material=mats["cryo_copper"], parent=cryo,
        )
    for idx, cy in enumerate((-0.38, 0.38)):
        create_torus(
            f"Cryo_Shield_Coil_{idx+1}",
            major_radius=0.84, minor_radius=0.042,
            major_seg=52, minor_seg=12,
            location=(0, cy, BORE_Z), rotation=(math.pi / 2, 0, 0),
            material=mats["cryo_gold"], parent=cryo,
        )
    for bi in range(8):
        ang = 2.0 * math.pi * bi / 8 + math.pi / 8
        create_cylinder(
            f"Cryo_Support_Strut_{bi+1}",
            radius=0.016, depth=1.12, segments=12,
            location=(0.74 * math.cos(ang), 0.0, BORE_Z + 0.74 * math.sin(ang)),
            rotation=(math.pi / 2, 0, 0),
            material=mats["cryo_steel"], parent=cryo,
        )
    grad_cyl = create_cylinder(
        "Cryo_Gradient_Coil_Barrel",
        radius=0.50, depth=1.08, segments=48,
        location=(0, 0.0, BORE_Z), rotation=(math.pi / 2, 0, 0),
        material=mats["cryo_gradient"], parent=cryo, cap_ends=False,
    )
    sol = grad_cyl.modifiers.new("Solidify", type='SOLIDIFY')
    sol.thickness = 0.022

    for end_name, cy in (("Front", -0.42), ("Rear", 0.42)):
        create_torus(
            f"Cryo_RF_Birdcage_EndRing_{end_name}",
            major_radius=0.425, minor_radius=0.009,
            major_seg=40, minor_seg=10,
            location=(0, cy, BORE_Z), rotation=(math.pi / 2, 0, 0),
            material=mats["cryo_copper"], parent=cryo,
        )
    for ri in range(8):
        ang = 2.0 * math.pi * ri / 8
        create_box(
            f"Cryo_RF_Birdcage_Rung_{ri+1}",
            size=(0.018, 0.84, 0.006),
            location=(0.425 * math.cos(ang), 0.0, BORE_Z + 0.425 * math.sin(ang)),
            rotation=(0, -ang + math.pi / 2, 0),
            material=mats["cryo_copper"], parent=cryo, bevel_width=0.0,
        )
    # Enclosed internal 4K coldhead & quench manifold inside the top white shroud
    create_cylinder(
        "Cryo_Internal_Coldhead",
        radius=0.075, depth=0.36, segments=24,
        location=(-0.48, 0.08, 2.12),
        material=mats["cryo_steel"], parent=cryo,
    )
    return cryo


# ==============================================================================
# 5. Authentic Pure Apple-White 3-Tier Patient Table (Matches omega_value.jpg!)
# ==============================================================================
def build_patient_table(root, mats):
    table_root = create_empty("MRI_Patient_Table", parent=root)
    base_group = create_empty("Table_Base", parent=table_root)

    col_y = -2.02

    # 1. Brushed Anodized Silver-Aluminum Floor Base Plate + Gantry Docking Bridge!
    create_rounded_stadium_prism(
        "Table_Silver_Floor_Plate",
        width=0.64,
        length=1.42,
        height=0.036,
        corner_r=0.068,
        location=(0, col_y, 0.018),
        material=mats["silver_alu"],
        parent=base_group,
        bevel_z=0.005,
    )
    # Sleek silver docking tongue extending from column plate right into gantry base
    create_rounded_stadium_prism(
        "Table_Silver_Docking_Bridge",
        width=0.54,
        length=0.72,
        height=0.026,
        corner_r=0.035,
        location=(0, -1.08, 0.013),
        material=mats["silver_alu"],
        parent=base_group,
        bevel_z=0.004,
    )
    for side, sname in ((-1, "Left"), (1, "Right")):
        create_box(
            f"Table_Docking_GuideRib_{sname}",
            size=(0.022, 0.56, 0.018),
            location=(side * 0.24, -1.06, 0.032),
            material=mats["silver_alu"],
            parent=base_group,
            bevel_width=0.004,
        )

    # 2. Pure-White 3-Tier Telescoping Rounded Stadium Column (ZERO black rubber bellows!)
    tiers = [
        ("Tier1_Lower", 0.52, 1.18, 0.245, 0.160),
        ("Tier2_Mid",   0.54, 1.22, 0.235, 0.404),
        ("Tier3_Upper", 0.56, 1.26, 0.245, 0.648),
    ]
    for tname, tw, tl, th, tz in tiers:
        create_rounded_stadium_prism(
            f"Table_Column_{tname}",
            width=tw,
            length=tl,
            height=th,
            corner_r=0.078,
            location=(0, col_y, tz),
            material=mats["shell"],
            parent=base_group,
            bevel_z=0.006,
        )
    # Delicate recessed silver shadow reveal seams between the 3 pure-white tiers
    for sz in (0.284, 0.524):
        create_rounded_stadium_prism(
            f"Table_Column_Reveal_{sz:.2f}",
            width=0.51,
            length=1.16,
            height=0.006,
            corner_r=0.074,
            location=(0, col_y, sz),
            material=mats["seam_gray"],
            parent=base_group,
            bevel_z=0.0,
        )

    # --- B. Pure-White Sculpted Cantilevered Sliding Tabletop (Table_Couch_Movable) ---
    couch = create_empty("Table_Couch_Movable", location=(0, COUCH_INIT_Y, COUCH_Z), parent=table_root)

    # Main pure-white rounded cantilevered cradle body (width 0.63m, length 2.34m)
    create_rounded_stadium_prism(
        "Couch_White_Cradle",
        width=0.63,
        length=2.34,
        height=0.096,
        corner_r=0.055,
        location=(0, 0.0, 0.018),
        material=mats["shell"],
        parent=couch,
        bevel_z=0.018,
    )
    # Raised smooth white side bolster rails framing the dove-gray comfort mattress
    for side, sname in ((-1, "Left"), (1, "Right")):
        create_rounded_stadium_prism(
            f"Couch_White_SideRail_{sname}",
            width=0.068,
            length=2.22,
            height=0.032,
            corner_r=0.024,
            location=(side * 0.278, 0.02, 0.068),
            material=mats["shell"],
            parent=couch,
            bevel_z=0.008,
        )
        # Tiny discreet recessed red table E-stop button near head end (omega_value.jpg!)
        create_cylinder(
            f"Couch_Side_EStop_{sname}",
            radius=0.011,
            depth=0.012,
            segments=18,
            location=(side * 0.314, 0.96, 0.018),
            rotation=(0, math.pi / 2, 0),
            material=mats["estop_red"],
            parent=couch,
        )

    # Integrated Sculpted Pure-White Foot-End Grab Loop Handle (matches omega_value.jpg!)
    handle_y = -1.22
    for side, sname in ((-1, "Left"), (1, "Right")):
        create_rounded_stadium_prism(
            f"Couch_Handle_Arm_{sname}",
            width=0.058,
            length=0.14,
            height=0.056,
            corner_r=0.020,
            location=(side * 0.175, handle_y + 0.03, 0.024),
            material=mats["shell"],
            parent=couch,
            bevel_z=0.010,
        )
    create_rounded_stadium_prism(
        "Couch_Handle_LoopBar",
        width=0.41,
        length=0.058,
        height=0.048,
        corner_r=0.022,
        location=(0, handle_y - 0.02, 0.028),
        material=mats["shell"],
        parent=couch,
        bevel_z=0.012,
    )
    # Centered dark-slate touch latch pocket underneath loop bar (omega_front_crop.png!)
    create_box(
        "Couch_Handle_LatchPocket",
        size=(0.11, 0.042, 0.024),
        location=(0, handle_y - 0.015, 0.006),
        material=mats["obsidian_glass"],
        parent=couch,
        bevel_width=0.004,
    )

    # Flush Warm Dove-Gray / Light-Silver Comfort Pad (Table_Mattress)
    create_rounded_stadium_prism(
        "Table_Mattress",
        width=0.47,
        length=1.88,
        height=0.028,
        corner_r=0.024,
        location=(0, -0.06, 0.072),
        material=mats["mattress"],
        parent=couch,
        bevel_z=0.007,
    )

    # Minimalist Pure-White Contoured Head Rest Cradle at bore end of couch
    create_rounded_stadium_prism(
        "Table_Head_Cradle_Base",
        width=0.34,
        length=0.30,
        height=0.034,
        corner_r=0.028,
        location=(0, 1.03, 0.074),
        material=mats["shell"],
        parent=couch,
        bevel_z=0.006,
    )
    create_rounded_stadium_prism(
        "Table_Head_Pillow",
        width=0.26,
        length=0.24,
        height=0.026,
        corner_r=0.032,
        location=(0, 1.03, 0.098),
        material=mats["mattress"],
        parent=couch,
        bevel_z=0.008,
    )

    return table_root, couch


# ==============================================================================
# 6. Apple-White Minimalist uAIFI RF Coils (Clean & Toggleable!)
# ==============================================================================
def build_curved_arch(name, rx, rz, length_y, thickness, ang0_deg, ang1_deg,
                      material, parent, location=(0, 0, 0), segs_arc=26, segs_y=6):
    bm = bmesh.new()
    outer_g, inner_g = [], []
    a0, a1 = math.radians(ang0_deg), math.radians(ang1_deg)
    for iy in range(segs_y + 1):
        y = (iy / segs_y - 0.5) * length_y
        ro, ri = [], []
        for ia in range(segs_arc + 1):
            ang = a0 + (a1 - a0) * (ia / segs_arc)
            ca, sa = math.cos(ang), math.sin(ang)
            ro.append(bm.verts.new((rx * ca, y, rz * sa)))
            ri.append(bm.verts.new(((rx - thickness) * ca, y, (rz - thickness) * sa)))
        outer_g.append(ro)
        inner_g.append(ri)
    for iy in range(segs_y):
        for ia in range(segs_arc):
            bm.faces.new((outer_g[iy][ia], outer_g[iy][ia + 1], outer_g[iy + 1][ia + 1], outer_g[iy + 1][ia]))
            bm.faces.new((inner_g[iy][ia], inner_g[iy + 1][ia], inner_g[iy + 1][ia + 1], inner_g[iy][ia + 1]))
    for ia in range(segs_arc):
        bm.faces.new((outer_g[0][ia], inner_g[0][ia], inner_g[0][ia + 1], outer_g[0][ia + 1]))
        bm.faces.new((outer_g[-1][ia], outer_g[-1][ia + 1], inner_g[-1][ia + 1], inner_g[-1][ia]))
    for iy in range(segs_y):
        bm.faces.new((outer_g[iy][0], outer_g[iy + 1][0], inner_g[iy + 1][0], inner_g[iy][0]))
        bm.faces.new((outer_g[iy][-1], inner_g[iy][-1], inner_g[iy + 1][-1], outer_g[iy + 1][-1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add_mesh_object(name, bm, material, parent, location, smooth_deg=45.0)


def build_rf_coils(couch_parent, mats):
    acc_group = create_empty("MRI_Accessories", parent=couch_parent)

    # A. Sleek Pure-White uAIFI Open-Vision Head/Neck Coil
    head_coil = create_empty("Coil_Head_Matrix", location=(0, 1.03, 0.088), parent=acc_group)
    build_curved_arch(
        "HeadCoil_Superior_Arch",
        rx=0.148, rz=0.148, length_y=0.080, thickness=0.018,
        ang0_deg=6, ang1_deg=174,
        material=mats["shell"], parent=head_coil, location=(0, 0.095, 0.075),
    )
    build_curved_arch(
        "HeadCoil_Inferior_Arch",
        rx=0.152, rz=0.136, length_y=0.068, thickness=0.018,
        ang0_deg=10, ang1_deg=170,
        material=mats["shell"], parent=head_coil, location=(0, -0.095, 0.072),
    )
    create_rounded_stadium_prism(
        "HeadCoil_Nasal_Bridge",
        width=0.028, length=0.16, height=0.018, corner_r=0.008,
        location=(0, 0.0, 0.214), material=mats["shell"], parent=head_coil,
    )
    for side, sname in ((-1, "Left"), (1, "Right")):
        create_rounded_stadium_prism(
            f"HeadCoil_Side_Support_{sname}",
            width=0.024, length=0.26, height=0.075, corner_r=0.010,
            location=(side * 0.142, 0.0, 0.048), material=mats["shell"], parent=head_coil,
        )

    # B. Ultra-Clean Pure-White / Silver uAIFI SuperFlex Blanket Coil (toggleable!)
    body_coil = create_empty("Coil_Body_Array", location=(0, 0.22, 0.085), parent=acc_group)
    build_curved_arch(
        "BodyCoil_SuperFlex_Blanket",
        rx=0.228, rz=0.145, length_y=0.44, thickness=0.012,
        ang0_deg=18, ang1_deg=162,
        material=mats["shell"], parent=body_coil, location=(0, 0.0, 0.010),
    )
    for sy in (-0.13, 0.13):
        build_curved_arch(
            f"BodyCoil_Silver_Band_{sy:.2f}",
            rx=0.231, rz=0.148, length_y=0.018, thickness=0.004,
            ang0_deg=12, ang1_deg=168,
            material=mats["silver_alu"], parent=body_coil, location=(0, sy, 0.010),
        )

    return acc_group


# ==============================================================================
# Build & Export Ultra-Fast GLB
# ==============================================================================
def build_mri_scanner():
    print("[UIH Apple-Style Builder] Resetting Blender scene...")
    reset_scene()
    mats = create_material_library()

    mri_root = create_empty("MRI_Root", location=(0, 0, 0))

    print("[UIH Apple-Style Builder] Building Asymmetric P-Arch White Cabinet...")
    gantry_group = create_empty("MRI_Gantry", parent=mri_root)
    build_asymmetric_cabinet(gantry_group, mats)

    print("[UIH Apple-Style Builder] Building Protruding Circular Medallion & Flush Consoles...")
    build_front_medallion_and_consoles(gantry_group, mats)

    print("[UIH Apple-Style Builder] Building 75cm Pure-White Bore & Starlight Vault...")
    build_bore(mri_root, mats)

    print("[UIH Apple-Style Builder] Building Internal 97cm Superconducting Core...")
    build_internal_cryostat(mri_root, mats)

    print("[UIH Apple-Style Builder] Building Pure-White 3-Tier Patient Table...")
    _, couch = build_patient_table(mri_root, mats)

    print("[UIH Apple-Style Builder] Building Minimalist White uAIFI RF Coils...")
    build_rf_coils(couch, mats)

    bpy.context.view_layer.update()
    print(f"[UIH Apple-Style Builder] Saving Blender file: {BLEND_OUT}")
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)

    depsgraph = bpy.context.evaluated_depsgraph_get()
    total_tris, total_meshes = 0, 0
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            ev = obj.evaluated_get(depsgraph)
            me = ev.to_mesh()
            me.calc_loop_triangles()
            total_tris += len(me.loop_triangles)
            total_meshes += 1
            ev.to_mesh_clear()
    print(f"[UIH Apple-Style Builder] Summary: {total_meshes} meshes, {total_tris:,} triangles")

    os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=GLB_OUT,
        export_format='GLB',
        use_selection=False,
        export_yup=True,
        export_apply=True,
        export_materials='EXPORT',
        export_image_format='AUTO',   # Preserves RGBA PNG alpha decal + compact JPEGs!
        export_normals=True,
        export_tangents=False,
        export_extras=False,
        export_lights=False,
        export_cameras=False,
        export_draco_mesh_compression_enable=False,
    )
    size_kb = os.path.getsize(GLB_OUT) / 1024.0
    print(f"[UIH Apple-Style Builder] Exported GLB: {GLB_OUT} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    build_mri_scanner()
