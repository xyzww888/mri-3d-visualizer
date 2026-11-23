import * as THREE from 'three';

export class Environment {
  public floorMesh: THREE.Mesh;
  public gridHelper: THREE.GridHelper;

  constructor(scene: THREE.Scene) {
    // 1. Reflective & Shadow Receiving Clinical Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.1,
      depthWrite: true
    });

    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = 0;
    this.floorMesh.receiveShadow = true;
    scene.add(this.floorMesh);

    // 2. High-tech Medical Guidance Grid & Boundary Ring
    this.gridHelper = new THREE.GridHelper(16, 32, 0x0284c7, 0x1e293b);
    this.gridHelper.position.y = 0.002;
    scene.add(this.gridHelper);

    // 3. 5 Gauss Safety Zone Ring (Five-gauss line standard for MRI rooms)
    const safetyRingGeo = new THREE.RingGeometry(3.2, 3.23, 64);
    const safetyRingMat = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });
    const safetyRing = new THREE.Mesh(safetyRingGeo, safetyRingMat);
    safetyRing.rotation.x = -Math.PI / 2;
    safetyRing.position.y = 0.003;
    scene.add(safetyRing);
  }
}
