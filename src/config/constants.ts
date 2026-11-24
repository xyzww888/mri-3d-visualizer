import * as THREE from 'three';

export interface CameraViewPreset {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export const CAMERA_VIEWS: Record<string, CameraViewPreset> = {
  perspective: {
    name: '经典左前视角',
    position: new THREE.Vector3(-3.82, 1.86, 4.78),
    target: new THREE.Vector3(-0.22, 1.04, 0.80)
  },
  front: {
    name: '正面对称视角',
    position: new THREE.Vector3(-0.10, 1.28, 4.55),
    target: new THREE.Vector3(-0.10, 1.15, 0.65)
  },
  bore: {
    name: '75cm 超大孔径',
    position: new THREE.Vector3(0.0, 1.18, 2.08),
    target: new THREE.Vector3(0, 1.12, -0.5)
  },
  bed: {
    name: '极简升降床台',
    position: new THREE.Vector3(-2.35, 1.42, 2.85),
    target: new THREE.Vector3(0, 0.82, 1.75)
  },
  cryo: {
    name: '右前透视视角',
    position: new THREE.Vector3(3.45, 1.88, 4.15),
    target: new THREE.Vector3(-0.05, 1.08, 0.65)
  },
  top: {
    name: '俯视建筑轮廓',
    position: new THREE.Vector3(-0.15, 5.4, 1.0),
    target: new THREE.Vector3(-0.15, 0.9, 0.85)
  }
};

export interface AnnotationItem {
  id: string;
  index: number;
  name: string;
  shortLabel: string;
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
    name: '非对称雕塑一体式机架 (P-Arch Monolith)',
    shortLabel: '极简雕塑主机',
    category: '工业设计',
    position: new THREE.Vector3(-1.02, 1.92, 0.75),
    targetView: {
      position: new THREE.Vector3(-3.1, 1.85, 3.6),
      target: new THREE.Vector3(-0.35, 1.20, 0.25)
    },
    description: '还原联影 uMR Omega 标志性建筑美学：左侧垂直落地纯白立方体与右侧同心圆弧相切过渡，外凸圆形前盘镶嵌一整圈喷砂阳极氧化银铝饰环。',
    specs: {
      '静磁场强': '3.0 Tesla (97cm 超大净磁体)',
      '设计语言': '纯白珠光缎面 + 喷砂阳极氧化铝环',
      '最大视野': '60 × 60 × 50 cm³ 超大 FOV',
      '梯度性能': '3.5 MW 峰值功率 · 200 T/m/s'
    }
  },
  {
    id: 'bore',
    index: 2,
    name: '75cm 纯白渐扩孔径 & Starlight 星空光幕',
    shortLabel: '75cm 宽境孔径',
    category: '头等舱体验',
    position: new THREE.Vector3(0, 1.54, 0.85),
    targetView: {
      position: new THREE.Vector3(0.0, 1.18, 2.05),
      target: new THREE.Vector3(0, 1.12, -0.5)
    },
    description: '业界首创 75cm 超大孔径采用无螺钉纯白一体喇叭口曲面，内壁嵌入纤细冰蓝月牙氛围灯条与顶部 Starlight 光纤星空穹顶。',
    specs: {
      '净空孔径': '750 mm (空间提升 33%)',
      '孔内照明': '双侧纤细月牙灯弧 + Starlight 星空',
      '静音技术': 'uAIFI QScan 全序列静音扫描',
      '准直系统': '12 点位微缝隐藏式激光准直窗'
    }
  },
  {
    id: 'touch-screen',
    index: 3,
    name: '双侧纯平梯形黑晶触控屏 (Flush OLED)',
    shortLabel: '纯平梯形触控屏',
    category: '人机交互',
    position: new THREE.Vector3(-0.78, 1.28, 0.86),
    targetView: {
      position: new THREE.Vector3(-1.15, 1.38, 2.05),
      target: new THREE.Vector3(-0.55, 1.25, 0.82)
    },
    description: '摒弃传统外挂支架屏幕，在圆形前面板 3 点与 9 点位纯平嵌入水平弧边梯形曜石黑晶 OLED 屏，实现患者信息确认与一键智能摆位。',
    specs: {
      '嵌入形态': '0 凸起同心圆弧梯形纯平黑晶玻璃',
      '智能平台': 'uAIFI 类脑平台 · EasyScan 一键摆位',
      '生理感知': 'EasySense 非接触毫米波呼吸门控'
    }
  },
  {
    id: 'patient-table',
    index: 4,
    name: '三段式纯白极简升降床 (310kg Couch)',
    shortLabel: '纯白三段升降床',
    category: '精密传动',
    position: new THREE.Vector3(0, 0.86, 2.35),
    targetView: {
      position: new THREE.Vector3(-2.15, 1.38, 2.85),
      target: new THREE.Vector3(0, 0.78, 1.85)
    },
    description: '底部采用超薄喷砂阳极氧化铝底座与对接桥板，三段圆角跑道型纯白套筒立柱完全隐藏机械结构，床尾一体成型纯白环状推拉扶手搭配浅鸽灰软垫。',
    specs: {
      '最大承重': '310 kg (681 lbs)',
      '扫描行程': '205 cm 全身大范围移动',
      '底座材质': '一体喷砂阳极氧化铝地台',
      '床面软垫': '浅鸽灰抗菌超薄记忆海绵垫'
    }
  },
  {
    id: 'rf-coil',
    index: 5,
    name: '纯白开放式头颈线圈 & SuperFlex 毯式线圈',
    shortLabel: 'uAIFI 射频线圈',
    category: '高密射频',
    position: new THREE.Vector3(0, 0.96, 1.08),
    targetView: {
      position: new THREE.Vector3(-1.35, 1.38, 1.95),
      target: new THREE.Vector3(0, 0.95, 1.25)
    },
    description: '点击将自动装配纯白极简开放式头颈联合线圈与 uAIFI SuperFlex 轻薄毯式相控阵线圈，兼顾高通道信噪比与舒适检查体验。',
    specs: {
      '体部线圈': 'uAIFI SuperFlex 超柔轻量化毯式线圈',
      '头颈线圈': '全景大视窗纯白一体式头颈矩阵',
      '接收通道': '最高支持 96 通道全数字射频'
    }
  },
  {
    id: 'top-cryo',
    index: 6,
    name: '隐藏式 4K 零液氦挥发冷头舱 (Zero Boil-Off)',
    shortLabel: '隐藏式 4K 冷头舱',
    category: '超导恒温',
    position: new THREE.Vector3(-0.62, 2.36, -0.05),
    targetView: {
      position: new THREE.Vector3(-2.75, 2.45, 2.35),
      target: new THREE.Vector3(-0.55, 2.05, -0.05)
    },
    description: '顶部圆角纯白一体式设备舱将 4K 制冷冷头与失超管路优雅收纳其中，下方由一道纤细阳极氧化银铝腰线与主柜体分隔。',
    specs: {
      '液氦消耗': '0% 零挥发闭环运行 (Zero Boil-Off)',
      '工作温度': '4.18 K (-269 ℃ 超导液氦温区)',
      '维护设计': '全封闭纯白降噪整流罩'
    }
  }
];

export const MODEL_CONFIG = {
  gltfPath: '/models/mri_scanner.glb',
  dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
};
