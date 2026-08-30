# 版本历史

<!-- GitHub@NDBlockConnect | BlockConnect@StarsailsClover -->

## v26.1-26.0 (2026-08-24) - LTS 发布

> 预发布说明: 本 Alpha 阶段增量在晋级前已完成一轮完整 Playwright 回归;
> WebGPU 路径可能残留轻微不稳定 (自动回退 WebGL2)。

### 新增
- 命令面板 (Ctrl+K): 模糊排序命令 + 快捷键徽章, 键盘导航
  (方向键 + Enter), 点击外部/Escape 关闭, 持久化最近使用
  (前 5 条, localStorage)
- 命令注册表: 图元、视图预设、投影切换、聚焦选中/全部、gizmo 模式、
  保存/加载/新建/下载、OBJ/JSON/PNG 导出、网格/2D-3D/物理/物理调试
  切换、速查表、全部五个工作区、已安装插件工具
- 层级实时搜索过滤 (匹配节点或任意后代; 含清除按钮)
- 面板接入统一 Escape 链 (菜单 > 速查表 > 面板 > 取消 gizmo > 取消选择)

### 测试
- 8 个新 E2E 测试 (打开/模糊执行/徽章/Escape/最近使用/工作区/
  插件工具/搜索)
- 全量套件: 360 E2E 通过 / 0 失败 + 6 单元通过

### 流程 (BC 开发流程合规)
- 特性分支 `feat/v26.1-26.0-command-palette` (不在 main 直接开发)
- SSH 签名提交 (commit.gpgsign=true, gpg.format=ssh)
- 实现前审计日志: `.devlogs/2026-08-24-v26.1-26.0.md`

## v26.1-25.0 (2026-08-24) - LTS 发布

### 新增
- 常驻状态栏 (24px, 底部):
  - 左: 随 gizmo 模式与飞行状态变化的上下文鼠标提示
  - 中: 场景名 + 未保存时的琥珀色脏标记圆点
  - 右: 节点数 | 光源数 | FPS (低于 45 琥珀色, 低于 30 红色)
- 脏标记追踪: `takeSnapshot` 标记脏; 保存/加载/新建清除
- 样式化工具提示 (深色卡片, 300ms 延迟) 覆盖所有工具栏区域按钮;
  保留原生 title 属性 (测试与可访问性不受影响)
- 首次运行引导: 4 步 (工具栏 / 层级 / 视口 / 检查器) 聚光轮廓,
  上一步/下一步/跳过; 完成标记存 localStorage; 覆盖层对指针透明,
  永不阻塞编辑

### 测试
- 8 个新 E2E 测试 (提示、脏标记生命周期、计数、FPS、工具提示、
  引导流程 + 持久化)
- 全量套件: 352 E2E 通过 / 0 失败 + 6 单元通过

## v26.1-24.0 (2026-08-24) - LTS 发布

### 新增
- 悬停轮廓: 光标下节点显示细半透明橙色线框; 射线节流 (~30 Hz),
  与 gizmo 手柄悬停相互独立 (两条反馈通道同时显示, Blender 风格)
- 多选线框: 每个选中节点都绘制橙色轮廓
- 多选组包围盒: 包裹全部选中节点的半透明橙色 AABB
- 层级选择反馈: 选中项滚动到可视区并闪烁 300 ms; 物体下方绘制
  持续 1.2 s 的青色地面标记
- 双击空白 = 全景取景 (等轴测重取景)
- 视口 Shift+点击选择改走 selectNodeMulti (添加/切换) —
  此前会静默替换整个选择
- `__noise3d_gizmo.sel()` 与 `state().hoverObj` 调试钩子

### 修复
- selectedNodeIds 失同步: addPrimitive / addCustomMeshNode / duplicateNode /
  isolateNode / selectLight / undo / redo 现在保持多选数组与
  selectedNodeId 一致 (shift-click 增选丢失的根因)
- GizmoRenderer 类结构恢复 (renderAABB 插入过早关闭了类,
  使 renderGizmo/drawRaw 游离类外)

### 测试
- 6 个新选择反馈 E2E 测试
- 全量套件: 344 E2E 通过 / 0 失败 + 6 单元通过

## v26.1-23.0 (2026-08-24) - LTS 发布

