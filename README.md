# MRI 3D Digital Twin Visualizer (Three.js + Blender)

高保真核磁共振（MRI）大型医疗设备真实 3D 数字化孪生工程。

本项目构建了 **Blender 工业级 3D 资产管线** 与 **Three.js WebGL 真实感渲染引擎** 的无缝协作工程架构。支持一键加载 Blender 导出的 glTF/GLB PBR 资产，具备医用级演播室照明、检查床平移动画、3D 部件交互标注、参数调节面板及几何工程占位回退机制。

---

## 🌟 核心特性 (Features)

* **专业渲染引擎配置**:
  * 基于 `Three.js` (WebGL 2.0)，集成 `ACESFilmicToneMapping` 与高动态光照调节。
  * `PCFSoftShadowMap` 柔和物理接触阴影与医用洁净地坪反射。
  * 真实临床演播室多点光照系统（主光、柔光冷补光、轮廓边缘光、孔内 LED 环形呼吸调光）。
* **Blender 工业建模无缝对接**:
  * 遵循标准公制与真实 1.5T/3.0T 超导磁共振尺度（机身高 2.2m、孔径 70cm、检查床 2.4m）。
  * 附带专用的 `blender/export_gltf.py` 自动化导出脚本，内置 Draco 压缩与法线/切线导出优化。
  * 详尽的 [Blender 建模与导出规范手册](./blender/README.md)。
* **开箱即用与容错回退机制**:
  * 在 Blender 美术模型制作完成前，项目内置程序化高保真 **几何工程占位模型**（包含机架外壳、检查孔、电动床台、侧触控屏、头颈线圈）。
  * 开发者只需将 Blender 导出的 `mri_scanner.glb` 放入 `public/models/`，系统将自动无缝切换至高模显示！
* **丰富的交互体验**:
  * **视角预设**: 默认透视、正面机身、孔径特写、检查床位、俯视全景平滑飞跃。
  * **动态机构交互**: 支持检查床平滑进孔/退孔动画控制。
  * **3D 数字化热点标注**: 实时投影 3D 浮动标签至屏幕，点击聚焦并展示部件医疗工程规格。
  * **材质与光照控制面板**: 基于 `lil-gui` 动态微调机壳粗糙度、颜色、孔环发光强度与曝光。

---

## 📁 项目目录结构 (Directory Structure)

```text
mri-3d-visualizer/
├── .gitignore                    # Git 忽略配置 (过滤 node_modules, dist, *.blend1 临时文件)
├── package.json                  # 依赖配置 (Three.js, lil-gui, Vite, TypeScript)
├── tsconfig.json                 # TypeScript 严格模式配置
├── vite.config.ts                # Vite 现代前端构建配置
├── index.html                    # 宿主页面与现代化 HUD 界面布局
├── README.md                     # 项目技术文档与开发指引
│
├── blender/                      # Blender 建模资产与自动化工具
│   ├── README.md                 # 3D 建模尺寸规范、PBR 材质节点与层级指南
│   ├── export_gltf.py            # Blender Python 自动化 Draco 压缩导出脚本
│   └── textures/                 # 原始贴图与烘焙素材存放目录
│
├── public/                       # 静态资源
│   ├── favicon.svg               # 设备 SVG 图标
│   └── models/                   # WebGL 运行期 3D 模型资产目录
│       └── mri_scanner.glb       # Blender 导出的最终模型目标路径 (开箱检测)
│
└── src/                          # 前端源码
    ├── assets/
    │   └── styles/
    │       └── main.css          # 现代化医用工作站主题样式 (Glassmorphism & HUD)
    ├── config/
    │   └── constants.ts          # 视角预设、五大核心部件标注数据与配置项
    ├── core/
    │   ├── Viewer.ts             # 渲染器核心：Scene, Camera, Renderer, OrbitControls
    │   ├── Lighting.ts           # 医用演播室照明系统 (Key, Fill, Rim, Bore PointLight)
    │   └── Environment.ts        # 洁净室地坪、五高斯安全警戒线与参考网格
    ├── components/
    │   ├── ModelLoader.ts        # GLTF/DRACO 加载器与智能回退管理器
    │   ├── PlaceholderMRI.ts     # 程序化高保真几何工程占位模型
    │   └── Annotations.ts        # 3D 空间交互标签与视口平滑聚焦
    ├── ui/
    │   ├── GUIControls.ts        # lil-gui 实时材质与灯光调试面板
    │   └── LoadingOverlay.ts     # 动态平滑加载遮罩
    └── main.ts                   # 应用程序主入口
```

---

## 🚀 快速启动 (Quick Start)

### 1. 安装依赖

确保已安装 [Node.js](https://nodejs.org/) (推荐 v18+ 或最新 LTS 版)：

```bash
cd mri-3d-visualizer
npm install
```

### 2. 启动本地开发服务

```bash
npm run dev
```

终端将输出本地访问地址（例如 `http://localhost:3000/`），在浏览器中打开即可查看当前高保真 MRI 3D 交互场景。

### 3. 构建生产版本

```bash
npm run build
```

打包产物将输出至 `dist/` 目录，可直接部署至任何静态 Web 服务器（如 Nginx、GitHub Pages、Vercel 等）。

---

## 🎨 Blender 制作与模型替换流程 (Blender Workflow)

详细的建模工艺与层级规范请参阅 [blender/README.md](./blender/README.md)。

1. **建模制作**:
   在 Blender 中遵循 1:1 公制尺寸建模，确保物体原点统一位于机架底面中心，并完成 `Ctrl + A` -> `Apply All Transforms`。
2. **材质规范**:
   使用标准 `Principled BSDF` 节点制作 PBR 材质（金属度、粗糙度、法线贴图、自发光）。
3. **一键导出**:
   * 打开 `blender/export_gltf.py` 脚本并在 Blender Scripting 窗口中运行；
   * 或手动导出为 `glTF Binary (.glb)`，启用 Draco 压缩；
   * 将导出的文件保存为：`public/models/mri_scanner.glb`。
4. **刷新浏览器**:
   页面将自动检测到该文件，顶部状态徽章变更为绿色 **“Blender GLB 真实模型已挂载”**，无缝呈现高模效果。

---

## 📤 提交至 GitHub 仓库说明 (Pushing to GitHub)

本地已完成 Git 初始化与初次代码提交。若要推送到您自己的 GitHub 仓库，请执行以下命令：

```bash
# 1. 在 GitHub 上新建一个仓库（例如名为 mri-3d-visualizer）
# 2. 将本地分支关联到您的远程仓库 (将 YOUR_USERNAME 替换为您的 GitHub 用户名)
git remote add origin https://github.com/YOUR_USERNAME/mri-3d-visualizer.git

# 3. 推送主分支代码到 GitHub
git branch -M main
git push -u origin main
```

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](https://opensource.org/licenses/MIT) 开源许可证。
