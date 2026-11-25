import './assets/styles/main.css';
import { Viewer } from './core/Viewer';
import { Lighting } from './core/Lighting';
import { Environment } from './core/Environment';
import { LoadingOverlay } from './ui/LoadingOverlay';
import { ModelLoader, LoadedModelResult } from './components/ModelLoader';
import { Annotations } from './components/Annotations';
import { GUIControls } from './ui/GUIControls';
import { DEVICE_PROFILES, DeviceProfile } from './config/constants';

class App {
  public viewer: Viewer;
  public lighting: Lighting;
  public environment: Environment;
  private loadingOverlay: LoadingOverlay;
  private modelLoader: ModelLoader;
  public annotations!: Annotations;
  public guiControls!: GUIControls;
  public modelResult!: LoadedModelResult;
  public currentProfile: DeviceProfile = DEVICE_PROFILES['umr-omega-30t'];
  public isReady = false;

  private bedProgress = 0;
  private bedTargetProgress = 0;
  private isBedAnimating = false;

  private tandemProgress = 0;
  private tandemTargetProgress = 0;
  private isTandemAnimating = false;

  private isRotorSpinning = false;
  private areCoilsMounted = false;
  private isCutaway = false;
  private isLaserOn = false;
  private isDarkStudio = false;
  private isWireframe = false;
  private isHaloBreathing = true;

