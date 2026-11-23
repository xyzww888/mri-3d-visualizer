# Blender MRI 建模与 glTF 导出规范指南

本指南专为 **核磁共振（MRI）设备真实 3D 数字化建模** 制定，旨在确保在 Blender 中创建的模型能够以最高真实感、最优化性能在 Three.js WebGL 环境中流畅运行。

---

## 1. 场景与尺寸标准 (Scene & Dimensions)

* **单位系统 (Units)**:
  * 场景单位: `Metric` (公制)
  * 单位缩放 (Unit Scale): `1.0` (1 个 Blender 单位 = 1 米)
  * 长度单位: `Meters` (或 Millimeters 检查精度)
* **MRI 真实工业尺寸参考 (以 1.5T / 3.0T 超导磁共振为例)**:
  * **主磁体机架 (Gantry)**:
    * 宽度 (X): 约 `2.0m - 2.2m`
    * 高度 (Y/Z): 约 `2.1m - 2.3m`
    * 轴向深度: 约 `1.8m - 2.1m`
  * **检查孔径 (Bore Opening)**:
    * 内径孔径: `0.60m` (标准 60cm 孔径) 或 `0.70m` (大孔径舒适型 70cm)
  * **检查床 (Patient Table / Couch)**:
    * 床身全长: 约 `2.3m - 2.5m`
    * 床面宽度: 约 `0.50m - 0.55m`
    * 床面高度: 升降范围 `0.65m - 0.90m`
  * **操作屏与指示环 (Console & Halo Light)**:
    * 机身双侧触控屏 / 机顶状态屏
    * 孔口氛围光环 (Patient Comfort Halo Ring)

---

## 2. 物体层级与命名规范 (Hierarchy & Naming)

为了支持 Three.js 前端进行交互控制（如：检查床滑入孔内、零部件拆解、点击热点高亮、部件信息展示），请遵循如下命名规范：

```text
MRI_Root (Empty 根节点, 原点位于机身底部地坪中心)
├── MRI_Gantry (机体外壳)
│   ├── Gantry_Shell_Main (主白色机壳)
│   ├── Gantry_Accents (深色饰条/镀铬条)
│   ├── Gantry_Front_Panel (前盖板与指示灯)
│   └── Gantry_Touch_Screen (双侧操作显示屏)
├── MRI_Bore (检查孔内部)
│   ├── Bore_Lining (孔内吸音与导向筒)
│   └── Bore_Halo_Light (环形呼吸氛围光灯圈, Emissive 材质)
├── MRI_Patient_Table (病床总装)
│   ├── Table_Base (升降床基座, 固定)
│   └── Table_Couch_Movable (可沿 Z 轴前后平移的检查床托盘)
│       └── Table_Mattress (舒适软质床垫)
└── MRI_Accessories (附件线圈组，可单独显隐)
    ├── Coil_Head_Matrix (头颈联合线圈)
    └── Coil_Body_Array (腹部体部线圈)
```

> **重要**:
> 导出前务必选中所有网格物体，在 Object 模式下执行 `Ctrl + A` -> **Apply All Transforms (Location, Rotation, Scale)**，确保旋转均为 0，缩放均为 1。

---

## 3. PBR 材质与贴图规范 (PBR Materials)

统一使用 Blender **Principled BSDF (原理化 BSDF)** 材质节点，对应 Three.js 的 `MeshStandardMaterial` / `MeshPhysicalMaterial`：

| 部件 | 材质类型 | Base Color (基础色) | Metallic (金属度) | Roughness (粗糙度) | 说明 / 贴图 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **机壳外罩** | 医用级 ABS/PC 高光塑料 | `#F4F5F7` (微冷灰白) | `0.0` | `0.25 ~ 0.32` | 保持轻微圆角与柔和高光倒影 |
| **孔内衬板** | 漫反射吸音材料 | `#D8DCE3` 或 哑光浅灰 | `0.0` | `0.65 ~ 0.85` | 减少孔内反光 |
| **导轨与金属件** | 阳极氧化铝 / 镀铬不锈钢 | `#E0E0E0` | `0.85 ~ 1.0` | `0.15 ~ 0.25` | 明显的各向异性或锐利金属高光 |
| **光环 / LED** | 自发光 (Emission) | `#00D2FF` (科技蓝) 或 `#FFFFFF` | `0.0` | `1.0` | Emission Strength: `2.0 ~ 5.0` |
| **床垫** | 医用人造革 / 记忆海绵 | `#2C3E50` (深海军蓝) | `0.0` | `0.55 ~ 0.70` | 法线贴图表现细微皮革纹理 |
| **显示屏** | 触控玻璃 + 屏幕发光 | 屏幕 UI 纹理贴图 | `0.1` | `0.10` | 配合轻微 Emission 展现屏显内容 |

> **贴图打包建议**:
> - 推荐使用 **ORM 复合贴图**（R 通道 = Occlusion 遮挡，G 通道 = Roughness 粗糙度，B 通道 = Metallic 金属度），极大节省 Web 端显存。
> - 导出材质贴图尺寸：主贴图建议 `2048x2048`，次要零件 `1024x1024`，格式为 PNG 或 JPG。

---

## 4. 拓扑与面数控制 (Polycount & Optimization)

* **面数预算 (Target Triangles)**:
  * 建议整机三角面数控制在 **50,000 ~ 150,000** 之间。
  * 大型曲面（如外壳圆角过渡）保证光滑，避免可见折面（平滑着色 Shade Smooth + Auto Smooth 30°）。
  * 避免无意义的微小螺栓高模，推荐使用 Normal Map（法线贴图）进行细节烘焙。
* **重面与法线检查**:
  * 检查并消除重叠面 (Z-fighting)。
  * 进入 Edit 模式 `Shift + N` 统一面法线朝外。

---

## 5. glTF 2.0 / GLB 导出设置

请导出为单个打包文件 `mri_scanner.glb` 并直接存放在工程的 `public/models/mri_scanner.glb` 路径下。

### 手动导出步骤:
1. 在 Blender 中点击 `File` -> `Export` -> `glTF 2.0 (.glb/.gltf)`
2. 设置面板关键选项：
   * **Format**: `glTF Binary (.glb)`
   * **Include**:
     * `Selected Objects` (若仅导出设备模型)
     * `Custom Properties` (勾选，方便读取自定义参数)
   * **Transform**:
     * `+Y Up` (勾选，Blender 会自动处理 Y-Up 转换)
   * **Geometry**:
     * `Apply Modifiers` (勾选，自动应用镜像、细分或倒角修改器)
     * `Normals` (勾选)
     * `Tangents` (若使用了法线贴图请勾选)
     * `Compression` (推荐勾选 Draco 压缩，可使体积缩减 70%~90%)
   * **Materials**:
     * `Export Materials` (选择 Export)
     * `Images` (选择 Automatic)
3. 导出文件路径保存为: `../public/models/mri_scanner.glb`

---

## 6. 使用自动化脚本导出 (Python Script)

本项目在 `blender/export_gltf.py` 提供了自动化导出脚本。
在 Blender 命令行或内置 Scripting 窗口中执行即可一键完成清洗、坐标重置与压缩导出：

```bash
# 在终端中使用 Blender 后台执行一键导出
blender your_mri_model.blend --background --python export_gltf.py
```
