import * as THREE from 'three';

export class Lighting {
  public keyLight: THREE.DirectionalLight;
  public fillLight: THREE.DirectionalLight;
  public rimLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public boreLight: THREE.PointLight;

  constructor(scene: THREE.Scene) {
    // 1. Hemisphere Light (Soft sky/ground ambient)
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.7);
    this.hemiLight.position.set(0, 10, 0);
    scene.add(this.hemiLight);

    // 2. Key Light (Main soft shadow caster)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.keyLight.position.set(4, 6, 4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.camera.left = -4;
    this.keyLight.shadow.camera.right = 4;
    this.keyLight.shadow.camera.top = 4;
    this.keyLight.shadow.camera.bottom = -4;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    scene.add(this.keyLight);

    // 3. Fill Light (Soft cool light from opposite side)
    this.fillLight = new THREE.DirectionalLight(0xbae6fd, 1.2);
    this.fillLight.position.set(-5, 4, 2);
    scene.add(this.fillLight);

    // 4. Rim Light (Back light for silhouette edge highlights)
    this.rimLight = new THREE.DirectionalLight(0x00d2ff, 1.8);
    this.rimLight.position.set(0, 4, -5);
    scene.add(this.rimLight);

    // 5. Patient Bore Ambient Point Light (Simulating the LED light inside the bore)
    this.boreLight = new THREE.PointLight(0x00d2ff, 2.5, 3.5, 1.2);
    this.boreLight.position.set(0, 1.15, 0.2);
    scene.add(this.boreLight);
  }

  public setHaloIntensity(val: number) {
    this.boreLight.intensity = val;
  }

  public setHaloColor(hexColor: string) {
    this.boreLight.color.set(hexColor);
  }
}
