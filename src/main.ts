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
  public viewer: Viewer;
  public lighting: Lighting;
  public environment: Environment;
  private loadingOverlay: LoadingOverlay;
  private modelLoader: ModelLoader;
  public annotations!: Annotations;
  public guiControls!: GUIControls;
  public modelResult!: LoadedModelResult;
  public isReady: boolean = false;

  // Interactive clinical & studio states
  private bedProgress: number = 0;
  private bedTargetProgress: number = 0;
  private isBedAnimating: boolean = false;
  private areCoilsMounted: boolean = false;
  private isCutaway: boolean = false;
  private isLaserOn: boolean = false;
  private isDarkStudio: boolean = false;
  private isWireframe: boolean = false;
  private isHaloBreathing: boolean = true;

  constructor() {
    this.loadingOverlay = new LoadingOverlay();
    this.loadingOverlay.update(15, '初始化纯净白演播室渲染管线...');

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
      this.isReady = true;

      (window as unknown as Record<string, unknown>).__mriApp = this;

      requestAnimationFrame(() => {
        this.loadingOverlay.hide();
      });
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
      badgeText.textContent = 'uMR Omega 3.0T · 75cm 极简高模';
    } else {
      badge.className = 'badge badge-warning';
      badgeText.textContent = '几何工程占位模式';
    }
  }

  private initAnnotations() {
    this.annotations = new Annotations(this.viewer, (item) => {
      if (item.id === 'rf-coil' && !this.areCoilsMounted) {
        this.setCoilsMounted(true);
      }
      if (item.id === 'top-cryo') {
        // Optional subtle focus
      }
    });
  }

  private initGUI() {
    this.guiControls = new GUIControls(
      this.viewer,
      this.lighting,
      this.environment,
      this.modelResult,
      {
        onBedToggle: () => this.toggleBedMovement(),
        onCoilsToggle: (enabled) => this.setCoilsMounted(enabled),
        onCutawayToggle: (enabled) => this.setCutawayMode(enabled),
        onLaserToggle: (enabled) => this.setLaserMode(enabled),
        onStudioThemeToggle: (dark) => this.setStudioTheme(dark),
        onHaloPulseToggle: (enabled) => {
          this.isHaloBreathing = enabled;
          if (!enabled) this.lighting.setHaloBreathingScale(1.0);
        }
      }
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
          this.viewer.animateCameraTo(preset.position, preset.target, 1.15);
        }
      });
    });

    // 2. Bed Movement Toggle
    const bedBtn = document.getElementById('btn-toggle-bed');
    if (bedBtn) {
      bedBtn.addEventListener('click', () => this.toggleBedMovement());
    }

    // 3. Mount / Unmount RF Coils Toggle
    const coilsBtn = document.getElementById('btn-toggle-coils');
    if (coilsBtn) {
      coilsBtn.addEventListener('click', () => this.setCoilsMounted(!this.areCoilsMounted));
    }

    // 4. Superconducting Magnet Cutaway Toggle
    const cutawayBtn = document.getElementById('btn-toggle-cutaway');
    if (cutawayBtn) {
      cutawayBtn.addEventListener('click', () => this.setCutawayMode(!this.isCutaway));
    }

    // 5. Optical Laser Alignment Toggle
    const laserBtn = document.getElementById('btn-toggle-laser');
    if (laserBtn) {
      laserBtn.addEventListener('click', () => this.setLaserMode(!this.isLaserOn));
    }

    // 6. Studio Light / Dark Starlight Theme Toggle
    const studioBtn = document.getElementById('btn-toggle-studio');
    if (studioBtn) {
      studioBtn.addEventListener('click', () => this.setStudioTheme(!this.isDarkStudio));
    }

    // 7. 3D Annotations Toggle
    const annoBtn = document.getElementById('btn-toggle-annotations');
    if (annoBtn) {
      annoBtn.addEventListener('click', () => {
        const visible = this.annotations.toggleVisibility();
        annoBtn.classList.toggle('active', visible);
      });
    }

    // 8. Wireframe Toggle
    const wireBtn = document.getElementById('btn-toggle-wireframe');
    if (wireBtn) {
      wireBtn.addEventListener('click', () => {
        this.isWireframe = !this.isWireframe;
        this.modelResult.setWireframe(this.isWireframe);
        wireBtn.classList.toggle('active', this.isWireframe);
      });
    }
  }

  public setCoilsMounted(enabled: boolean) {
    this.areCoilsMounted = enabled;
    this.modelResult.setCoilVisibility('head', enabled);
    this.modelResult.setCoilVisibility('body', enabled);
    const coilsBtn = document.getElementById('btn-toggle-coils');
    if (coilsBtn) coilsBtn.classList.toggle('active', enabled);
  }

  public setCutawayMode(enabled: boolean) {
    this.isCutaway = enabled;
    this.modelResult.setCutaway(enabled);
    const cutawayBtn = document.getElementById('btn-toggle-cutaway');
    if (cutawayBtn) cutawayBtn.classList.toggle('active', enabled);
  }

  public setLaserMode(enabled: boolean) {
    this.isLaserOn = enabled;
    this.lighting.setLaserVisible(enabled);
    const laserBtn = document.getElementById('btn-toggle-laser');
    if (laserBtn) laserBtn.classList.toggle('active', enabled);
  }

  public setStudioTheme(dark: boolean) {
    this.isDarkStudio = dark;
    this.viewer.setStudioTheme(dark);
    this.lighting.setStudioTheme(dark);
    this.environment.setStudioTheme(dark);

    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.toggle('theme-dark', dark);

    const studioBtn = document.getElementById('btn-toggle-studio');
    const studioText = document.getElementById('studio-btn-text');
    if (studioBtn) studioBtn.classList.toggle('active', dark);
    if (studioText) {
      studioText.textContent = dark ? '切换纯净白演播室' : '切换星空暗场模式';
    }
  }

  public setBedProgressImmediate(progress: number) {
    this.bedProgress = progress;
    this.bedTargetProgress = progress;
    this.isBedAnimating = false;
    this.modelResult.setBedProgress(progress);
  }

  public toggleBedMovement() {
    this.bedTargetProgress = this.bedTargetProgress === 0 ? 1 : 0;
    this.isBedAnimating = true;

    const bedBtnText = document.getElementById('bed-btn-text');
    if (bedBtnText) {
      bedBtnText.textContent =
        this.bedTargetProgress === 1 ? '退回检查床 (出孔)' : '推进检查床 (进孔)';
    }
  }

  private initAnimationLoop() {
    this.viewer.registerUpdate((delta, elapsed) => {
      if (this.isBedAnimating) {
        const step = delta * 0.85;
        if (Math.abs(this.bedProgress - this.bedTargetProgress) < step) {
          this.bedProgress = this.bedTargetProgress;
          this.isBedAnimating = false;
        } else {
          this.bedProgress += Math.sign(this.bedTargetProgress - this.bedProgress) * step;
        }
        const eased = this.bedProgress * this.bedProgress * (3 - 2 * this.bedProgress);
        this.modelResult.setBedProgress(eased);
      }

      if (this.isHaloBreathing) {
        const breath = 0.88 + 0.12 * Math.sin(elapsed * 1.3);
        this.lighting.setHaloBreathingScale(breath);
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
