import * as THREE from 'three';

/**
 * Procedural MRI Scanner 3D Model.
 * Serves as an immediate high-fidelity placeholder before real Blender GLB is placed in /public/models/
 * All sub-mesh names match the Blender export hierarchy specification.
 */
export class PlaceholderMRI {
  public group: THREE.Group;
  public movableBed: THREE.Group | null = null;
  public haloLightMesh: THREE.Mesh | null = null;
  public mainMaterials: THREE.MeshStandardMaterial[] = [];

  private bedInitialZ = 1.35;
  private bedInsideZ = 0.15;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'MRI_Root';

    this.createMaterials();
    this.buildGantry();
    this.buildBore();
    this.buildPatientTable();
    this.buildDisplays();
    this.buildRFCoil();
  }

  private matShell!: THREE.MeshStandardMaterial;
  private matAccent!: THREE.MeshStandardMaterial;
  private matMetal!: THREE.MeshStandardMaterial;
  private matBoreInner!: THREE.MeshStandardMaterial;
  private matHalo!: THREE.MeshStandardMaterial;
  private matScreen!: THREE.MeshStandardMaterial;
  private matCouchPad!: THREE.MeshStandardMaterial;

  private createMaterials() {
    // Medical high-gloss white ABS casing
    this.matShell = new THREE.MeshStandardMaterial({
      color: 0xf3f4f6,
      roughness: 0.22,
      metalness: 0.05,
      name: 'Mat_MRI_Shell'
    });
    this.mainMaterials.push(this.matShell);

    // Dark sleek accent trim
    this.matAccent = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.3,
      name: 'Mat_MRI_Accent'
    });

    // Anodized Aluminum / Chrome rails
    this.matMetal = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.9,
      name: 'Mat_MRI_Metal'
    });

    // Acoustic interior bore lining
    this.matBoreInner = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.75,
      metalness: 0.0,
      name: 'Mat_MRI_Bore'
    });

    // Ambient Halo LED Light Ring
    this.matHalo = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x00d2ff,
      emissiveIntensity: 3.5,
      roughness: 0.1,
      name: 'Mat_MRI_Halo'
    });

    // Side Touchscreen
    this.matScreen = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.2,
      name: 'Mat_MRI_Screen'
    });

    // Patient Couch Cushion (Deep Medical Navy)
    this.matCouchPad = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.65,
      metalness: 0.05,
      name: 'Mat_MRI_Couch'
    });
  }

  private buildGantry() {
    const gantry = new THREE.Group();
    gantry.name = 'MRI_Gantry';

    // 1. Main outer casing (curved modern medical silhouette)
    // Using a cylinder with flattened sides or grouped shapes
    const outerGeo = new THREE.CylinderGeometry(1.22, 1.22, 1.8, 48, 1, false);
    outerGeo.rotateZ(Math.PI / 2); // align bore along Z
    outerGeo.rotateY(Math.PI / 2);

    const outerMesh = new THREE.Mesh(outerGeo, this.matShell);
    outerMesh.position.set(0, 1.18, 0);
    outerMesh.castShadow = true;
    outerMesh.receiveShadow = true;
    gantry.add(outerMesh);

    // Lower pedestal base support
    const baseGeo = new THREE.BoxGeometry(2.35, 0.45, 1.85);
    const baseMesh = new THREE.Mesh(baseGeo, this.matAccent);
    baseMesh.position.set(0, 0.22, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    gantry.add(baseMesh);

    // Front aesthetic chamfer bevel ring
    const frontBevelGeo = new THREE.TorusGeometry(0.78, 0.12, 16, 48);
    const frontBevelMesh = new THREE.Mesh(frontBevelGeo, this.matShell);
    frontBevelMesh.position.set(0, 1.18, 0.9);
    frontBevelMesh.castShadow = true;
    gantry.add(frontBevelMesh);

    // Rear aesthetic chamfer bevel ring
    const rearBevelMesh = frontBevelMesh.clone();
    rearBevelMesh.position.z = -0.9;
    gantry.add(rearBevelMesh);

    // Brand accent line running along the front face
    const accentLineGeo = new THREE.TorusGeometry(0.96, 0.02, 16, 48);
    const accentLine = new THREE.Mesh(accentLineGeo, this.matAccent);
    accentLine.position.set(0, 1.18, 0.905);
    gantry.add(accentLine);

    this.group.add(gantry);
  }

  private buildBore() {
    const bore = new THREE.Group();
    bore.name = 'MRI_Bore';

    // Inner hollow cylinder tunnel (radius 0.36m = 72cm diameter bore)
    const boreGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.82, 36, 1, true);
    boreGeo.rotateZ(Math.PI / 2);
    boreGeo.rotateY(Math.PI / 2);

    const boreMesh = new THREE.Mesh(boreGeo, this.matBoreInner);
    boreMesh.position.set(0, 1.18, 0);
    boreMesh.receiveShadow = true;
    bore.add(boreMesh);

    // Front Halo LED Comfort Light Ring
    const haloGeo = new THREE.TorusGeometry(0.38, 0.022, 16, 48);
    this.haloLightMesh = new THREE.Mesh(haloGeo, this.matHalo);
    this.haloLightMesh.name = 'Bore_Halo_Light';
    this.haloLightMesh.position.set(0, 1.18, 0.91);
    bore.add(this.haloLightMesh);

    // Rear Halo LED Ring
    const rearHalo = this.haloLightMesh.clone();
    rearHalo.position.z = -0.91;
    bore.add(rearHalo);

    this.group.add(bore);
  }

  private buildPatientTable() {
    const tableGroup = new THREE.Group();
    tableGroup.name = 'MRI_Patient_Table';

    // 1. Fixed Bed Base / Pedestal (on floor in front of bore)
    const baseGeo = new THREE.BoxGeometry(0.68, 0.65, 1.6);
    const baseMesh = new THREE.Mesh(baseGeo, this.matShell);
    baseMesh.position.set(0, 0.35, 1.7);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    tableGroup.add(baseMesh);

    // Base Accent trim
    const trimGeo = new THREE.BoxGeometry(0.72, 0.08, 1.64);
    const trimMesh = new THREE.Mesh(trimGeo, this.matAccent);
    trimMesh.position.set(0, 0.62, 1.7);
    tableGroup.add(trimMesh);

    // Dual chrome guide rails
    const railGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.2, 16);
    railGeo.rotateX(Math.PI / 2);

    const leftRail = new THREE.Mesh(railGeo, this.matMetal);
    leftRail.position.set(-0.25, 0.72, 1.5);
    tableGroup.add(leftRail);

    const rightRail = leftRail.clone();
    rightRail.position.x = 0.25;
    tableGroup.add(rightRail);

    // 2. Movable Patient Couch (Slides in/out of bore)
    this.movableBed = new THREE.Group();
    this.movableBed.name = 'Table_Couch_Movable';
    this.movableBed.position.set(0, 0.82, this.bedInitialZ);

    // Couch tray
    const trayGeo = new THREE.BoxGeometry(0.54, 0.05, 2.1);
    const trayMesh = new THREE.Mesh(trayGeo, this.matMetal);
    trayMesh.castShadow = true;
    this.movableBed.add(trayMesh);

    // Soft Mattress Cushion
    const padGeo = new THREE.BoxGeometry(0.50, 0.06, 2.0);
    const padMesh = new THREE.Mesh(padGeo, this.matCouchPad);
    padMesh.position.set(0, 0.05, 0);
    padMesh.castShadow = true;
    padMesh.receiveShadow = true;
    this.movableBed.add(padMesh);

    // Patient Headrest
    const headrestGeo = new THREE.BoxGeometry(0.32, 0.04, 0.28);
    const headrestMesh = new THREE.Mesh(headrestGeo, this.matAccent);
    headrestMesh.position.set(0, 0.09, -0.8);
    this.movableBed.add(headrestMesh);

    tableGroup.add(this.movableBed);
    this.group.add(tableGroup);
  }

  private buildDisplays() {
    const displays = new THREE.Group();
    displays.name = 'MRI_Displays';

    // Right Side Display (12.1" Touchscreen)
    const screenGeo = new THREE.BoxGeometry(0.04, 0.25, 0.35);
    const screenMesh = new THREE.Mesh(screenGeo, this.matScreen);
    screenMesh.position.set(1.18, 1.45, 0.4);
    screenMesh.rotation.y = -0.2;
    displays.add(screenMesh);

    // Left Side Display
    const leftScreen = screenMesh.clone();
    leftScreen.position.x = -1.18;
    leftScreen.rotation.y = 0.2;
    displays.add(leftScreen);

    this.group.add(displays);
  }

  private buildRFCoil() {
    if (!this.movableBed) return;

    // Stylized Head & Neck Matrix Coil resting on patient bed
    const coilGroup = new THREE.Group();
    coilGroup.name = 'Coil_Head_Matrix';

    // Helmet arch
    const archGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.32, 24, 1, false, 0, Math.PI);
    archGeo.rotateZ(Math.PI / 2);
    archGeo.rotateY(Math.PI / 2);

    const archMesh = new THREE.Mesh(archGeo, this.matShell);
    archMesh.position.set(0, 0.18, -0.75);
    archMesh.castShadow = true;
    coilGroup.add(archMesh);

    // Face open window frame
    const frameGeo = new THREE.BoxGeometry(0.24, 0.04, 0.28);
    const frameMesh = new THREE.Mesh(frameGeo, this.matAccent);
    frameMesh.position.set(0, 0.28, -0.75);
    coilGroup.add(frameMesh);

    this.movableBed.add(coilGroup);
  }

  /**
   * Set patient bed position along Z axis (0 = fully extended out, 1 = slid into bore)
   */
  public setBedProgress(progress: number) {
    if (!this.movableBed) return;
    const clamped = Math.max(0, Math.min(1, progress));
    this.movableBed.position.z = THREE.MathUtils.lerp(this.bedInitialZ, this.bedInsideZ, clamped);
  }

  public setShellColor(hex: string) {
    this.matShell.color.set(hex);
  }

  public setShellRoughness(val: number) {
    this.matShell.roughness = val;
  }

  public setShellMetalness(val: number) {
    this.matShell.metalness = val;
  }
}
