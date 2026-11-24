import * as THREE from 'three';
import GUI from 'lil-gui';
import { Viewer } from '../core/Viewer';
import { Lighting } from '../core/Lighting';
import { Environment } from '../core/Environment';
import { LoadedModelResult } from '../components/ModelLoader';
import { CAMERA_VIEWS } from '../config/constants';

export interface GUICallbacks {
  onBedToggle: () => void;
  onCoilsToggle: (enabled: boolean) => void;
  onCutawayToggle: (enabled: boolean) => void;
  onLaserToggle: (enabled: boolean) => void;
  onStudioThemeToggle: (dark: boolean) => void;
  onHaloPulseToggle: (enabled: boolean) => void;
}

export class GUIControls {
  private gui: GUI;

  constructor(
    viewer: Viewer,
    lighting: Lighting,
    environment: Environment,
    model: LoadedModelResult,
    callbacks: GUICallbacks
  ) {
    this.gui = new GUI({ title: '光影与工程微调' });
    this.gui.close();

    const mechFolder = this.gui.addFolder('检查床与组件控制');
    const mechParams = {
      progress: 0,
      toggleAction: () => callbacks.onBedToggle(),
      mountCoils: false,
      cutawayMode: false,
      laserAlignment: false,
      darkStudio: false
    };
    mechFolder
      .add(mechParams, 'progress', 0, 1, 0.01)
      .name('检查床进孔行程')
      .onChange((v: number) => model.setBedProgress(v));
    mechFolder.add(mechParams, 'toggleAction').name('推进 / 退回检查床');
    mechFolder
      .add(mechParams, 'mountCoils')
      .name('装配 uAIFI 射频线圈')
      .onChange((v: boolean) => callbacks.onCoilsToggle(v));
    mechFolder
      .add(mechParams, 'cutawayMode')
      .name('97cm 净磁体透视')
      .onChange((v: boolean) => callbacks.onCutawayToggle(v));
    mechFolder
      .add(mechParams, 'laserAlignment')
      .name('激光十字定位线')
      .onChange((v: boolean) => callbacks.onLaserToggle(v));
    mechFolder
      .add(mechParams, 'darkStudio')
      .name('星空暗场演播室')
      .onChange((v: boolean) => callbacks.onStudioThemeToggle(v));

    const matFolder = this.gui.addFolder('极简材质与光晕');
    const matParams = {
      color: '#f7f8fa',
      roughness: 0.20,
      haloColor: '#6ad8ff',
      haloIntensity: 2.8,
      haloBreathing: true
    };
    matFolder
      .addColor(matParams, 'color')
      .name('珠光白机壳色温')
      .onChange((c: string) => model.setShellColor(c));
    matFolder
      .add(matParams, 'roughness', 0.05, 0.85, 0.01)
      .name('缎面粗糙度')
      .onChange((v: number) => model.setShellRoughness(v));
    matFolder
      .addColor(matParams, 'haloColor')
      .name('孔内月牙光色')
      .onChange((c: string) => {
        lighting.setHaloColor(c);
        model.setHaloColor(c);
      });
    matFolder
      .add(matParams, 'haloIntensity', 0, 6, 0.1)
      .name('孔内光晕强度')
      .onChange((v: number) => {
        lighting.setHaloIntensity(v * 0.65);
        model.setHaloIntensity(v);
      });
    matFolder
      .add(matParams, 'haloBreathing')
      .name('呼吸柔和调光')
      .onChange((v: boolean) => callbacks.onHaloPulseToggle(v));

    const envFolder = this.gui.addFolder('摄影棚光照与地坪');
    const envParams = {
      exposure: viewer.renderer.toneMappingExposure,
      envIntensity: viewer.scene.environmentIntensity,
      showGrid: false,
      floorRoughness: 0.28
    };
    envFolder
      .add(envParams, 'exposure', 0.6, 1.8, 0.02)
      .name('曝光度')
      .onChange((v: number) => {
        viewer.renderer.toneMappingExposure = v;
      });
    envFolder
      .add(envParams, 'envIntensity', 0.2, 1.6, 0.05)
      .name('柔光箱反射强度')
      .onChange((v: number) => {
        viewer.scene.environmentIntensity = v;
      });
    envFolder
      .add(envParams, 'showGrid')
      .name('显示辅助测量网格')
      .onChange((show: boolean) => {
        environment.gridHelper.visible = show;
      });
    envFolder
      .add(envParams, 'floorRoughness', 0.05, 0.85, 0.05)
      .name('环氧地坪粗糙度')
      .onChange((v: number) => {
        (environment.floorMesh.material as THREE.MeshStandardMaterial).roughness = v;
      });

    const viewFolder = this.gui.addFolder('快速视角切换');
    Object.keys(CAMERA_VIEWS).forEach((k) => {
      const preset = CAMERA_VIEWS[k];
      viewFolder
        .add(
          {
            fn: () => viewer.animateCameraTo(preset.position, preset.target, 1.15)
          },
          'fn'
        )
        .name(preset.name);
    });
  }

  public destroy() {
    this.gui.destroy();
  }
}
