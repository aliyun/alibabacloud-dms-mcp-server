---
name: self-hosted-mysql-ops
description: 自建/他云MySQL智能运维技能，支持SQL优化、死锁分析等基础诊断功能
---

# 自建/他云 MySQL 智能运维技能

使用阿里云 DAS Agent 的 V3 签名机制，为自建或其他云厂商的 MySQL 实例提供基础智能运维能力。

## 支持的诊断功能

### SQL 优化类
- **SQL诊断优化**: 基于表结构、索引、执行计划的 SQL 优化建议
- **建表语句查看**: 查看指定表的建表语句

### 性能诊断类  
- **最近死锁分析**: 分析 SHOW ENGINE INNODB STATUS 中的死锁日志
- **异常会话识别**: 实时查询 information_schema.processlist 和 innodb_trx

### 空间分析类
- **空间分析**: 库表空间概况分析和优化项识别
- **自增ID溢出风险**: 表自增ID使用数据分析和风险预警

### 安全类
- **安全异常事件**: 异常登录、敏感数据下载等安全事件检测
- **最新安全基线**: 数据库安全配置状态检查
- **敏感数据发现**: 数据库中的敏感信息扫描

### 实例管理类
- **实例信息查询**: 查询当前账号下的自建 MySQL 实例信息

## 调用方式

### 环境配置
```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID="your_access_key_id"
export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_access_key_secret"
```

### 命令行调用
```bash
# 使用自然语言查询
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "分析自建MySQL实例的死锁问题"

# 列出所有自建MySQL实例
python /home/admin/.openclaw/workspace/skills/das-agent/scripts/das_agent.py getDasAgentSSE \
  --query "列出所有自建MySQL实例"
```

### Python API 调用
```python
from das_agent import call_das_agent_sse

# SQL优化查询
result = call_das_agent_sse(
    query="对自建MySQL实例testdb中的SQL 'SELECT * FROM orders WHERE user_id = 123' 进行优化分析",
    stream=False
)
print(result["answer"])
```

## 注意事项

1. **标准协议**: 仅支持标准 MySQL 协议，各厂商特有定制功能暂不兼容
2. **参数要求**: 死锁分析需要开启 `innodb_deadlock_detect` 和 `innodb_print_all_deadlocks` 参数
3. **功能限制**: 由于数据采集限制，不支持 CPU 诊断、慢日志分析、HA 分析等高级功能
4. **权限要求**: 需要 DAS Agent 管理权限和数据库实例访问权限

## 技术细节

- **API 版本**: 2020-01-16
- **签名机制**: V3 签名 (ACS3-HMAC-SHA256)  
- **服务端点**: das.cn-hangzhou.aliyuncs.com
- **响应格式**: SSE (Server-Sent Events) 流式返回

## 文件结构

- `SKILL.md`: 技能说明文档
- `agents/das_agent.yaml`: 诊断能力配置文件
- `scripts/list_capabilities.py`: 能力列表脚本
- `references/sources.md`: 参考文档和注意事项