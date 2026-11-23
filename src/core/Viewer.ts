import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Viewer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public canvas: HTMLCanvasElement;

  private updateCallbacks: ((delta: number) => void)[] = [];
  private clock: THREE.Clock;
  private isAnimatingCamera = false;
  private cameraTargetPos = new THREE.Vector3();
  private cameraTargetLook = new THREE.Vector3();
  private cameraLerpAlpha = 0.05;

  constructor(canvasId: string = 'webgl') {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found.`);
    }
    this.canvas = canvas;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0a0e17');
    this.scene.fog = new THREE.FogExp2('#0a0e17', 0.04);

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.set(3.2, 2.2, 3.8);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.1, 0.4);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.01; // Don't go below floor
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 14;

    this.clock = new THREE.Clock();

    // 5. Events & Loop
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.startLoop();
  }

  public registerUpdate(callback: (delta: number) => void) {
    this.updateCallbacks.push(callback);
  }

  public animateCameraTo(targetPos: THREE.Vector3, targetLook: THREE.Vector3, duration: number = 1.0) {
    this.cameraTargetPos.copy(targetPos);
    this.cameraTargetLook.copy(targetLook);
    this.cameraLerpAlpha = Math.min(0.08, 1 / (duration * 30));
    this.isAnimatingCamera = true;
  }

  private onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private startLoop() {
    const tick = () => {
      requestAnimationFrame(tick);
      const delta = this.clock.getDelta();

      if (this.isAnimatingCamera) {
        this.camera.position.lerp(this.cameraTargetPos, this.cameraLerpAlpha);
        this.controls.target.lerp(this.cameraTargetLook, this.cameraLerpAlpha);

        if (
          this.camera.position.distanceTo(this.cameraTargetPos) < 0.02 &&
          this.controls.target.distanceTo(this.cameraTargetLook) < 0.02
        ) {
          this.camera.position.copy(this.cameraTargetPos);
          this.controls.target.copy(this.cameraTargetLook);
          this.isAnimatingCamera = false;
        }
      }

      this.controls.update();

      for (const cb of this.updateCallbacks) {
        cb(delta);
      }

      this.renderer.render(this.scene, this.camera);
    };

    tick();
  }
}
