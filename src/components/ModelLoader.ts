import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MODEL_CONFIG } from '../config/constants';
import { PlaceholderMRI } from './PlaceholderMRI';

export interface LoadedModelResult {
  root: THREE.Object3D;
  isRealGLB: boolean;
  movableBed: THREE.Object3D | null;
  haloMesh: THREE.Mesh | null;
  placeholderInstance?: PlaceholderMRI;
  setBedProgress: (t: number) => void;
  setShellColor: (color: string) => void;
  setShellRoughness: (val: number) => void;
  setWireframe: (wireframe: boolean) => void;
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
    onProgress: (percent: number, msg: string) => void
  ): Promise<LoadedModelResult> {
    return new Promise((resolve) => {
      onProgress(15, '正在检索 Blender 导出的 GLB 模型...');

      this.gltfLoader.load(
        MODEL_CONFIG.gltfPath,
        (gltf) => {
          onProgress(85, '解析模型网格与 PBR 材质...');
          const root = gltf.scene;
          root.name = 'MRI_Real_GLB';

          let movableBed: THREE.Object3D | null = null;
          let haloMesh: THREE.Mesh | null = null;
          const meshes: THREE.Mesh[] = [];

          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              meshes.push(mesh);

              // Auto-detect movable patient couch
              if (
                mesh.name.toLowerCase().includes('bed') ||
                mesh.name.toLowerCase().includes('couch') ||
                mesh.name.toLowerCase().includes('table_couch')
              ) {
                movableBed = mesh;
              }

              // Auto-detect halo light ring
              if (
                mesh.name.toLowerCase().includes('halo') ||
                mesh.name.toLowerCase().includes('ring_light')
              ) {
                haloMesh = mesh;
              }
            }
          });

          scene.add(root);
          onProgress(100, 'Blender 模型加载完成');

          let initialBedZ = movableBed ? (movableBed as THREE.Object3D).position.z : 0;

          const result: LoadedModelResult = {
            root,
            isRealGLB: true,
            movableBed,
            haloMesh,
            setBedProgress: (t: number) => {
              if (movableBed) {
                (movableBed as THREE.Object3D).position.z = initialBedZ - t * 1.2;
              }
            },
            setShellColor: (color: string) => {
              meshes.forEach((m) => {
                const mat = m.material as THREE.MeshStandardMaterial;
                if (mat && mat.color && !m.name.includes('Light') && !m.name.includes('Screen')) {
                  mat.color.set(color);
                }
              });
            },
            setShellRoughness: (val: number) => {
              meshes.forEach((m) => {
                const mat = m.material as THREE.MeshStandardMaterial;
                if (mat && typeof mat.roughness === 'number') {
                  mat.roughness = val;
                }
              });
            },
            setWireframe: (wf: boolean) => {
              meshes.forEach((m) => {
                if (Array.isArray(m.material)) {
                  m.material.forEach((mat) => {
                    if ('wireframe' in mat) (mat as THREE.MeshStandardMaterial).wireframe = wf;
                  });
                } else if (m.material && 'wireframe' in m.material) {
                  (m.material as THREE.MeshStandardMaterial).wireframe = wf;
                }
              });
            }
          };

          resolve(result);
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const percent = Math.round((xhr.loaded / xhr.total) * 70) + 15;
            onProgress(percent, `正在下载 GLB 模型: ${(xhr.loaded / 1024 / 1024).toFixed(1)} MB`);
          }
        },
        (error) => {
          console.warn('[ModelLoader] 未在 /public/models/ 发现 mri_scanner.glb 或加载失败:', error);
          onProgress(70, '未发现外部 GLB，自动启用高保真几何工程占位模型...');

          // Graceful fallback to procedural placeholder model
          const placeholder = new PlaceholderMRI();
          scene.add(placeholder.group);

          const meshes: THREE.Mesh[] = [];
          placeholder.group.traverse((c) => {
            if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
          });

          setTimeout(() => {
            onProgress(100, '几何工程占位模型准备就绪');
            resolve({
              root: placeholder.group,
              isRealGLB: false,
              movableBed: placeholder.movableBed,
              haloMesh: placeholder.haloLightMesh,
              placeholderInstance: placeholder,
              setBedProgress: (t: number) => placeholder.setBedProgress(t),
              setShellColor: (color: string) => placeholder.setShellColor(color),
              setShellRoughness: (val: number) => placeholder.setShellRoughness(val),
              setWireframe: (wf: boolean) => {
                meshes.forEach((m) => {
                  if (m.material && 'wireframe' in m.material) {
                    (m.material as THREE.MeshStandardMaterial).wireframe = wf;
                  }
                });
              }
            });
          }, 400);
        }
      );
    });
  }
}
