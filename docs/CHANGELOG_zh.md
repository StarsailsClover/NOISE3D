# 版本历史

## v2.0.0 (2026-08-16) - LTS 发布

### 新增
- 轨道相机控制器 (旋转、平移、缩放)
- 基于射线的物体拾取 (屏幕到世界射线投射)
- 选中高亮 (线框叠加)
- 变换 Gizmo 控制 (移动、旋转、缩放)
- 键盘快捷键 (W/E/R 变换模式, F 居中, 1/2/3 图元, Delete 删除)
- 居中选中物体功能
- 视口画布右键菜单拦截

### 改进
- 相机状态由 OrbitCamera 类管理 (球坐标)
- 视口鼠标交互 (左键选择, 右键拖拽旋转, 中键拖拽平移, 滚轮缩放)

### 测试
- 14 个 Playwright E2E 测试 (视口导航和选择)
- v1 测试全部通过 (12 个测试)

## v2.0.0-rc.1 (2026-08-16) - 预发布

## v1.0.0 (2026-08-16) - LTS 发布

### 新增
- 项目脚手架 (React + Vite + TypeScript)
- 自定义数学库: Vec2, Vec3, Vec4, Color, Mat4
- 场景图 (SceneNode 和 Scene 类)
- WebGL2 渲染器 (Blinn-Phong 着色)
- 程序化几何体: 立方体、球体、平面、圆柱体、圆锥体
- 材质系统 (基础颜色)
- 网格渲染 (空间参考)
- 编辑器 UI: 工具栏、层级面板、视口、检查器、控制台
- 基于 Zustand 的状态管理
- ESLint、Prettier、Vitest、Playwright 配置

### 测试
- 12 个 Playwright E2E 测试通过
- TypeScript 严格模式合规
- 生产构建验证

## v1.0.0-rc.1 (2026-08-16) - 预发布
- 项目脚手架 (React + Vite + TypeScript)
- 自定义数学库: Vec2, Vec3, Vec4, Color, Mat4
- 场景图 (SceneNode 和 Scene 类)
- WebGL2 渲染器 (Blinn-Phong 着色)
- 程序化几何体: 立方体、球体、平面、圆柱体、圆锥体
- 材质系统 (基础颜色)
- 网格渲染 (空间参考)
- 编辑器 UI: 工具栏、层级面板、视口、检查器、控制台
- 基于 Zustand 的状态管理
- ESLint、Prettier、Vitest、Playwright 配置
