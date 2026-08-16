# NOISE3D 版本控制策略

## 版本号格式

从 WebGPU 时代起, NOISE3D 采用日历-语义混合方案:

```
v{YY}.{MAJOR}-{MM}.{MINOR}.{TYPE}
```

| 字段 | 描述 | 示例 |
|------|------|------|
| YY   | 发布年份后两位 | 26 (2026年) |
| MAJOR | 年内主版本号, 架构性破坏变更时递增 | 1 |
| MM   | 发布月份两位数 | 08 |
| MINOR | 月内次版本号, 每次功能发布递增 | 0, 1, 2... |
| TYPE | 发布类型: Alpha, RC (候选发布), LTS (长期支持) | RC, LTS |

### 示例

- `v26.1-08.0.RC` -- 2026年第一个主版本, 8月, minor 0, 候选发布
- `v26.1-08.0.LTS` -- 同版本测试通过后升级为 LTS
- `v26.1-08.1.Alpha` -- 8月第二个次版本, Alpha 阶段
- `v26.1-09.0.RC` -- 9月发布, 新的 minor 周期

### 发布流程

1. **Alpha** -- 早期开发, 功能不完整, 可能崩溃
2. **RC** (候选发布) -- 功能完成, 测试前发布供 Playwright 验证
3. **LTS** -- 测试通过且稳定, 标记为长期支持

### Git 标签

每次发布获得两个 Git 标签:
- `v26.1-08.0.RC` -- 测试前候选发布
- `v26.1-08.0.LTS` -- 测试后稳定发布

### 历史版本 (v1-v9)

版本 1.0.0 到 9.0.0 使用简单递增方案。这些标签在 Git 历史中保留。从 WebGPU 集成版本起启用新方案。

## 分支策略

- `main` -- 始终稳定, LTS 发布从此标记
- `dev` -- 开发分支, 进行中的工作
- 功能分支: `feat/webgpu-backend`, `feat/code-editor` 等

## 提交规范

Conventional Commits 格式:
```
type(scope): description

- 变更要点

Version: v26.1-08.0.RC
```

类型: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