### 新增
- 资源浏览器 -> 视口拖放: 网格资源在射线命中点生成 (抬升 +0.6),
  空白处落点则在原点; 负载经 `application/x-noise3d-asset`
- OS 文件拖入窗口: .obj -> 网格导入, .png/.jpg -> 纹理导入,
  .json -> 场景导入; 悬停时虚线覆盖层高亮 (Files 类型检测 +
  enter/leave 深度计数)
- 层级拖放分区: 上下边缘 = 作为兄弟重排序 (带索引), 中部或容器节点 =
  移入内部; 视觉指示 (上/下强调线, 内部轮廓框); 无效目标显示 `none`
  放置效果并被拒绝 (父拖入自身子孙, 结构不变)
- Store: `reorderNode` (每次手势一条撤销快照), `addCustomMeshNode`
  支持可选生成位置; Scene: 公开 `canReparent`、
  `reparentAt(id, parentId, index)`
- Vite `optimizeDeps.include` 预打包 (消除导致字母序靠前 E2E 文件
  闪失的冷启动重载竞态)

### 测试
- 6 个新拖放 E2E 测试
- 全量套件: 337 E2E 通过 / 0 失败 + 6 单元通过

## v26.1-22.0 (2026-08-23) - LTS 发布

### 新增
- 右键上下文菜单, 支持键盘导航 (方向键 + Enter):
  - 视口空白: 添加 Cube/Sphere/Plane/Cylinder/Cone
  - 视口物体: 复制 (Ctrl+D) / 删除 (Del, 危险) / 聚焦 (F) /
    隔离显示 / 取消隔离
  - 层级项: 重命名 (聚焦 Inspector 名称框) / 复制 /
    移至根节点 / 删除
  - 资源项: 添加到场景 / 移除资源
- 菜单通过点击外部、Escape 或执行动作关闭; 位置钳制在视口内
- 统一 Escape 链: 关闭菜单 > 关闭速查表 > 取消 gizmo 拖拽 > 取消选择
- `?` 打开分组的键盘快捷键速查弹窗 (Esc 关闭); SHORTCUTS 注册表
  供未来命令面板复用
- 隔离模式: 仅显示所选节点, 切换恢复
- removeAsset store 动作 (资产管家集成)

### 测试
- 12 个新 E2E 测试 (菜单/隔离/Escape 链/速查表/键盘导航)
- 全量套件: 331 E2E 通过 / 0 失败 + 6 单元通过

## v26.1-21.0 (2026-08-23) - LTS 发布

### 新增
- 共享 `NumberField` 组件, 在所有数值输入中实现 Blender 绑定表
  (交互参考 §2):
  - 悬停 `<` `>` 步进箭头; 点击步进; Ctrl+滚轮免聚焦步进
  - LMB 水平拖拽滑动 (光标 ew-resize); Ctrl 按字段步长量化;
    Shift = 精度模式 (0.1 倍速率)
  - 纯点击 = 文本输入; Enter 或点击外部提交; Esc 还原;
    非法输入红色闪烁并静默还原
  - 方向键上下按步进微调 (Shift x10, Alt x0.1); Minus 取反
- 集成到 Inspector (Position/Rotation/Scale 经 `Vec3Row`,
  纹理平铺/偏移) 与 LightPanel (光源位置/方向)
- 滑动手势合并为单条撤销 (`onDragStart` 在首次移动时触发
  `takeSnapshot` — Blender 模态算子规则)

### 修复
- 旧规格迁移: 读值改为 `.numfield-display`; 写值使用
  点击-键入-Enter 助手并等待 `.numfield-editing` (消除 rAF 聚焦竞态)

### 测试
- 12 个新 NumberField E2E 测试 (微调/滑动/量化/编辑/还原/闪烁/
  滚轮/箭头/取反/撤销合并)
- 全量套件: 319 E2E 通过 / 0 失败 + 6 单元通过

## v26.1-20.1 (2026-08-23) - LTS 发布 (关键数学修复)

### 根因查明
一个基础矩阵数学错误自 v1 起悄悄破坏了所有 CPU 侧变换计算:
- `Mat4.multiply` 既不等于 A·B 也不等于 B·A (对照教科书实现验证)
- `Mat4.lookAt` 存储了转置的旋转基,导致 V·eye != 原点

