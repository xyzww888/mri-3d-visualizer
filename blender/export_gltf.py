"""
Blender Automated glTF/GLB Exporter for MRI 3D Visualizer.

Usage:
1. Inside Blender Scripting workspace:
   Open this script and click 'Run Script'.
2. Or from command line:
   blender your_scene.blend --background --python export_gltf.py

Output:
   Exports optimized GLB to `../public/models/mri_scanner.glb`
"""

import bpy
import os

def export_mri_gltf():
    # Resolve output directory
    script_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.getcwd()
    output_dir = os.path.abspath(os.path.join(script_dir, "..", "public", "models"))
    os.makedirs(output_dir, exist_ok=True)
    output_filepath = os.path.join(output_dir, "mri_scanner.glb")

    print(f"[MRI Exporter] Export target: {output_filepath}")

    # Ensure in Object Mode
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    # Deselect all and select meshes for export
    bpy.ops.object.select_all(action='SELECT')

    # glTF Export options
    export_args = {
        'filepath': output_filepath,
        'export_format': 'GLB',
        'use_selection': False, # Export whole scene or set True for selection only
        'export_yup': True,
        'export_apply': True, # Apply modifiers
        'export_materials': 'EXPORT',
        'export_colors': True,
        'export_normals': True,
        'export_tangents': True,
        'export_draco_mesh_compression_enable': True,
        'export_draco_mesh_compression_level': 7,
        'export_draco_position_quantization': 14,
        'export_draco_normal_quantization': 10,
        'export_draco_texcoord_quantization': 12,
        'export_extras': True,
        'export_lights': False,
        'export_cameras': False
    }

    try:
        # Check if Draco compression is supported in this Blender version
        bpy.ops.export_scene.gltf(**export_args)
        print(f"[MRI Exporter] Successfully exported with Draco compression to: {output_filepath}")
    except Exception as e:
        print(f"[MRI Exporter] Draco export failed ({e}), falling back to standard GLB...")
        export_args['export_draco_mesh_compression_enable'] = False
        bpy.ops.export_scene.gltf(**export_args)
        print(f"[MRI Exporter] Successfully exported standard GLB to: {output_filepath}")

if __name__ == "__main__":
    export_mri_gltf()
