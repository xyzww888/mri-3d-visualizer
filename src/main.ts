import './assets/styles/main.css';
import { Viewer } from './core/Viewer';
import { Lighting } from './core/Lighting';
import { Environment } from './core/Environment';
import { LoadingOverlay } from './ui/LoadingOverlay';
import { ModelLoader, LoadedModelResult } from './components/ModelLoader';
import { Annotations } from './components/Annotations';
import { GUIControls } from './ui/GUIControls';
import { CAMERA_VIEWS } from './config/constants';

class App {
  private viewer: Viewer;
  private lighting: Lighting;
  private environment: Environment;
  private loadingOverlay: LoadingOverlay;
  private modelLoader: ModelLoader;
  public annotations!: Annotations;
  public guiControls!: GUIControls;
  public modelResult!: LoadedModelResult;

  // Bed slide animation state
  private bedProgress: number = 0;
  private bedTargetProgress: number = 0;
  private isBedAnimating: boolean = false;
  private isWireframe: boolean = false;

  constructor() {
    this.loadingOverlay = new LoadingOverlay();
    this.loadingOverlay.update(10, '初始化 WebGL 渲染管线与摄像机...');

    this.viewer = new Viewer('webgl');
    this.lighting = new Lighting(this.viewer.scene);
    this.environment = new Environment(this.viewer.scene);
    this.modelLoader = new ModelLoader();

    this.init();
  }

  private async init() {
    try {
      this.modelResult = await this.modelLoader.load(
        this.viewer.scene,
        (percent, msg) => {
          this.loadingOverlay.update(percent, msg);
        }
      );

      this.updateStatusBadge();
      this.initAnnotations();
      this.initUIEvents();
      this.initGUI();
      this.initAnimationLoop();

      setTimeout(() => {
        this.loadingOverlay.hide();
      }, 500);
    } catch (err) {
      console.error('[App] 初始化失败:', err);
      this.loadingOverlay.update(100, '加载异常，请查看控制台日志');
    }
  }

  private updateStatusBadge() {
    const badge = document.getElementById('model-source-badge');
    const badgeText = document.getElementById('model-source-text');
    if (!badge || !badgeText) return;

    if (this.modelResult.isRealGLB) {
      badge.className = 'badge badge-success';
      badgeText.textContent = 'Blender GLB 真实模型已挂载';
    } else {
      badge.className = 'badge badge-warning';
      badgeText.textContent = '几何工程占位运行中 (待导出 GLB)';
    }
  }

  private initAnnotations() {
    this.annotations = new Annotations(this.viewer);
  }

  private initGUI() {
    this.guiControls = new GUIControls(
      this.viewer,
      this.lighting,
      this.environment,
      this.modelResult,
      () => this.toggleBedMovement()
    );
  }

  private initUIEvents() {
    // 1. Camera View Presets
    const viewButtons = document.querySelectorAll<HTMLButtonElement>('.btn-view');
    viewButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        viewButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const viewKey = btn.dataset.view;
        if (viewKey && CAMERA_VIEWS[viewKey]) {
          const preset = CAMERA_VIEWS[viewKey];
          this.viewer.animateCameraTo(preset.position, preset.target, 1.2);
        }
      });
    });

    // 2. Bed Movement Toggle Button
    const bedBtn = document.getElementById('btn-toggle-bed');
    if (bedBtn) {
      bedBtn.addEventListener('click', () => this.toggleBedMovement());
    }

    // 3. Annotations Toggle Button
    const annoBtn = document.getElementById('btn-toggle-annotations');
    if (annoBtn) {
      annoBtn.addEventListener('click', () => {
        const visible = this.annotations.toggleVisibility();
        annoBtn.classList.toggle('active', visible);
      });
    }

    // 4. Wireframe Toggle Button
    const wireBtn = document.getElementById('btn-toggle-wireframe');
    if (wireBtn) {
      wireBtn.addEventListener('click', () => {
        this.isWireframe = !this.isWireframe;
        this.modelResult.setWireframe(this.isWireframe);
        wireBtn.classList.toggle('active', this.isWireframe);
      });
    }
  }

  private toggleBedMovement() {
    this.bedTargetProgress = this.bedTargetProgress === 0 ? 1 : 0;
    this.isBedAnimating = true;

    const bedBtnText = document.getElementById('bed-btn-text');
    if (bedBtnText) {
      bedBtnText.textContent =
        this.bedTargetProgress === 1 ? '移出检查床 (退孔)' : '推进检查床 (进孔)';
    }
  }

  private initAnimationLoop() {
    this.viewer.registerUpdate((delta) => {
      // Smooth bed translation interpolation
      if (this.isBedAnimating) {
        const step = delta * 1.5;
        if (Math.abs(this.bedProgress - this.bedTargetProgress) < step) {
          this.bedProgress = this.bedTargetProgress;
          this.isBedAnimating = false;
        } else {
          this.bedProgress += Math.sign(this.bedTargetProgress - this.bedProgress) * step;
        }
        this.modelResult.setBedProgress(this.bedProgress);
      }
    });
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