GPU 渲染掩盖了二者 (GLSL 自行计算 P·V·M),但所有 JS 侧消费者全错:
射线拾取/反投影 (物体选择!)、gizmo 屏幕投影、光标缩放、模型合成
(fromTRS 丢弃旋转与缩放贡献)。这正是"实体无法被选中"、相机表现异常的根源。

### 修复
- `Mat4.multiply`: 正确的列主序三重循环 (对照参考实现 0 误差)
- `Mat4.lookAt`: 基向量按转置存储; 已验证 V·eye == 原点
- 新增单元测试验证: multiply == 教科书 A·B (0 误差), invert == 高斯约当
  参考 (完全一致), 往返误差 ~1e-8

### 新增
- 穿越相机: 按住 RMB + WASD 移动 / Q-E 升降 / Shift 三倍速 / 滚轮调速;
  退出时轨道参数自动重同步
- Alt+LMB 轨道旋转 (Unity 风格), RMB 改为穿越后保留轨道能力
- Home / ISO 现在取景场景包围盒 (frameAllIso), 而非绕陈旧目标原地旋转
- `__noise3d_cam` 调试钩子; Home 键快捷键; frameAll 事件
- 视图模式按钮恢复 (v20.1 控件重写时遗失)

### 修复 (选择)
- Gizmo 平面手柄不再拦截对物体本体的点击: 左键先对网格做射线拾取;
  平面四边形仅在空白区域拦截
- 平面手柄命中/视觉尺寸从 0.42 缩至 0.30 (相对 gizmo 比例)
- updateNodeTransform 递增 undoRevision, Inspector 实时反映 gizmo 拖拽

### 测试
- 新增: mat4-vs-reference + mat4-invert 单元套件 (6 测试)
- 新增: v23 相机/选择 E2E (6 测试: 跨物体选择、取消选择、穿越移动>1u、
  Home/ISO 取景、相机钩子)
- 全量套件: 307 E2E 通过 / 0 失败 + 6 单元通过

## v26.1-20.0 (2026-08-20) - LTS 发布

### 新增
- Gizmo 交互全面接入视口 (v10 的类此前是孤儿代码)
- 平面手柄 (XY/XZ/YZ 四边形) 支持双轴移动并正确掩码
- 面向屏幕的外环 (旋转模式) + 三根轴环
- 悬停高亮: 悬停部件增亮, 光标变 grab; 拖拽中为 grabbing
- 撤销合并: 每次拖拽手势恰好一条快照 (Blender 模态算子规则)
- Ctrl 吸附: 移动 0.5 单位 / 旋转 15 度 / 缩放 0.1 步进
- 恒定屏幕尺寸 Gizmo: 每帧按相机距离换算世界尺寸 (臂长约 45 css px)
- `__noise3d_gizmo` 调试钩子 (state/pick/project), 支持确定性 E2E 拾取测试

### 修复
- 旋转环拾取误用世界单位半径作像素值 (永不命中); 现经 pxPerWorld 换算
- updateNodeTransform 递增 undoRevision, Inspector 实时反映程序化拖拽

### 测试
- 7 个新的确定性 Gizmo E2E 测试 (悬停/光标/移动/撤销计数/吸附/平面/环/缩放)
- 全量套件: 300 通过, 0 失败

## v26.1-19.0 (2026-08-20) - LTS 发布

### 新增
- 工作区系统: 工具栏居中的 Layout / Modeling / Shading / Animation / Rendering 标签
- 每工作区面板可见性集合; 视口在所有工作区常驻
- 点击面板标题折叠面板 (带箭头指示)
- 工作区选择 + 各工作区折叠状态持久化到 localStorage
- `?ws=` URL 参数直达工作区
- WorkspaceStore (zustand), WORKSPACES 注册表与 PanelId 联合类型

### 修复
- Slot 包裹引发的面板尺寸回归: 移除遗留后代选择器规则
  (`.app-left .panel.light-panel` 的 max-height 以错误基准解析导致面板体塌陷为 0)
- 布局所有权迁移至槽层级: 按 [data-panel-id] 显式高度/弹性
- v15 物理 Play 按钮 strict 歧义 (工具栏 vs 时间线)
- v16 材质编辑器 socket 点击增加 scrollIntoViewIfNeeded (负载下偶发)

### 测试
- 17 个新 Playwright E2E 测试 (工作区/折叠/持久化)
- 全量套件: 293 通过, 0 失败
- 旧规格迁移为工作区感知 URL (?ws=modeling/shading/animation/rendering)

