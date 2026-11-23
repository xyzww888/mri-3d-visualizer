import * as THREE from 'three';

export interface CameraViewPreset {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export const CAMERA_VIEWS: Record<string, CameraViewPreset> = {
  perspective: {
    name: '默认透视',
    position: new THREE.Vector3(3.2, 2.2, 3.8),
    target: new THREE.Vector3(0, 1.1, 0.4)
  },
  front: {
    name: '正面机体',
    position: new THREE.Vector3(0.0, 1.3, 4.2),
    target: new THREE.Vector3(0, 1.15, 0.5)
  },
  bore: {
    name: '扫描孔径',
    position: new THREE.Vector3(0.0, 1.15, 1.7),
    target: new THREE.Vector3(0, 1.15, -0.6)
  },
  bed: {
    name: '检查床位',
    position: new THREE.Vector3(2.4, 1.4, 1.8),
    target: new THREE.Vector3(0, 0.9, 1.2)
  },
  top: {
    name: '俯视全景',
    position: new THREE.Vector3(0.0, 5.0, 0.5),
    target: new THREE.Vector3(0, 0.8, 0.5)
  }
};

export interface AnnotationItem {
  id: string;
  index: number;
  name: string;
  category: string;
  position: THREE.Vector3;
  targetView: {
    position: THREE.Vector3;
    target: THREE.Vector3;
  };
  description: string;
  specs: Record<string, string>;
}

export const ANNOTATIONS_DATA: AnnotationItem[] = [
  {
    id: 'gantry',
    index: 1,
    name: '主磁体机架 (Magnet Gantry)',
    category: '核心硬件',
    position: new THREE.Vector3(0, 2.1, 0.2),
    targetView: {
      position: new THREE.Vector3(2.8, 2.2, 3.2),
      target: new THREE.Vector3(0, 1.3, 0)
    },
    description: '采用高均匀度超导磁体，内部浸泡在液氦零下269℃超低温杜瓦瓶中，维持稳定强磁场。',
    specs: {
      '场强标称': '1.5T / 3.0T / 5.0T',
      '外形高度': '2,200 mm',
      '整机重量': '约 5,000 ~ 7,500 kg',
      '冷却介质': '液氦 (Zero Boil-off 零挥发技术)'
    }
  },
  {
    id: 'bore',
    index: 2,
    name: '患者检查孔 (Patient Bore)',
    category: '患者体验',
    position: new THREE.Vector3(0, 1.2, 0.1),
    targetView: {
      position: new THREE.Vector3(0, 1.2, 2.0),
      target: new THREE.Vector3(0, 1.15, -0.5)
    },
    description: '内部集成梯度线圈系统与患者舒适环境控制，配备动态环境氛围光环与主动降噪吸音筒壁。',
    specs: {
      '孔径直径': '700 mm (大孔径舒适型)',
      '梯度场强': '45 ~ 80 mT/m',
      '切换率': '200 T/m/s',
      '孔内照明': '双向无磁 LED 环形呼吸调光'
    }
  },
  {
    id: 'patient-table',
    index: 3,
    name: '智能平移升降检查床 (Patient Couch)',
    category: '传动系统',
    position: new THREE.Vector3(0, 0.85, 1.5),
    targetView: {
      position: new THREE.Vector3(2.2, 1.4, 2.0),
      target: new THREE.Vector3(0, 0.85, 1.3)
    },
    description: '全无磁电动伺服升降与微米级水平进退，配置内置射频背板线圈以及压力感应安全系统。',
    specs: {
      '床身长度': '2,400 mm',
      '最大承重': '250 kg',
      '水平移动': '全自动进退行程 1,800 mm',
      '定位精度': '± 0.5 mm'
    }
  },
  {
    id: 'touch-screen',
    index: 4,
    name: '双侧智能交互触控屏 (Dual Side Displays)',
    category: '人机交互',
    position: new THREE.Vector3(0.95, 1.65, 0.65),
    targetView: {
      position: new THREE.Vector3(1.6, 1.7, 1.2),
      target: new THREE.Vector3(0.95, 1.65, 0.65)
    },
    description: '医护人员可在机架两侧直观查看患者信息、进行激光准直对焦以及一键智能摆位。',
    specs: {
      '屏幕尺寸': '12.1 英寸医用高清电容屏',
      '防护等级': 'IPX5 防液体泼溅',
      '主要功能': '患者注册、激光定位、自动进床'
    }
  },
  {
    id: 'rf-coil',
    index: 5,
    name: '高密度头颈联合线圈 (RF Head/Neck Coil)',
    category: '射频系统',
    position: new THREE.Vector3(0, 0.95, 0.65),
    targetView: {
      position: new THREE.Vector3(0.8, 1.3, 1.2),
      target: new THREE.Vector3(0, 0.95, 0.65)
    },
    description: '集成数十通道超高灵敏度射频接收单元，专为颅脑与颈部高分辨率神经解剖成像设计。',
    specs: {
      '接收通道': '32 / 64 通道高密度矩阵',
      '解剖覆盖': '脑部、颈动脉、颈椎一次成像',
      '舒适设计': '开放式开窗，缓解幽闭恐惧'
    }
  }
];

export const MODEL_CONFIG = {
  gltfPath: '/models/mri_scanner.glb',
  dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
};
