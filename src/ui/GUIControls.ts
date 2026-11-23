import * as THREE from 'three';
import GUI from 'lil-gui';
import { Viewer } from '../core/Viewer';
import { Lighting } from '../core/Lighting';
import { Environment } from '../core/Environment';
import { LoadedModelResult } from '../components/ModelLoader';
import { CAMERA_VIEWS } from '../config/constants';

export class GUIControls {
  private gui: GUI;

  constructor(
    viewer: Viewer,
    lighting: Lighting,
    environment: Environment,
    model: LoadedModelResult,
    onBedToggle: () => void
  ) {
    this.gui = new GUI({ title: 'MRI 渲染与材质参数' });
    this.gui.close(); // Start collapsed for clean UI

    // 1. Interactive Patient Couch
    const animFolder = this.gui.addFolder('检查床交互控制');
    const animParams = {
      progress: 0,
      toggleAction: () => onBedToggle()
    };
    animFolder
      .add(animParams, 'progress', 0, 1, 0.01)
      .name('平移进孔量')
      .onChange((v: number) => {
        model.setBedProgress(v);
      });
    animFolder.add(animParams, 'toggleAction').name('一键进孔 / 出孔');

    // 2. Material Customization
    const matFolder = this.gui.addFolder('外观与材质调节');
    const matParams = {
      color: '#f3f4f6',
      roughness: 0.22,
      haloColor: '#00d2ff',
      haloIntensity: 3.5
    };
    matFolder
      .addColor(matParams, 'color')
      .name('机壳颜色')
      .onChange((c: string) => model.setShellColor(c));
    matFolder
      .add(matParams, 'roughness', 0.05, 0.9, 0.01)
      .name('高光粗糙度')
      .onChange((v: number) => model.setShellRoughness(v));
    matFolder
      .addColor(matParams, 'haloColor')
      .name('孔环光色')
      .onChange((c: string) => lighting.setHaloColor(c));
    matFolder
      .add(matParams, 'haloIntensity', 0, 10, 0.1)
      .name('孔环亮度')
      .onChange((v: number) => lighting.setHaloIntensity(v));

    // 3. Lighting Controls
    const lightFolder = this.gui.addFolder('医用演播室光照');
    const lightParams = {
      exposure: viewer.renderer.toneMappingExposure,
      keyLight: lighting.keyLight.intensity,
      fillLight: lighting.fillLight.intensity,
      rimLight: lighting.rimLight.intensity
    };
    lightFolder
      .add(lightParams, 'exposure', 0.5, 2.5, 0.05)
      .name('曝光度 (Exposure)')
      .onChange((v: number) => {
        viewer.renderer.toneMappingExposure = v;
      });
    lightFolder
      .add(lightParams, 'keyLight', 0, 5, 0.1)
      .name('主光 (Key Light)')
      .onChange((v: number) => {
        lighting.keyLight.intensity = v;
      });
    lightFolder
      .add(lightParams, 'fillLight', 0, 4, 0.1)
      .name('辅光 (Fill Light)')
      .onChange((v: number) => {
        lighting.fillLight.intensity = v;
      });
    lightFolder
      .add(lightParams, 'rimLight', 0, 5, 0.1)
      .name('轮廓光 (Rim Light)')
      .onChange((v: number) => {
        lighting.rimLight.intensity = v;
      });

    // 4. Scene Environment
    const envFolder = this.gui.addFolder('地坪与参考网格');
    const envParams = {
      showGrid: true,
      floorRoughness: 0.35
    };
    envFolder
      .add(envParams, 'showGrid')
      .name('显示地坪参考网格')
      .onChange((show: boolean) => {
        environment.gridHelper.visible = show;
      });
    envFolder
      .add(envParams, 'floorRoughness', 0.05, 0.9, 0.05)
      .name('地坪反光粗糙度')
      .onChange((v: number) => {
        (environment.floorMesh.material as THREE.MeshStandardMaterial).roughness = v;
      });

    // 5. Preset Views in GUI
    const viewFolder = this.gui.addFolder('快速视角预设');
    Object.keys(CAMERA_VIEWS).forEach((k) => {
      const preset = CAMERA_VIEWS[k];
      viewFolder
        .add(
          {
            fn: () => viewer.animateCameraTo(preset.position, preset.target, 1.2)
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