## v26.1-18.0 (2026-08-19) - LTS 发布

### 新增
- 插件系统 (PluginManager: 注册/注销/启用/禁用)
- PluginContext API: registerPanel, registerTool, log, getSceneStats
- 插件清单格式 (id/name/version/author/description)
- 事件钩子 (onSceneLoad, onNodeSelect, onRender)
- 管理器 UI 中内联渲染插件面板
- 工具执行与编辑器控制台集成
- 内置插件: 截图工具、CSV 导入器
- 11 个 Playwright E2E 测试

## v26.1-17.0 (2026-08-18) - LTS 发布

### 新增
- KeyframeV2 逐关键帧插值 (linear/bezier/step/ease-in/out/in-out)
- 带切线手柄的 Hermite 样条求值
- 骨骼绑定: 骨骼层级 + 人形预设 (7 骨骼)
- 正向运动学世界位置计算
- 解析式双骨骼 IK 求解器 (余弦定律)
- CurveEditorPanel (剪辑管理和关键帧插入)
- 12 个 Playwright E2E 测试

## v26.1-16.0 (2026-08-18) - LTS 发布

### 新增
- UVUnwrapper: 平面/盒形/球面/圆柱投影
- MeshOperations: 中点细分、面挤出、边倒角
- 从面叉积重算法线
- MeshEditPanel (目标显示和操作控件)
- 编辑模式选择器 (顶点/边/面)
- 10 个 Playwright E2E 测试

## v26.1-15.0 (2026-08-18) - LTS 发布

### 新增
- 地形高度图编辑 (升高/平滑/展平笔刷)
- 程序化地形生成 (4 倍频值噪声)
- 地形网格构建器 (法线计算)
- 环境设置: 渐变/纯色/程序化天空类型
- 天空颜色拾取器、雾控制 (启用/密度/颜色)
- EnvironmentPanel UI
- 12 个 Playwright E2E 测试

## v26.1-14.0 (2026-08-18) - LTS 发布

### 新增
- 节点式材质编辑器 (9 种节点类型)
- Socket 点击连接与类型校验
- 着色器图编译为 GLSL (拓扑 DFS)
- 隐式转换 (float 广播、vec3 转 vec4)
- 编译代码预览和材质保存
- 12 个 Playwright E2E 测试

## v26.1-13.0 (2026-08-17) - LTS 发布

### 新增
- 物理引擎: AABB/球体碰撞检测
- RigidBody 组件 (质量/速度/角速度)
- 基于冲量的碰撞响应、重力场
- 固定时间步进与射线查询
- 物理调试可视化开关
- 物理测试

## v26.1-12.0 (2026-08-17) - LTS 发布

### 新增
- 组件系统 (MeshFilter/MeshRenderer/Collider/Rigidbody/Camera/AudioSource)
- 检查器中的组件面板 (添加/删除/编辑属性)
- 预制体系统 (保存节点子树、实例化、覆盖)
- 自动调用 onUpdate 的脚本组件
- 组件/预制体序列化

## v26.1-11.0 (2026-08-17) - LTS 发布

### 新增
- 框选、Shift+点击多选、Ctrl+A 全选
- 多选变换操作
- 场景视图模式: 线框/实体/材质预览/渲染
- 选择轮廓渲染
- 批量删除/复制操作

## v26.1-10.0 (2026-08-16) - LTS 发布

### 新增
- 交互式移动 Gizmo (X/Y/Z 箭头 + 平面手柄)
- 交互式旋转 Gizmo (轴环)
- 交互式缩放 Gizmo (手柄 + 均匀缩放中心)
- Gizmo 手柄射线测试、屏幕空间拖拽投影
- Ctrl 吸附网格、随距离缩放的 Gizmo 尺寸
- 轴悬停高亮

## v26.1-09.0 (2026-08-18) - LTS 发布

### 新增
- **视图预设按钮**: 快速导航到前、右、顶、等轴测、后、左、底视图
- **投影模式切换**: 在透视和正交投影之间切换
- **平滑相机过渡**: 切换视图时的动画过渡
- **键盘快捷键**: 小键盘 1/3/7 切换视图, 小键盘 5 切换投影
- **改进的相机控制**: 更好的轨道、平移和缩放, 可配置灵敏度
- **居中选中**: F 键在视口中居中显示选中的物体

