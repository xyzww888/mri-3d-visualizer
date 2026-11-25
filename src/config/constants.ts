import * as THREE from 'three';

export interface CameraViewPreset {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
}

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

export interface DeviceProfile {
  deviceId: string;
  modality: 'MR' | 'MI' | 'CT';
  title: string;
  subtitle: string;
  badgeLabel: string;
  gltfPath: string;
  bedTravelMeters: number;
  cutawayLabel: string;
  supportsCoils: boolean;
  supportsRotorSpin: boolean;
  supportsTandemSeparation: boolean;
  cameraViews: Record<string, CameraViewPreset>;
  annotations: AnnotationItem[];
}

export const UMR_OMEGA_VIEWS: Record<string, CameraViewPreset> = {
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

export const UMR_OMEGA_ANNOTATIONS: AnnotationItem[] = [
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

export const UEXPLORER_VIEWS: Record<string, CameraViewPreset> = {
  perspective: {
    name: '全景左前视角',
    position: new THREE.Vector3(-4.65, 2.15, 5.45),
    target: new THREE.Vector3(-0.15, 1.05, 0.55)
  },
  front: {
    name: '前置 CT 正面',
    position: new THREE.Vector3(-0.08, 1.32, 5.35),
    target: new THREE.Vector3(-0.08, 1.12, 0.80)
  },
  bore: {
    name: '76cm 超长孔道',
    position: new THREE.Vector3(0.0, 1.18, 2.75),
    target: new THREE.Vector3(0, 1.12, -1.2)
  },
  bed: {
    name: '碳纤维长床',
    position: new THREE.Vector3(-2.85, 1.55, 3.85),
    target: new THREE.Vector3(0, 0.82, 2.15)
  },
  cryo: {
    name: '8环 PET 纵深',
    position: new THREE.Vector3(4.35, 2.05, 1.45),
    target: new THREE.Vector3(-0.10, 1.12, -0.35)
  },
  top: {
    name: '机房俯视包络',
    position: new THREE.Vector3(-0.15, 6.8, 0.85),
    target: new THREE.Vector3(-0.15, 0.9, 0.55)
  }
};

export const UEXPLORER_ANNOTATIONS: AnnotationItem[] = [
  {
    id: 'gantry',
    index: 1,
    name: '前置 160 层诊断级螺旋 CT 龙门总成',
    shortLabel: '前置 160层 CT',
    category: '螺旋 CT 扫描舱',
    position: new THREE.Vector3(-0.98, 1.88, 1.18),
    targetView: {
      position: new THREE.Vector3(-3.2, 1.88, 3.85),
      target: new THREE.Vector3(-0.1, 1.15, 0.95)
    },
    description: '位于整机最前端，集成 80 排 Z-Detector（160 层螺旋重建、0.25mm 各向同性分辨率）与液态金属轴承球管，完成精准解剖定位与全身衰减校正。',
    specs: {
      '探测器排数': '80 排 Z-Detector / 160 层螺旋 CT',
      '空间分辨率': '0.25 mm 各向同性分辨率',
      '管电压范围': '70 – 140 kV 高功率球管'
    }
  },
  {
    id: 'top-cryo',
    index: 2,
    name: '194cm 8 环全景数字 SiPM/LYSO 探测器阵列',
    shortLabel: '8环全身 PET 舱',
    category: '分子影像核心',
    position: new THREE.Vector3(-0.55, 2.08, -0.58),
    targetView: {
      position: new THREE.Vector3(3.65, 2.05, 1.35),
      target: new THREE.Vector3(-0.08, 1.15, -0.55)
    },
    description: '由轴向串联的 8 组独立 PET 探测环组成（每环 24 模块，共 564,480 根微晶 LYSO 与 53,760 通道 SiPM），单床位一次覆盖全身动态 4D 成像。',
    specs: {
      '轴向视野 (AFOV)': '194 cm (8 环 × 24.02 cm)',
      '系统峰值灵敏度': '~176 kcps/MBq (常规 PET 30–40 倍)',
      'TOF 时间分辨率': '505 ps · NEMA 分辨率 2.9 mm'
    }
  },
  {
    id: 'bore',
    index: 3,
    name: '76cm 宽境星空隧道 & 三向对讲系统',
    shortLabel: '76cm 宽境隧道',
    category: '人文孔径体验',
    position: new THREE.Vector3(0, 1.56, 1.44),
    targetView: {
      position: new THREE.Vector3(0.0, 1.18, 2.75),
      target: new THREE.Vector3(0, 1.12, -1.2)
    },
    description: '76cm 超宽净空孔径（探测器面对面内径 78.6cm）搭配全长星空照明穹顶与 3 组孔内对讲，消除近 2 米长隧道幽闭感。',
    specs: {
      '净空孔径': '760 mm (横向视野 TFOV 686 mm)',
      '孔内沟通': '3 In-Bore Intercoms 降噪对讲',
      '全身极速采集': '最快 30 秒单床位全身扫描'
    }
  },
  {
    id: 'touch-screen',
    index: 4,
    name: '首尾双端四联纯平黑晶触控屏',
    shortLabel: '首尾四联触控屏',
    category: '多点人机交互',
    position: new THREE.Vector3(-0.79, 1.28, 1.47),
    targetView: {
      position: new THREE.Vector3(-1.35, 1.42, 2.65),
      target: new THREE.Vector3(-0.55, 1.24, 1.42)
    },
    description: '在机架正前端左右（3/9 点位）与正后端左右共嵌入 4 块黑晶触控面板，方便技师在近 3 米机身首尾就近完成摆位。',
    specs: {
      '面板数量': '前后双端共 4 块电容黑晶屏',
      '智能引导': 'uAI 全景动态扫描工作流'
    }
  },
  {
    id: 'patient-table',
    index: 5,
    name: '250kg 超长低衰减碳纤维悬臂检查床',
    shortLabel: '碳纤维超长悬臂床',
    category: '精密传动',
    position: new THREE.Vector3(0, 0.86, 2.85),
    targetView: {
      position: new THREE.Vector3(-2.55, 1.48, 3.65),
      target: new THREE.Vector3(0, 0.78, 2.25)
    },
    description: '高模量低衰减碳纤维悬臂床板搭配加长导轨底座，支持 255cm 超长贯穿式单床位行程，满载保持亚毫米级配准精度。',
    specs: {
      '最大承重': '250 kg (550 lbs)',
      '轴向进孔行程': '255 cm 单床位全身送入'
    }
  },
  {
    id: 'tandem-rail',
    index: 6,
    name: '恒温水冷热交换舱 & CT/PET 分离导轨',
    shortLabel: '液冷与分离导轨',
    category: '可服务性设计',
    position: new THREE.Vector3(-0.62, 2.34, -0.56),
    targetView: {
      position: new THREE.Vector3(-3.35, 2.15, 2.25),
      target: new THREE.Vector3(-0.35, 1.15, 0.45)
    },
    description: '机顶收纳恒温水冷分配器，底座铺设重型滑移导轨：开启导轨分离可将前段 CT 滑出 55cm 打开内部检修通道。',
    specs: {
      '检修分离行程': '前段 CT 沿导轨前移 55 cm',
      '精密温控': '恒温冷冻水环路 + 干燥除湿风冷'
    }
  }
];

export const UCT_960_VIEWS: Record<string, CameraViewPreset> = {
  perspective: {
    name: '经典左前视角',
    position: new THREE.Vector3(-3.55, 1.82, 4.35),
    target: new THREE.Vector3(-0.18, 1.04, 0.55)
  },
  front: {
    name: '正面对称视角',
    position: new THREE.Vector3(-0.08, 1.25, 4.25),
    target: new THREE.Vector3(-0.08, 1.10, 0.25)
  },
  bore: {
    name: '82cm 超宽孔径',
    position: new THREE.Vector3(0.0, 1.15, 1.95),
    target: new THREE.Vector3(0, 1.10, -0.6)
  },
  bed: {
    name: '碳纤维扫描床',
    position: new THREE.Vector3(-2.25, 1.42, 2.75),
    target: new THREE.Vector3(0, 0.80, 1.45)
  },
  cryo: {
    name: '滑环球管透视',
    position: new THREE.Vector3(3.25, 1.85, 3.65),
    target: new THREE.Vector3(-0.05, 1.08, 0.15)
  },
  top: {
    name: '机房俯视轮廓',
    position: new THREE.Vector3(-0.12, 5.2, 0.8),
    target: new THREE.Vector3(-0.12, 0.9, 0.55)
  }
};

export const UCT_960_ANNOTATIONS: AnnotationItem[] = [
  {
    id: 'gantry',
    index: 1,
    name: '0.96m 纤薄宽体螺旋 CT 龙门机架',
    shortLabel: '纤薄宽体机架',
    category: 'CT 工业设计',
    position: new THREE.Vector3(-1.02, 1.90, 0.35),
    targetView: {
      position: new THREE.Vector3(-3.0, 1.82, 3.4),
      target: new THREE.Vector3(-0.25, 1.15, 0.05)
    },
    description: '基于 build_uexplorer.py --ct-only 参数化派生的超高端宽体螺旋 CT 模型，采用 0.96m 纤薄纵深与 P-Arch 极简外壳。',
    specs: {
      '单圈最快转速': '0.25 s/rot 超高速非接触滑环',
      '探测器覆盖': '16 cm (320 排 / 640 层各向同性)'
    }
  },
  {
    id: 'top-cryo',
    index: 2,
    name: '液态金属轴承球管 & 高压发生器',
    shortLabel: '球管与高压油箱',
    category: '射线源总成',
    position: new THREE.Vector3(0.0, 1.88, 0.05),
    targetView: {
      position: new THREE.Vector3(2.85, 1.92, 2.95),
      target: new THREE.Vector3(0.0, 1.32, 0.0)
    },
    description: '12 点位搭载高热容量液态金属轴承球管，4 点与 8 点位对称配重高压油箱与阳极冷却器。',
    specs: {
      '等效功率': '100 kW 级高输出',
      '管电压': '70 – 140 kV 连续调制'
    }
  },
  {
    id: 'rf-coil',
    index: 3,
    name: '320 排 16cm 宽体时空探测器 (Z-Detector)',
    shortLabel: '320排宽体探测器',
    category: '超低噪声信号链',
    position: new THREE.Vector3(0.45, 0.62, 0.05),
    targetView: {
      position: new THREE.Vector3(2.45, 1.35, 2.65),
      target: new THREE.Vector3(0.0, 0.72, 0.0)
    },
    description: '位于球管对侧 6 点位，TSV 硅通孔无损集成，单圈曝光即可完整覆盖全心或全脑。',
    specs: {
      'Z 轴覆盖宽度': '160 mm',
      '微晶排数': '320 排 × 0.5 mm'
    }
  },
  {
    id: 'bore',
    index: 4,
    name: '82cm 临床急诊与放疗超大孔径',
    shortLabel: '82cm 超大孔径',
    category: '宽体通道',
    position: new THREE.Vector3(0, 1.52, 0.52),
    targetView: {
      position: new THREE.Vector3(0.0, 1.15, 1.95),
      target: new THREE.Vector3(0, 1.10, -0.6)
    },
    description: '82cm 超大孔径轻松容纳创伤急救监护设备与肿瘤放疗定位装置。',
    specs: {
      '净空孔径': '820 mm',
      '智能摆位': 'uAI Vision 3D 视觉定高'
    }
  }
];

export const DEVICE_PROFILES: Record<string, DeviceProfile> = {
  'umr-omega-30t': {
    deviceId: 'umr-omega-30t',
    modality: 'MR',
    title: 'UNITED IMAGING · uMR Omega',
    subtitle: '3.0T · 75cm Ultra-Wide Bore · uAIFI Inside',
    badgeLabel: 'uMR Omega 3.0T · 75cm 极简高模',
    gltfPath: '/models/mri_scanner.glb',
    bedTravelMeters: 1.30,
    cutawayLabel: '97cm 超导磁体透视',
    supportsCoils: true,
    supportsRotorSpin: false,
    supportsTandemSeparation: false,
    cameraViews: UMR_OMEGA_VIEWS,
    annotations: UMR_OMEGA_ANNOTATIONS
  },
  'uexplorer-petct': {
    deviceId: 'uexplorer-petct',
    modality: 'MI',
    title: 'UNITED IMAGING · uEXPLORER® 探索者',
    subtitle: 'Total-Body PET/CT · 194cm 8-Ring AFOV · 76cm Bore',
    badgeLabel: 'uEXPLORER · 194cm 全景8环模型',
    gltfPath: '/models/uexplorer.glb',
    bedTravelMeters: 2.55,
    cutawayLabel: 'CT滑环 + 8环全身PET透视',
    supportsCoils: false,
    supportsRotorSpin: true,
    supportsTandemSeparation: true,
    cameraViews: UEXPLORER_VIEWS,
    annotations: UEXPLORER_ANNOTATIONS
  },
  'uct-960-plus': {
    deviceId: 'uct-960-plus',
    modality: 'CT',
    title: 'UNITED IMAGING · uCT 960+',
    subtitle: '640-Slice Wide-Area CT · 82cm Bore · 0.25s Rotation',
    badgeLabel: 'uCT 960+ · 82cm 宽体螺旋CT',
    gltfPath: '/models/uct_scanner.glb',
    bedTravelMeters: 1.85,
    cutawayLabel: '高速滑环球管与探测器透视',
    supportsCoils: false,
    supportsRotorSpin: true,
    supportsTandemSeparation: false,
    cameraViews: UCT_960_VIEWS,
    annotations: UCT_960_ANNOTATIONS
  }
};

export const CAMERA_VIEWS = UMR_OMEGA_VIEWS;
export const ANNOTATIONS_DATA = UMR_OMEGA_ANNOTATIONS;
export const MODEL_CONFIG = {
  gltfPath: '/models/mri_scanner.glb',
  dracoDecoderPath: 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
};
