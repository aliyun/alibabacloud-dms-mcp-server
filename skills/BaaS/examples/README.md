# BaaS Skill 示例代码

本目录包含 BaaS Skill 的使用示例，帮助用户快速上手。

## 示例列表

### 1. create-ecommerce-system.js

展示如何使用 BaaS Skill 创建一个完整的电商系统数据层。

**功能**：
- 架构决策（选择合适的数据库产品组合）
- Schema 设计（用户、商品、订单表）
- 资源编排（创建 PolarDB、Redis、ADB 实例）
- 返回连接信息

**运行**：
```bash
cd /Users/fuxi.wb/.qoderwork/skills/backend-as-a-service
node examples/create-ecommerce-system.js
```

### 2. takeover-existing-system.js

展示如何使用 BaaS Skill 接管现有数据库系统并进行优化。

**功能**：
- 连接现有实例
- 自动诊断（性能、容量、安全）
- 生成优化建议
- 用户确认后执行优化

**运行**：
```bash
cd /Users/fuxi.wb/.qoderwork/skills/backend-as-a-service
node examples/takeover-existing-system.js
```

### 3. api-usage-examples.js

展示如何直接使用各子 Skill 的 API 创建数据库实例。

**功能**：
- PolarDB 创建示例
- Redis 创建示例
- RDS 创建示例
- ADB MySQL 创建示例
- Lindorm 创建示例
- MongoDB 创建示例
- 等待实例就绪的通用方法

**运行**：
```bash
cd /Users/fuxi.wb/.qoderwork/skills/backend-as-a-service
node examples/api-usage-examples.js
```

## 环境准备

1. 配置环境变量：
```bash
export ALIBABA_CLOUD_ACCESS_KEY_ID=your-ak
export ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-sk
export ALIBABA_CLOUD_REGION=cn-hangzhou
```

2. 确保已安装所有依赖 Skill：
- rds-database-operation
- polardb-database-operation
- redis-database-operation
- mongodb-database-operation
- adb-mysql-database-operation
- lindorm-database-operation

## 注意事项

1. **密码安全**：示例代码中的密码仅供演示，实际使用时必须由用户提供
2. **资源清理**：测试完成后请及时释放实例，避免产生不必要的费用
3. **VPC 配置**：示例中不指定 VPC，让系统自动分配，避免可用区不匹配错误