### 改进
- OrbitCamera 现在支持透视和正交投影模式
- 为 Renderer 和 WebGPURenderer 添加投影矩阵支持
- 光线拾取更新为支持两种投影模式
- 相机状态序列化支持

### 测试
- 14 个 Playwright E2E 测试用于相机系统
- 所有 v1-v9 和 v26.1-08.0 测试通过 (共 140 个)

## v26.1-09.0.RC (2026-08-18) - 预发布

## v26.1-08.0 (2026-08-17) - LTS 发布

### 新增
- WebGPU 渲染后端 (WGSL 着色器, 完整 PBR 管线)
- 双后端架构: WebGL2 (回退) + WebGPU (首选)
- 运行时后端检测和异步升级到 WebGPU
- 工具栏显示活跃渲染器后端徽章
- 内嵌脚本编辑器 (JavaScript 沙箱执行)
- 脚本 API: scene, nodes, lights, log() 全局变量
- 脚本错误处理和输出面板
- 代码编辑器 (Run/Reset 按钮和默认 API 文档)
- 版本控制改革: 日历-语义混合方案 (vYY.MAJOR-MM.MINOR.TYPE)
- 版本控制策略文档 (VERSIONING.md / VERSIONING_zh.md)
- @webgpu/types TypeScript WebGPU 类型定义

### 改进
- RendererFactory (createRendererSync 和 createRendererAsync)
- WebGPURenderer (ready promise 和 initialized 标志)
- ViewportPanel 在 WebGPU 失败时优雅回退到 WebGL2
- IRenderer 接口实现后端无关渲染

### 测试
- 14 个 Playwright E2E 测试 (WebGPU 和脚本)
- v1-v9 测试全部通过 (共 126 个测试)

## v26.1-08.0.RC (2026-08-17) - 预发布

## v9.0.0 (2026-08-16) - LTS 发布 (旧版本方案)

### 新增
- 动画系统 (关键帧轨道: 位置、旋转、缩放)
- 动画剪辑创建和管理
- 时间线面板 (播放/暂停, 时间滑块)
- 选中节点在当前时间插入关键帧
- 动画播放 (循环和线性插值)
- 粒子系统 (发射率、生命周期、速度、重力)
- 粒子面板 UI (每发射器控制)
- 粒子模拟 (生成、更新、颜色/大小插值)
- 工具栏 2D/3D 编辑模式切换
- 播放按钮驱动动画和粒子更新

### 改进
- Store 管理动画剪辑、粒子发射器、编辑器模式
- 时间线显示轨道列表和关键帧数量
- 可创建多个剪辑并切换

### 测试
- 18 个 Playwright E2E 测试 (动画、粒子、2D 模式)
- v1-v8 测试全部通过 (共 112 个测试)

## v9.0.0-rc.1 (2026-08-16) - 预发布

## v8.0.0 (2026-08-16) - LTS 发布

### 新增
- 后处理着色器管线 (ACES 色调映射, Bloom 亮光提取, Gamma 校正)
- 后处理着色器源码 (顶点、片段、阴影、深度调试)
- 渲染设置面板 (曝光、Bloom 阈值、Bloom 强度滑块)
- 场景导出为 OBJ 格式
- 场景导出为 JSON 格式 (完整场景元数据)
- 场景导出为 PNG (视口截图)
- 文件菜单中的导出选项 (OBJ、JSON、PNG)
- 渲染画布注册到 store 用于 PNG 导出

### 改进
- 渲染器暴露后处理参数 (曝光、Bloom 阈值、Bloom 强度)
- ViewportPanel 响应式应用后处理设置到渲染器
- SceneExporter 类 (OBJ/JSON/PNG 下载方法)

### 测试
- 13 个 Playwright E2E 测试 (导出和后处理)
- v1-v7 测试全部通过 (共 94 个测试)

## v8.0.0-rc.1 (2026-08-16) - 预发布

## v7.0.0 (2026-08-16) - LTS 发布

### 新增
- OBJ 网格文件解析器 (顶点、法线、UV、面三角化)
- 资源管理系统 (AssetManager 类)
- 资源面板 UI (网格和纹理列表)
- 通过文件对话框导入 OBJ
- 通过文件对话框导入纹理
- 自定义网格节点类型 ('custom') 绑定网格资源
- 双击资源添加自定义网格到场景
- 自定义网格上传到 WebGL 渲染器 (uploadCustomMesh)
- SceneNode 扩展 meshAssetId 和 textureAssetId