  constructor() {
    const paramModel = new URLSearchParams(window.location.search).get('model');
    if (paramModel === 'uexplorer') this.currentProfile = DEVICE_PROFILES['uexplorer-petct'];
    else if (paramModel === 'uct') this.currentProfile = DEVICE_PROFILES['uct-960-plus'];

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
      await this.loadDeviceProfile(this.currentProfile, true);
      this.initUIEvents();
      this.initAnimationLoop();
      this.isReady = true;
      (window as unknown as Record<string, unknown>).__mriApp = this;
    } catch (err) {
      console.error('[App] 初始化失败:', err);
      this.loadingOverlay.update(100, '加载异常，请查看控制台日志');
    }
  }

  public async loadDeviceProfile(profile: DeviceProfile, firstLoad = false) {
    this.currentProfile = profile;
    this.bedProgress = 0;
    this.bedTargetProgress = 0;
    this.isBedAnimating = false;
    this.tandemProgress = 0;
    this.tandemTargetProgress = 0;
    this.isTandemAnimating = false;
    this.isRotorSpinning = false;
    this.areCoilsMounted = false;
    this.isCutaway = false;
    this.isWireframe = false;

    const loadingTitle = document.getElementById('loading-title');
    if (loadingTitle) loadingTitle.textContent = profile.title;

    if (!firstLoad) {
      const overlayEl = document.getElementById('loading-overlay');
      if (overlayEl) {
        overlayEl.style.display = 'flex';
        overlayEl.classList.remove('fade-out');
      }
      this.modelResult?.dispose();
      this.guiControls?.destroy();
    }

    this.modelResult = await this.modelLoader.load(
      this.viewer.scene,
      (percent, msg) => this.loadingOverlay.update(percent, msg),
      profile
    );

    this.syncHUDForProfile(profile);

    if (firstLoad) {
      this.annotations = new Annotations(
        this.viewer,
        (item) => {
          if (profile.supportsCoils && item.id === 'rf-coil' && !this.areCoilsMounted) {
            this.setCoilsMounted(true);
          }
        },
        profile.annotations
      );
    } else {
      this.annotations.setItems(profile.annotations);
    }

    this.initGUI();
    const pView = profile.cameraViews.perspective;
    this.viewer.animateCameraTo(pView.position, pView.target, 1.0);

    requestAnimationFrame(() => {
      this.loadingOverlay.hide();
    });
  }

  private syncHUDForProfile(profile: DeviceProfile) {
    const titleEl = document.getElementById('hud-device-title');
    const subEl = document.getElementById('hud-device-subtitle');
    if (titleEl) titleEl.textContent = profile.title;
    if (subEl) subEl.textContent = profile.subtitle;

    const badge = document.getElementById('model-source-badge');
    const badgeText = document.getElementById('model-source-text');
    if (badge && badgeText) {
      badge.className = this.modelResult.isRealGLB ? 'badge badge-success' : 'badge badge-warning';
      badgeText.textContent = this.modelResult.isRealGLB ? profile.badgeLabel : '几何工程占位模式';
    }

    document.querySelectorAll<HTMLButtonElement>('.model-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.device === profile.deviceId);
    });

    const coilsBtn = document.getElementById('btn-toggle-coils');
    if (coilsBtn) {
      coilsBtn.classList.toggle('hidden-ctrl', !profile.supportsCoils);
      coilsBtn.classList.remove('active');
    }

    const rotorBtn = document.getElementById('btn-toggle-rotor');
    const rotorText = document.getElementById('rotor-btn-text');
    if (rotorBtn) {
      rotorBtn.classList.toggle('hidden-ctrl', !profile.supportsRotorSpin);
      rotorBtn.classList.remove('active');
    }
    if (rotorText) rotorText.textContent = 'CT 滑环球管旋转演示';

    const tandemBtn = document.getElementById('btn-toggle-tandem');
    const tandemText = document.getElementById('tandem-btn-text');
    if (tandemBtn) {
      tandemBtn.classList.toggle('hidden-ctrl', !profile.supportsTandemSeparation);
      tandemBtn.classList.remove('active');
    }
    if (tandemText) tandemText.textContent = 'CT/PET 导轨分离检修态';

    const cutawayBtn = document.getElementById('btn-toggle-cutaway');
    const cutawayText = document.getElementById('cutaway-btn-text');
    if (cutawayBtn) cutawayBtn.classList.remove('active');
    if (cutawayText) cutawayText.textContent = profile.cutawayLabel;

    const bedText = document.getElementById('bed-btn-text');
    if (bedText) bedText.textContent = '推进检查床 (进孔)';

    const wireBtn = document.getElementById('btn-toggle-wireframe');
    if (wireBtn) wireBtn.classList.remove('active');
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
    // 0. Device Switcher Tabs (MR / MI / CT)
    document.querySelectorAll<HTMLButtonElement>('.model-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const devId = tab.dataset.device;
        if (devId && DEVICE_PROFILES[devId] && devId !== this.currentProfile.deviceId) {
          void this.loadDeviceProfile(DEVICE_PROFILES[devId]);
        }
      });
    });

    // 1. Camera View Presets
    const viewButtons = document.querySelectorAll<HTMLButtonElement>('.btn-view');
    viewButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        viewButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const viewKey = btn.dataset.view;
        if (viewKey && this.currentProfile.cameraViews[viewKey]) {
          const preset = this.currentProfile.cameraViews[viewKey];
          this.viewer.animateCameraTo(preset.position, preset.target, 1.15);
        }
      });
    });

    document.getElementById('btn-toggle-bed')?.addEventListener('click', () => this.toggleBedMovement());
    document.getElementById('btn-toggle-coils')?.addEventListener('click', () => this.setCoilsMounted(!this.areCoilsMounted));
    document.getElementById('btn-toggle-cutaway')?.addEventListener('click', () => this.setCutawayMode(!this.isCutaway));
    document.getElementById('btn-toggle-laser')?.addEventListener('click', () => this.setLaserMode(!this.isLaserOn));
    document.getElementById('btn-toggle-studio')?.addEventListener('click', () => this.setStudioTheme(!this.isDarkStudio));

    document.getElementById('btn-toggle-rotor')?.addEventListener('click', () => {
      this.isRotorSpinning = !this.isRotorSpinning;
      if (this.isRotorSpinning && !this.isCutaway) this.setCutawayMode(true);
      document.getElementById('btn-toggle-rotor')?.classList.toggle('active', this.isRotorSpinning);
      const txt = document.getElementById('rotor-btn-text');
      if (txt) txt.textContent = this.isRotorSpinning ? '停止 CT 滑环旋转' : 'CT 滑环球管旋转演示';
    });

    document.getElementById('btn-toggle-tandem')?.addEventListener('click', () => {
      this.tandemTargetProgress = this.tandemTargetProgress === 0 ? 1 : 0;
      this.isTandemAnimating = true;
      if (this.tandemTargetProgress === 1 && this.bedProgress > 0.05) {
        this.bedTargetProgress = 0;
        this.isBedAnimating = true;
      }
      document.getElementById('btn-toggle-tandem')?.classList.toggle('active', this.tandemTargetProgress === 1);
      const txt = document.getElementById('tandem-btn-text');
      if (txt) txt.textContent = this.tandemTargetProgress === 1 ? '合拢 CT/PET 双机架' : 'CT/PET 导轨分离检修态';
    });

    const annoBtn = document.getElementById('btn-toggle-annotations');
    annoBtn?.addEventListener('click', () => {
      const visible = this.annotations.toggleVisibility();
      annoBtn.classList.toggle('active', visible);
    });

    const wireBtn = document.getElementById('btn-toggle-wireframe');
    wireBtn?.addEventListener('click', () => {
      this.isWireframe = !this.isWireframe;
      this.modelResult.setWireframe(this.isWireframe);
      wireBtn.classList.toggle('active', this.isWireframe);
    });
  }

  public setCoilsMounted(enabled: boolean) {
    this.areCoilsMounted = enabled;
    this.modelResult.setCoilVisibility('head', enabled);
    this.modelResult.setCoilVisibility('body', enabled);
    document.getElementById('btn-toggle-coils')?.classList.toggle('active', enabled);
  }

  public setCutawayMode(enabled: boolean) {
    this.isCutaway = enabled;
    this.modelResult.setCutaway(enabled);
    document.getElementById('btn-toggle-cutaway')?.classList.toggle('active', enabled);
  }

  public setLaserMode(enabled: boolean) {
    this.isLaserOn = enabled;
    this.lighting.setLaserVisible(enabled);
    document.getElementById('btn-toggle-laser')?.classList.toggle('active', enabled);
  }

  public setStudioTheme(dark: boolean) {
    this.isDarkStudio = dark;
    this.viewer.setStudioTheme(dark);
    this.lighting.setStudioTheme(dark);
    this.environment.setStudioTheme(dark);

    document.getElementById('app')?.classList.toggle('theme-dark', dark);
    document.getElementById('btn-toggle-studio')?.classList.toggle('active', dark);
    const studioText = document.getElementById('studio-btn-text');
    if (studioText) studioText.textContent = dark ? '切换纯净白演播室' : '切换星空暗场模式';
  }

  public toggleBedMovement() {
    this.bedTargetProgress = this.bedTargetProgress === 0 ? 1 : 0;
    this.isBedAnimating = true;
    const bedBtnText = document.getElementById('bed-btn-text');
    if (bedBtnText) {
      bedBtnText.textContent = this.bedTargetProgress === 1 ? '退回检查床 (出孔)' : '推进检查床 (进孔)';
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

      if (this.isTandemAnimating) {
        const step = delta * 0.9;
        if (Math.abs(this.tandemProgress - this.tandemTargetProgress) < step) {
          this.tandemProgress = this.tandemTargetProgress;
          this.isTandemAnimating = false;
        } else {
          this.tandemProgress += Math.sign(this.tandemTargetProgress - this.tandemProgress) * step;
        }
        const eased = this.tandemProgress * this.tandemProgress * (3 - 2 * this.tandemProgress);
        this.modelResult.setTandemSeparation(eased);
      }

      if (this.isRotorSpinning && this.modelResult?.ctRotor) {
        this.modelResult.ctRotor.rotation.z -= delta * 3.6;
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
