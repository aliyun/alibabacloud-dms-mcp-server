---
name: self-hosted-mongodb-ops
description: 自建/他云MongoDB智能运维技能，支持基础MongoDB功能
---

# Self-Hosted MongoDB-Ops 智能运维技能

## 技能概述
专为自建或其他云厂商的 MongoDB 实例设计的智能运维技能，基于阿里云 DAS Agent 的 V3 签名机制，提供基础的 MongoDB 运维能力。

## 支持的功能范围
由于数据采集限制，自建/他云 MongoDB 实例仅支持以下基础功能：

### ✅ 支持的功能
- **安全异常事件**: 检测异常登录、敏感数据下载等安全事件
- **最新安全基线**: 查询实例的最新安全配置状态  
- **敏感数据发现**: 扫描数据库中的敏感信息
- **实例信息查询**: 查询 MongoDB 实例基本信息

### ❌ 不支持的功能
- 慢日志分析（MongoDB）
- 空间分析
- 重要性能指标总结
- 待优化实例概览
- 实例拓扑查询
- 实例配置查询
- 安全基线变化分析
- 全局/实例安全风险趋势
- 实例安全告警统计

## 使用前提
1. **AccessKey 配置**: 需要配置阿里云 RAM 用户的 AccessKey ID 和 Secret
2. **DAS Agent 开通**: 需要在阿里云控制台开通 DAS Agent 服务
3. **实例接入**: 目标 MongoDB 实例需要正常接入 DAS 服务
4. **权限要求**: RAM 用户需要具有 DAS 管理权限（AliyunHDMFullAccess 或 AliyunHDMReadOnlyAccess）

## 调用方式
使用正确的 V3 签名机制调用 `GetDasAgentSSE` 接口：

### 环境变量配置（推荐）
```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your_access_key_id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_access_key_secret"
```

### Python API 调用示例
```python
from das_agent import call_das_agent_sse

# 查询自建MongoDB实例信息
result = call_das_agent_sse(
    query="请列出我账号下的所有自建MongoDB实例",
    stream=False
)
print(result["answer"])
```

### 命令行调用
```bash
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py \
  getDasAgentSSE \
  --query "请分析自建MongoDB实例的安全状况"
```

## 注意事项
1. **标准协议**: 仅支持标准 MongoDB 协议，各厂商特有定制功能暂不兼容
2. **功能限制**: 功能受限主要是因为无法获取完整的性能监控数据和日志
3. **安全为主**: 主要提供安全相关的基础功能，适用于基本的安全合规检查

## 技术细节
- **API 版本**: 2020-01-16
- **签名机制**: V3 签名 (ACS3-HMAC-SHA256)  
- **服务端点**: das.cn-hangzhou.aliyuncs.com
- **响应格式**: SSE (Server-Sent Events) 流式返回