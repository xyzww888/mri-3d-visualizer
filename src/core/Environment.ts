import * as THREE from 'three';

export class Environment {
  public floorMesh: THREE.Mesh;
  public gridHelper: THREE.GridHelper;
  public safetyRing: THREE.Mesh;
  private aoMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene) {
    // 1. Infinity White Gallery Epoxy Cleanroom Floor (seamless into #e8ecf2 fog)
    const floorGeo = new THREE.CircleGeometry(24, 96);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe6eaf0,
      roughness: 0.28,
      metalness: 0.03,
      depthWrite: true
    });

    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = 0;
    this.floorMesh.receiveShadow = true;
    scene.add(this.floorMesh);

    // 2. Soft Grounding Contact AO Shadow Pads beneath Gantry & Patient Table
    const aoTex = this.createSoftAOTexture();
    const aoMat = new THREE.MeshBasicMaterial({
      map: aoTex,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });

    const gantryAO = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.25), aoMat);
    gantryAO.rotation.x = -Math.PI / 2;
    gantryAO.position.set(-0.20, 0.0015, -0.04);
    scene.add(gantryAO);
    this.aoMeshes.push(gantryAO);

    const tableAO = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 2.25), aoMat);
    tableAO.rotation.x = -Math.PI / 2;
    tableAO.position.set(0.0, 0.0016, 1.85);
    scene.add(tableAO);
    this.aoMeshes.push(tableAO);

    // 3. Optional Reference Grid (hidden by default for pure Apple/UIH gallery aesthetic!)
    this.gridHelper = new THREE.GridHelper(16, 32, 0x94a3b8, 0xcbd5e1);
    this.gridHelper.position.y = 0.002;
    this.gridHelper.visible = false;
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(this.gridHelper);

    // 4. Subtle Architectural 5-Gauss Cleanroom Floor Hairline Ring
    const safetyRingGeo = new THREE.RingGeometry(3.55, 3.57, 128);
    const safetyRingMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.24
    });
    this.safetyRing = new THREE.Mesh(safetyRingGeo, safetyRingMat);
    this.safetyRing.rotation.x = -Math.PI / 2;
    this.safetyRing.position.set(-0.1, 0.0025, 0.5);
    scene.add(this.safetyRing);
  }

  private createSoftAOTexture(): THREE.CanvasTexture {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size * 0.5);
    grad.addColorStop(0.0, 'rgba(15, 23, 42, 0.95)');
    grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.45)');
    grad.addColorStop(1.0, 'rgba(15, 23, 42, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  public setStudioTheme(dark: boolean) {
    const floorMat = this.floorMesh.material as THREE.MeshStandardMaterial;
    const ringMat = this.safetyRing.material as THREE.MeshBasicMaterial;
    if (dark) {
      floorMat.color.setHex(0x0d1526);
      floorMat.roughness = 0.34;
      floorMat.metalness = 0.14;
      ringMat.color.setHex(0x00b4ff);
      ringMat.opacity = 0.32;
    } else {
      floorMat.color.setHex(0xe6eaf0);
      floorMat.roughness = 0.28;
      floorMat.metalness = 0.03;
      ringMat.color.setHex(0x94a3b8);
      ringMat.opacity = 0.24;
    }
  }
}
