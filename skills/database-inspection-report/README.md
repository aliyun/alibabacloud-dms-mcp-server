# 数据库运维报告 Skill

获取阿里云 DAS 数据库实例巡检报告。

## 功能特性

- 📋 **获取报告列表** - 查看历史巡检报告
- 📊 **获取最新报告** - 快速获取最新一份巡检报告
- 📄 **获取报告详情** - 查看完整巡检报告内容
- 🔍 **按实例筛选** - 获取指定实例的报告
- 📅 **按时间筛选** - 获取指定时间范围的报告

## 快速开始

### 1. 配置阿里云凭据

```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="<your_access_key_id>"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="<your_access_key_secret>"
```

### 2. 使用示例

```bash
cd scripts

# 获取最新一份巡检报告
python3 get_inspection_report.py --latest --pipe

# 获取最近 5 份报告列表
python3 get_inspection_report.py --list --limit 5 --pipe

# 获取指定实例的最新报告
python3 get_inspection_report.py --instance-id your-instance-id --latest --pipe

# 获取报告详情
python3 get_inspection_report.py --report-id rpt_xxx --detail --pipe

# 获取指定日期的报告
python3 get_inspection_report.py --date 2026-04-02 --pipe
```

### 3. 输出模式

| 模式 | 参数 | 用途 |
|------|------|------|
| 默认 | 无 | 直接输出报告内容 |
| 管道 | `--pipe` | 进度到 stderr，报告到 stdout |
| JSON | `--json` | JSONL 格式，机器可读 |

## 重要说明

### 报告内容处理原则

**报告内容直接完整给出，不做额外加工。**

- ✅ 原样返回 API 返回的报告内容
- ✅ 保留所有巡检项、指标、建议
- ✅ 不总结、不摘要、不修改格式
- ❌ 不添加 AI 的分析或评论

### 时间参数

- `--latest`: 获取最新一份报告
- `--limit N`: 获取最近 N 份报告（默认 5）
- `--date YYYY-MM-DD`: 获取指定日期的报告
- `--start-time --end-time`: 获取时间范围内的报告

### 实例筛选

- 不指定实例：获取所有实例的报告
- 指定 `--instance-id`: 获取特定实例的报告

## 相关文档

- [SKILL.md](./SKILL.md) - 完整技能文档
- [API Reference](./references/api-reference.md) - API 详细参考

## 技术支持

- 钉钉群：**58255008752**
- [DAS 官方文档](https://help.aliyun.com/zh/das/)
