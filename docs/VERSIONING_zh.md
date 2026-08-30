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

<!-- GitHub@NDBlockConnect | BlockConnect@StarsailsClover -->

与 BC 开发流程 (Git 控制) 对齐:

- `main` -- 始终稳定, LTS 发布从此标记
- 每个增量 (BC 术语中的"大版本") 在独立特性分支上开发, 例如
  `feat/v26.1-26.0-command-palette`, 发布时以合并提交进入 `main`
- 所有提交经 SSH 签名 (`commit.gpgsign=true`, `gpg.format=ssh`)
- 提交/合并/PR 信息使用英文
- `.gitignore` 保证仓库仅含必要源码、文档与脚本

### BC 版本控制映射

BC 方案 `v{Year}.{Major}-Alpha {N}` (每个大版本十个 Alpha; Alpha 10 即
LTS 发布, 通常不显示) 与本仓库日历语义标签的映射:

| BC 概念 | 本仓库 |
|---------|--------|
| 大版本 | `v26.1` (年 26, 主版本 1) |
| Alpha 1..9 | `v26.1-XX.0.RC` 预发布 |
| Alpha 10 / 大版本发布 | `v26.1-XX.0.LTS` 发布 |
| 子大版本 (例外) | `v26.1-20.1` 风格热修复 |
| 预发布发布 | RC 标签 + 含不稳定声明的变更日志 |
| 正式发布发布 | 完整回归轮次后的 LTS 标签 |

每个大版本的主题记录于 `docs/ROADMAP.md` 与 `docs/ROADMAP-UX.md`;
健壮性工作与缺陷修复随每个增量同行。规划下一增量前对上一增量执行
30 分钟模拟使用与恶意攻击测试 (Playwright 全量轮次即此评估)。

## 提交规范

Conventional Commits 格式:
```
type(scope): description

- 变更要点

Version: v26.1-08.0.RC
```

类型: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
