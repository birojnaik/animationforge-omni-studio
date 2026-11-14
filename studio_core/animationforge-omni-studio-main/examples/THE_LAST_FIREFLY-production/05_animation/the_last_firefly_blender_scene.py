"""Run inside Blender 4.x: blender -b -P the_last_firefly_blender_scene.py"""
import math
import bpy
import bmesh


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def create_material(name, base_color, roughness=0.5, metallic=0.0, emission_color=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if emission_color and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission_color, 1.0)
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def build_firefly_character():
    rig_data = bpy.data.armatures.new("Firefly_Armature")
    rig_obj = bpy.data.objects.new("Firefly_Rig", rig_data)
    bpy.context.collection.objects.link(rig_obj)
    bpy.context.view_layer.objects.active = rig_obj
    bpy.ops.object.mode_set(mode="EDIT")

    root = rig_data.edit_bones.new("root_pelvis")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.25)

    thorax = rig_data.edit_bones.new("thorax")
    thorax.head = (0, 0, 0.25)
    thorax.tail = (0, 0.15, 0.45)
    thorax.parent = root

    head_bone = rig_data.edit_bones.new("head")
    head_bone.head = (0, 0.15, 0.45)
    head_bone.tail = (0, 0.35, 0.52)
    head_bone.parent = thorax

    abdomen = rig_data.edit_bones.new("abdomen_lantern")
    abdomen.head = (0, 0, 0.25)
    abdomen.tail = (0, -0.45, 0.12)
    abdomen.parent = root

    wing_l = rig_data.edit_bones.new("wing_L")
    wing_l.head = (-0.08, 0.05, 0.42)
    wing_l.tail = (-0.65, -0.15, 0.55)
    wing_l.parent = thorax

    wing_r = rig_data.edit_bones.new("wing_R")
    wing_r.head = (0.08, 0.05, 0.42)
    wing_r.tail = (0.65, -0.15, 0.55)
    wing_r.parent = thorax

    bpy.ops.object.mode_set(mode="OBJECT")

    chitin_mat = create_material("Firefly_Chitin", (0.06, 0.05, 0.08), roughness=0.35, metallic=0.15)
    lantern_mat = create_material(
        "Firefly_Bioluminescence",
        (1.0, 0.68, 0.18),
        roughness=0.25,
        emission_color=(1.0, 0.65, 0.14),
        emission_strength=14.0,
    )
    wing_mat = create_material("Firefly_Wing_Iridescent", (0.72, 0.85, 0.98), roughness=0.18, metallic=0.05)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18, location=(0, 0.05, 0.36))
    thorax_mesh = bpy.context.active_object
    thorax_mesh.name = "Firefly_Thorax"
    thorax_mesh.data.materials.append(chitin_mat)
    thorax_mesh.parent = rig_obj

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(0, -0.26, 0.18))
    lantern_mesh = bpy.context.active_object
    lantern_mesh.name = "Firefly_Lantern_Abdomen"
    lantern_mesh.scale = (0.85, 1.45, 0.82)
    lantern_mesh.data.materials.append(lantern_mat)
    lantern_mesh.parent = rig_obj

    for side, sign in (("L", -1.0), ("R", 1.0)):
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=4, y_subdivisions=3, size=0.55, location=(sign * 0.34, -0.05, 0.46))
        wing = bpy.context.active_object
        wing.name = f"Firefly_Wing_{side}"
        wing.scale = (1.15, 0.48, 1.0)
        wing.data.materials.append(wing_mat)
        wing.parent = rig_obj

    return rig_obj, lantern_mat


def build_environment():
    moss_mat = create_material("Forest_Moss", (0.04, 0.09, 0.06), roughness=0.88)
    mushroom_mat = create_material(
        "Glowing_Mushroom",
        (0.18, 0.55, 0.65),
        roughness=0.35,
        emission_color=(0.22, 0.72, 0.85),
        emission_strength=3.2,
    )
    bpy.ops.mesh.primitive_plane_add(size=18.0, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "Forest_Glade_Ground"
    ground.data.materials.append(moss_mat)

    for idx, (mx, my, sc) in enumerate([(-1.4, 0.8, 0.32), (1.1, -0.6, 0.24), (-0.7, -1.3, 0.28)]):
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=sc, depth=sc * 0.65, location=(mx, my, sc * 0.85))
        cap = bpy.context.active_object
        cap.name = f"Mushroom_Cap_{idx}"
        cap.data.materials.append(mushroom_mat)


def setup_animation_and_render(rig_obj):
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 144
    scene.render.fps = 24
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.engine = "CYCLES"
    scene.render.image_settings.file_format = "PNG"

    cam_data = bpy.data.cameras.new("Shot_Camera")
    cam_data.lens = 42.0
    cam_obj = bpy.data.objects.new("Shot_Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    for f in range(1, 145):
        t = (f - 1) / 143.0
        rig_obj.location = (
            math.sin(t * math.pi * 2.0) * 0.85,
            -1.2 + t * 2.4,
            0.55 + math.sin(t * math.pi * 3.0) * 0.22 + 0.08 * math.sin(f * 0.35),
        )
        rig_obj.rotation_euler = (0.08 * math.sin(t * 6.0), 0.12 * math.cos(t * 4.0), t * 0.85)
        rig_obj.keyframe_insert(data_path="location", frame=f)
        rig_obj.keyframe_insert(data_path="rotation_euler", frame=f)

        cam_obj.location = (2.8 - t * 1.1, -3.2 + t * 1.4, 1.35 + math.sin(t * math.pi) * 0.35)
        cam_obj.rotation_euler = (math.radians(74), 0.0, math.radians(32 - t * 18))
        cam_obj.keyframe_insert(data_path="location", frame=f)
        cam_obj.keyframe_insert(data_path="rotation_euler", frame=f)


def main():
    clear_scene()
    rig_obj, _ = build_firefly_character()
    build_environment()
    setup_animation_and_render(rig_obj)


if __name__ == "__main__":
    main()
