import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { DEVICE_PROFILES, DeviceProfile, MODEL_CONFIG } from '../config/constants';
import { PlaceholderMRI } from './PlaceholderMRI';

export interface LoadedModelResult {
  root: THREE.Object3D;
  isRealGLB: boolean;
  movableBed: THREE.Object3D | null;
  ctRotor: THREE.Object3D | null;
  ctFrontUnit: THREE.Object3D | null;
  haloMesh: THREE.Mesh | null;
  placeholderInstance?: PlaceholderMRI;
  setBedProgress: (t: number) => void;
  setTandemSeparation: (t: number) => void;
  setShellColor: (color: string) => void;
  setShellRoughness: (val: number) => void;
  setHaloColor: (color: string) => void;
  setHaloIntensity: (val: number) => void;
  setCutaway: (enabled: boolean) => void;
  setCoilVisibility: (coil: 'head' | 'body', visible: boolean) => void;
  setWireframe: (wireframe: boolean) => void;
  dispose: () => void;
}

export class ModelLoader {
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;

  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(MODEL_CONFIG.dracoDecoderPath);
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  public load(
    scene: THREE.Scene,
    onProgress: (percent: number, msg: string) => void,
    profile: DeviceProfile = DEVICE_PROFILES['umr-omega-30t']
  ): Promise<LoadedModelResult> {
    return new Promise((resolve) => {
      onProgress(15, `正在载入 ${profile.title} 高保真模型...`);

      this.gltfLoader.load(
        profile.gltfPath,
        (gltf) => {
          onProgress(85, '初始化极简珠光白与阳极氧化铝 PBR 材质...');
          const root = gltf.scene;
          root.name = `Model_${profile.deviceId}`;

          let movableBed: THREE.Object3D | null = null;
          let haloMesh: THREE.Mesh | null = null;
          let cryostatGroup: THREE.Object3D | null = null;
          let ctRotor: THREE.Object3D | null = null;
          let ctFrontUnit: THREE.Object3D | null = null;
          let headCoilGroup: THREE.Object3D | null = null;
          let bodyCoilGroup: THREE.Object3D | null = null;

          const allMeshes: THREE.Mesh[] = [];
          const shellMaterials = new Set<THREE.MeshStandardMaterial>();
          const haloMaterials = new Set<THREE.MeshStandardMaterial>();
          const cutawayOuterMeshes: { mesh: THREE.Mesh; clonedMat: THREE.MeshStandardMaterial }[] = [];

          const cutawayMeshNames = new Set([
            'gantry_shell_main',
            'ct_shell_main',
            'gantry_top_cryo_shroud',
            'medallion_white_face',
            'rear_medallion_face',
            'bore_lining',
            'bore_starlight_canopy'
          ]);

          root.traverse((child) => {
            const lname = child.name.toLowerCase();

            if (lname === 'table_couch_movable' || (!movableBed && lname.includes('table_couch'))) {
              movableBed = child;
            }
            if (lname === 'mri_internal_cryostat') {
              cryostatGroup = child;
            }
            if (lname === 'ct_internal_rotor') {
              ctRotor = child;
            }
            if (lname === 'gantry_ct_front_unit') {
              ctFrontUnit = child;
            }
            if (lname === 'coil_head_matrix') {
              headCoilGroup = child;
            }
            if (lname === 'coil_body_array') {
              bodyCoilGroup = child;
            }

            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const isDecal = lname.startsWith('decal_');
              mesh.castShadow = !isDecal;
              mesh.receiveShadow = !isDecal;
              allMeshes.push(mesh);

              if (!haloMesh && lname.includes('bore_halo_light')) {
                haloMesh = mesh;
              }

              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach((m) => {
                const std = m as THREE.MeshStandardMaterial;
                if (!std) return;
                const matName = (std.name || '').toLowerCase();
                if (matName.includes('mat_mri_shell')) {
                  shellMaterials.add(std);
                }
                if (matName.includes('mat_mri_halo')) {
                  haloMaterials.add(std);
                }
              });

              if (cutawayMeshNames.has(lname)) {
                const orig = mesh.material as THREE.MeshStandardMaterial;
                if (orig) {
                  const cloned = orig.clone();
                  mesh.material = cloned;
                  if ((orig.name || '').toLowerCase().includes('mat_mri_shell')) {
                    shellMaterials.add(cloned);
                  }
                  cutawayOuterMeshes.push({ mesh, clonedMat: cloned });
                }
              }
            }
          });

          if (cryostatGroup) (cryostatGroup as THREE.Object3D).visible = false;
          if (ctRotor && profile.modality === 'MI') (ctRotor as THREE.Object3D).visible = false;
          if (headCoilGroup) (headCoilGroup as THREE.Object3D).visible = false;
          if (bodyCoilGroup) (bodyCoilGroup as THREE.Object3D).visible = false;

          scene.add(root);
          onProgress(100, `${profile.title} 模型就绪`);

          const initialBedZ = movableBed ? (movableBed as THREE.Object3D).position.z : 1.94;
          const bedTravelDistance = profile.bedTravelMeters;
          const initialCtZ = ctFrontUnit ? (ctFrontUnit as THREE.Object3D).position.z : 0;

          resolve({
            root,
            isRealGLB: true,
            movableBed,
            ctRotor,
            ctFrontUnit,
            haloMesh,
            setBedProgress: (t: number) => {
              if (movableBed) {
                const clamped = Math.max(0, Math.min(1, t));
                (movableBed as THREE.Object3D).position.z = initialBedZ - clamped * bedTravelDistance;
              }
            },
            setTandemSeparation: (t: number) => {
              if (ctFrontUnit && profile.supportsTandemSeparation) {
                const clamped = Math.max(0, Math.min(1, t));
                (ctFrontUnit as THREE.Object3D).position.z = initialCtZ + clamped * 0.55;
              }
            },
            setShellColor: (color: string) => {
              shellMaterials.forEach((mat) => mat.color.set(color));
            },
            setShellRoughness: (val: number) => {
              shellMaterials.forEach((mat) => {
                mat.roughness = val;
              });
            },
            setHaloColor: (color: string) => {
              haloMaterials.forEach((mat) => {
                mat.color.set(color);
                mat.emissive.set(color);
              });
            },
            setHaloIntensity: (val: number) => {
              haloMaterials.forEach((mat) => {
                mat.emissiveIntensity = val;
              });
            },
            setCutaway: (enabled: boolean) => {
              if (cryostatGroup) {
                (cryostatGroup as THREE.Object3D).visible = enabled;
              }
              if (ctRotor && profile.modality === 'MI') {
                (ctRotor as THREE.Object3D).visible = enabled;
              }
              cutawayOuterMeshes.forEach(({ clonedMat }) => {
                clonedMat.transparent = enabled;
                clonedMat.opacity = enabled ? 0.16 : 1.0;
                clonedMat.depthWrite = !enabled;
                clonedMat.needsUpdate = true;
              });
            },
            setCoilVisibility: (coil: 'head' | 'body', visible: boolean) => {
              if (coil === 'head' && headCoilGroup) {
                (headCoilGroup as THREE.Object3D).visible = visible;
              }
              if (coil === 'body' && bodyCoilGroup) {
                (bodyCoilGroup as THREE.Object3D).visible = visible;
              }
            },
            setWireframe: (wf: boolean) => {
              allMeshes.forEach((m) => {
                if (Array.isArray(m.material)) {
                  m.material.forEach((mat) => {
                    if ('wireframe' in mat) (mat as THREE.MeshStandardMaterial).wireframe = wf;
                  });
                } else if (m.material && 'wireframe' in m.material) {
                  (m.material as THREE.MeshStandardMaterial).wireframe = wf;
                }
              });
            },
            dispose: () => {
              scene.remove(root);
              allMeshes.forEach((m) => {
                m.geometry?.dispose();
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                mats.forEach((mat) => mat?.dispose());
              });
            }
          });
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const percent = Math.round((xhr.loaded / xhr.total) * 70) + 15;
            onProgress(percent, `正在载入模型: ${(xhr.loaded / 1024).toFixed(0)} KB`);
          }
        },
        (error) => {
          console.warn('[ModelLoader] 启用占位模型:', error);
          const placeholder = new PlaceholderMRI();
          scene.add(placeholder.group);

          const meshes: THREE.Mesh[] = [];
          placeholder.group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
          });

          resolve({
            root: placeholder.group,
            isRealGLB: false,
            movableBed: placeholder.movableBed,
            ctRotor: null,
            ctFrontUnit: null,
            haloMesh: placeholder.haloLightMesh,
            placeholderInstance: placeholder,
            setBedProgress: (t: number) => placeholder.setBedProgress(t),
            setTandemSeparation: () => {},
            setShellColor: (color: string) => placeholder.setShellColor(color),
            setShellRoughness: (val: number) => placeholder.setShellRoughness(val),
            setHaloColor: () => {},
            setHaloIntensity: () => {},
            setCutaway: () => {},
            setCoilVisibility: () => {},
            setWireframe: (wf: boolean) => {
              meshes.forEach((m) => {
                if (m.material && 'wireframe' in m.material) {
                  (m.material as THREE.MeshStandardMaterial).wireframe = wf;
                }
              });
            },
            dispose: () => {
              scene.remove(placeholder.group);
              meshes.forEach((m) => {
                m.geometry?.dispose();
                (m.material as THREE.Material)?.dispose();
              });
            }
          });
        }
      );
    });
  }
}