### 改进
- 渲染器支持自定义网格和图元混合渲染
- 网格缓存键区分自定义和图元网格
- OBJ 解析器支持 v/vn/vt/f 命令和四边形扇形三角化

### 测试
- 12 个 Playwright E2E 测试 (资源管理)
- v1-v6 测试全部通过 (共 81 个测试)

## v7.0.0-rc.1 (2026-08-16) - 预发布

## v6.0.0 (2026-08-16) - LTS 发布

### 新增
- 撤销/重做系统 (基于快照的状态历史, 最多 50 步)
- 键盘快捷键: Ctrl+Z (撤销), Ctrl+Y/Ctrl+Shift+Z (重做), Ctrl+D (复制)
- 撤销/重做工具栏按钮 (带禁用状态)
- 节点复制 (按钮和键盘)
- 拖放层级重排
- 层级每项悬停显示复制按钮
- UndoManager 类 (完整序列化/反序列化状态快照)
- 撤销版本追踪 (React 响应式)

### 改进
- 层级面板支持拖拽重新设置父节点
- 变更前拍摄快照 (添加、删除、复制、移动)
- 控制台记录撤销/重做/复制操作

### 测试
- 15 个 Playwright E2E 测试 (撤销/重做和层级)
- v1-v5 测试全部通过 (共 69 个测试)

## v6.0.0-rc.1 (2026-08-16) - 预发布

## v5.0.0 (2026-08-16) - LTS 发布

### 新增
- 场景序列化和反序列化 (JSON 格式)
- 保存/加载到浏览器 localStorage
- 场景下载为 .json 文件
- 从 .json 文件导入场景
- 新建场景
- 文件菜单 UI (场景名输入)
- 工具栏显示场景名
- SceneSerializer 类 (完整往返序列化)
- 节点 ID 计数器跨保存/加载持久化
- 光源序列化 (所有光源类型和属性)
- 材质序列化 (所有 PBR 属性)

### 修复
- 反序列化场景正确重建根节点子引用

### 测试
- 14 个 Playwright E2E 测试 (序列化)
- v1-v4 测试全部通过 (共 54 个测试)

## v5.0.0-rc.1 (2026-08-16) - 预发布

## v4.0.0 (2026-08-16) - LTS 发布

### 新增
- 多光源系统 (最多 8 个并发光源)
- 三种光源类型: 方向光、点光源、聚光灯
- 每光源属性: 位置、方向、颜色、强度、范围
- 聚光灯锥角 (内/外)
- 光源启用/禁用切换
- 光源面板 UI (光源列表和检查器)
- 新场景默认包含太阳 (方向光)
- 多光源 PBR 着色器 (衰减和聚光锥)

### 改进
- 片段着色器重构为逐光源贡献循环
- 光源状态管理使用不可变数组更新
- 场景持有光源数组和环境光颜色

### 测试
- 15 个 Playwright E2E 测试 (光照系统)
- v1/v2/v3 测试全部通过 (共 39 个测试)

## v4.0.0-rc.1 (2026-08-16) - 预发布

## v3.0.0 (2026-08-16) - LTS 发布

### 新增
- 基于 PBR 的材质着色器 (Cook-Torrance BRDF, GGX 分布, Smith 几何, Schlick 菲涅尔)
- 金属度和粗糙度材质参数 (滑块)
- 自发光颜色和强度控制
- 纹理支持 (UV 平铺, 偏移, 棋盘格纹理)
- 材质预设: 默认、金属、塑料、自发光、玻璃质感
- 双面渲染开关
- 纹理加载基础设施 (loadTextureFromImage, createCheckerTexture)
- 增强的检查器 (完整材质编辑 UI)

### 改进
- 片段着色器从 Blinn-Phong 升级为基于物理的渲染
- 材质状态使用不可变 Map 更新, 确保 React 正确响应
- 检查器面板重新组织为可折叠分区

### 测试
- 13 个 Playwright E2E 测试 (材质系统)
- v1/v2 测试全部通过 (26 个测试)

## v3.0.0-rc.1 (2026-08-16) - 预发布

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
