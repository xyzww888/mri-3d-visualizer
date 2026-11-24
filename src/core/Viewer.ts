import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Viewer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;
  public canvas: HTMLCanvasElement;

  public paused = false;
  private updateCallbacks: ((delta: number, elapsed: number) => void)[] = [];
  private clock: THREE.Clock;
  private isAnimatingCamera = false;
  private cameraTargetPos = new THREE.Vector3();
  private cameraTargetLook = new THREE.Vector3();
  private cameraLerpAlpha = 0.05;

  private envLightTex!: THREE.Texture;
  private envDarkTex!: THREE.Texture;

  constructor(canvasId: string = 'webgl') {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id "${canvasId}" not found.`);
    }
    this.canvas = canvas;

    // 1. Scene — Default: Apple / United Imaging Infinity White Cyclorama Gallery
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#e8ecf2');
    this.scene.fog = new THREE.Fog('#e8ecf2', 10.5, 24.0);

    // 2. Camera — Signature uMR Omega Left-Front 3/4 Architectural Hero Angle
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.08, 100);
    this.camera.position.set(-3.82, 1.86, 4.78);

    // 3. Renderer (High-Fidelity PBR + ACES Filmic)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.98;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Build both Light Gallery & Dark Starlight HDRI Environments
    this.buildStudioEnvironments();
    this.scene.environment = this.envLightTex;
    this.scene.environmentIntensity = 0.78;

    // 5. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.target.set(-0.22, 1.04, 0.80);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.012;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 14.0;

    this.controls.addEventListener('start', () => {
      this.isAnimatingCamera = false;
    });

    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.startLoop();
  }

  /**
   * Builds Apple / United Imaging product photography softbox + negative-fill IBL maps
   * so white satin casing has subtle sculptural contour gradients while brushed silver
   * aluminum and obsidian black glass show crisp specular reflections.
   */
  private buildStudioEnvironments() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();

    // --- A. Pure White Gallery Studio HDRI (with dark negative-fill cards for metal/glass contrast) ---
    const lightEnv = new THREE.Scene();
    lightEnv.background = new THREE.Color(0xd8dfe8);

    const domeLight = new THREE.Mesh(
      new THREE.SphereGeometry(20, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0xdce3ec, side: THREE.BackSide })
    );
    lightEnv.add(domeLight);

    // Overhead crisp softbox bank
    const topSoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(11, 8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(3.4, 3.5, 3.65) })
    );
    topSoftbox.position.set(0, 9.0, 1.5);
    topSoftbox.rotation.x = Math.PI / 2;
    lightEnv.add(topSoftbox);

    // Key front-left softbox
    const keySoftbox = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 7),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.8, 2.9, 3.05) })
    );
    keySoftbox.position.set(-8.5, 4.5, 5.5);
    keySoftbox.lookAt(0, 1.1, 0);
    lightEnv.add(keySoftbox);

    // Studio dark negative-fill contrast flags (crucial so silver aluminum & black glass reflect crisp edges!)
    for (const sx of [-9.5, 9.5]) {
      const negFill = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 6.5),
        new THREE.MeshBasicMaterial({ color: 0x3b4454 })
      );
      negFill.position.set(sx, 2.8, -1.5);
      negFill.lookAt(0, 1.1, 0);
      lightEnv.add(negFill);
    }

    this.envLightTex = pmrem.fromScene(lightEnv, 0.04).texture;

    // --- B. Starlight Dark Studio HDRI ---
    const darkEnv = new THREE.Scene();
    darkEnv.background = new THREE.Color(0x0c1322);
    const topDarkBox = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(3.8, 4.1, 4.6) })
    );
    topDarkBox.position.set(0, 8.5, 1.5);
    topDarkBox.rotation.x = Math.PI / 2;
    darkEnv.add(topDarkBox);

    const sideDarkBox = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 7),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 2.8, 4.0) })
    );
    sideDarkBox.position.set(-9.0, 4.0, 3.0);
    sideDarkBox.lookAt(0, 1.1, 0);
    darkEnv.add(sideDarkBox);

    this.envDarkTex = pmrem.fromScene(darkEnv, 0.04).texture;
    pmrem.dispose();
  }

  public setStudioTheme(dark: boolean) {
    if (dark) {
      this.scene.background = new THREE.Color('#0a0f1a');
      this.scene.fog = new THREE.Fog('#0a0f1a', 10.0, 25.0);
      this.scene.environment = this.envDarkTex;
      this.scene.environmentIntensity = 0.85;
      this.renderer.toneMappingExposure = 1.08;
    } else {
      this.scene.background = new THREE.Color('#e8ecf2');
      this.scene.fog = new THREE.Fog('#e8ecf2', 10.5, 24.0);
      this.scene.environment = this.envLightTex;
      this.scene.environmentIntensity = 0.78;
      this.renderer.toneMappingExposure = 0.98;
    }
  }

  public registerUpdate(callback: (delta: number, elapsed: number) => void) {
    this.updateCallbacks.push(callback);
  }

  public setCameraImmediate(pos: THREE.Vector3, target: THREE.Vector3) {
    this.isAnimatingCamera = false;
    this.camera.position.copy(pos);
    this.controls.target.copy(target);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public animateCameraTo(targetPos: THREE.Vector3, targetLook: THREE.Vector3, duration: number = 1.0) {
    this.cameraTargetPos.copy(targetPos);
    this.cameraTargetLook.copy(targetLook);
    this.cameraLerpAlpha = Math.min(0.09, 1 / (duration * 26));
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
      if (this.paused) return;
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.elapsedTime;

      if (this.isAnimatingCamera) {
        this.camera.position.lerp(this.cameraTargetPos, this.cameraLerpAlpha);
        this.controls.target.lerp(this.cameraTargetLook, this.cameraLerpAlpha);

        if (
          this.camera.position.distanceTo(this.cameraTargetPos) < 0.015 &&
          this.controls.target.distanceTo(this.cameraTargetLook) < 0.015
        ) {
          this.camera.position.copy(this.cameraTargetPos);
          this.controls.target.copy(this.cameraTargetLook);
          this.isAnimatingCamera = false;
        }
      }

      this.controls.update();

      for (const cb of this.updateCallbacks) {
        cb(delta, elapsed);
      }

      this.renderer.render(this.scene, this.camera);
    };

    tick();
  }
}
