import * as THREE from 'three';

export class Lighting {
  public keyLight: THREE.DirectionalLight;
  public fillLight: THREE.DirectionalLight;
  public rimLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public boreLight: THREE.PointLight;
  public boreRearLight: THREE.PointLight;
  public laserGroup: THREE.Group;

  private baseHaloIntensity: number = 1.6;

  constructor(scene: THREE.Scene) {
    // 1. Soft Architectural Gallery Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 0.65);
    this.hemiLight.position.set(0, 10, 0);
    scene.add(this.hemiLight);

    // 2. Main Studio Key Light (casts crisp soft contact shadows under white cabinet & silver base)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
    this.keyLight.position.set(-4.2, 6.8, 5.2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.camera.left = -4.2;
    this.keyLight.shadow.camera.right = 4.2;
    this.keyLight.shadow.camera.top = 4.2;
    this.keyLight.shadow.camera.bottom = -4.2;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.02;
    scene.add(this.keyLight);

    // 3. Gentle Cool-Neutral Fill Light from Opposite Side (sculpts white form without flattening!)
    this.fillLight = new THREE.DirectionalLight(0xeef4fb, 0.55);
    this.fillLight.position.set(5.2, 3.6, 3.2);
    scene.add(this.fillLight);

    // 4. Subtle Overhead/Back Rim Light (defines silver collar & top shroud edges)
    this.rimLight = new THREE.DirectionalLight(0xf8fafc, 0.85);
    this.rimLight.position.set(1.5, 5.5, -5.0);
    scene.add(this.rimLight);

    // 5. Subtle Serene Ice-Blue Bore Comfort Illumination
    this.boreLight = new THREE.PointLight(0x7dd3fc, this.baseHaloIntensity, 3.2, 1.5);
    this.boreLight.position.set(0, 1.15, 0.55);
    scene.add(this.boreLight);

    this.boreRearLight = new THREE.PointLight(0x7dd3fc, this.baseHaloIntensity * 0.6, 2.8, 1.5);
    this.boreRearLight.position.set(0, 1.15, -0.55);
    scene.add(this.boreRearLight);

    // 6. Optical Laser Isocenter Alignment Crosshair
    this.laserGroup = this.buildLaserCrosshair();
    this.laserGroup.visible = false;
    scene.add(this.laserGroup);
  }

  public setStudioTheme(dark: boolean) {
    if (dark) {
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x0b1120);
      this.hemiLight.intensity = 0.5;
      this.keyLight.intensity = 1.95;
      this.fillLight.color.setHex(0xbae6fd);
      this.fillLight.intensity = 0.85;
      this.rimLight.color.setHex(0x38bdf8);
      this.rimLight.intensity = 1.35;
      this.setHaloIntensity(2.6);
    } else {
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0xcbd5e1);
      this.hemiLight.intensity = 0.65;
      this.keyLight.intensity = 1.55;
      this.fillLight.color.setHex(0xeef4fb);
      this.fillLight.intensity = 0.55;
      this.rimLight.color.setHex(0xf8fafc);
      this.rimLight.intensity = 0.85;
      this.setHaloIntensity(1.6);
    }
  }

  private buildLaserCrosshair(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'MRI_Laser_Crosshair';

    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.82
    });

    const beamPlaneMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const axialSheet = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.68), beamPlaneMat);
    axialSheet.position.set(0, 1.25, 0.92);
    group.add(axialSheet);

    const lineZ = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.003, 0.54), laserMat);
    lineZ.position.set(0, 0.902, 0.98);
    group.add(lineZ);

    const lineX = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.003, 0.004), laserMat);
    lineX.position.set(0, 0.902, 0.92);
    group.add(lineX);

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.018, 0.024, 32), laserMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.904, 0.92);
    group.add(ring);

    return group;
  }

  public setLaserVisible(visible: boolean) {
    this.laserGroup.visible = visible;
  }

  public setHaloIntensity(val: number) {
    this.baseHaloIntensity = val;
    this.boreLight.intensity = val;
    this.boreRearLight.intensity = val * 0.6;
  }

  public setHaloBreathingScale(factor: number) {
    this.boreLight.intensity = this.baseHaloIntensity * factor;
    this.boreRearLight.intensity = this.baseHaloIntensity * 0.6 * factor;
  }

  public setHaloColor(hexColor: string) {
    this.boreLight.color.set(hexColor);
    this.boreRearLight.color.set(hexColor);
  }
}
