# BaaS - 阿里云数据库 Backend-as-a-Service

阿里云数据库一站式编排服务，为 AI 平台和应用开发者提供完整的数据层解决方案。

## 核心能力

### 1. 智能架构规划
- 根据业务规模、访问模式、成本预算自动推荐最佳数据库组合
- 支持 OLTP + Cache + OLAP 混合架构设计
- 数据分层策略（热数据/温数据/冷数据）

### 2. Schema 设计
- 自然语言描述自动生成表结构
- ER 图解析生成 DDL
- 反向工程分析现有数据库

### 3. 实例全生命周期管理
- 一键创建多类型数据库实例
- 自动配置 VPC、白名单、账号
- 监控、备份、扩容、升级

### 4. 稳定性运维
- 自动性能诊断和优化建议
- 成本分析和优化方案
- 安全审计和合规检查

### 5. 面向应用的服务
- 统一连接管理
- 读写分离配置
- 缓存策略设计

## 支持的数据库产品

| 产品 | 类型 | 适用场景 |
|------|------|----------|
| RDS MySQL | 关系型数据库 | 中小型业务系统 |
| PolarDB MySQL | 云原生数据库 | 高并发、大容量业务 |
| Redis | 缓存数据库 | 热点数据、会话存储 |
| MongoDB | 文档数据库 | 非结构化数据存储 |
| ADB MySQL | 分析型数据库 | 实时分析、报表查询 |
| Lindorm | 多模数据库 | 时序数据、物联网 |

## 使用场景

- **新建系统** - 从零开始设计完整的数据层架构
- **系统优化** - 接管现有数据库进行性能/成本优化
- **多库管理** - 统一管理多种类型的数据库实例
- **架构升级** - 从单库升级到分布式架构

## 安装

```bash
# 将 skill 复制到 skills 目录
cp -r BaaS ~/.qoderwork/skills/

# 配置环境变量
cd ~/.qoderwork/skills/BaaS
cp .env.example .env
# 编辑 .env 填入阿里云 AKSK
```

## 配置

创建 `.env` 文件：

```bash
# 阿里云凭证
ALIBABA_CLOUD_ACCESS_KEY_ID=your-ak
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-sk
ALIBABA_CLOUD_REGION=cn-hangzhou

# 数据库账号（用于接管模式）
BAAS_RDS_ACCOUNT=admin
BAAS_RDS_PASSWORD=your-password
```

## 快速开始

```javascript
const BaaSSkill = require('./index');

// 初始化
const baas = new BaaSSkill({
  regionId: 'cn-hangzhou'
});

// 新建系统模式
async function createNewSystem() {
  const result = await baas.createNewSystem({
    projectName: '电商系统',
    description: 'B2C电商平台，包含用户、商品、订单功能',
    entities: [
      { name: 'user' },
      { name: 'product' },
      { name: 'order' }
    ],
    scale: {
      estimatedDAU: 100000,
      estimatedQPS: 1000
    }
  });
  
  console.log(result);
}

// 接管模式
async function takeoverSystem() {
  const result = await baas.takeoverExistingSystem({
    type: 'rds',
    host: 'rm-xxxx.mysql.rds.aliyuncs.com',
    port: 3306,
    database: 'myapp',
    account: 'admin',
    password: 'password'
  });
  
  console.log(result);
}
```

## 工作模式

### 1. 新建系统模式 (Greenfield)

从零开始设计并创建完整数据层：

1. 分析业务需求
2. 设计数据架构
3. 设计数据模型
4. 创建资源（需确认）
5. 返回连接信息

### 2. 接管模式 (Takeover)

分析现有系统并提供优化建议：

1. 连接现有数据库
2. 自动诊断（只读）
3. 生成优化建议
4. 用户确认后执行优化

## 安全边界

| 操作类型 | 执行策略 |
|---------|---------|
| 只读查询/诊断 | 自动执行 |
| 创建资源 | 需用户确认 |
| 修改配置 | 需用户确认 |
| 删除资源 | 需用户确认 |

## 项目结构

```
backend-as-a-service/
├── index.js                 # 主入口
├── lib/
│   ├── architecture-engine.js   # 架构决策引擎
│   ├── schema-designer.js       # Schema 设计器
│   ├── resource-orchestrator.js # 资源编排器
│   ├── operations-center.js     # 运维中心
│   ├── credential-manager.js    # 凭证管理
│   └── utils.js                 # 工具函数
├── package.json
├── README.md
├── SKILL.md
└── .env.example
```

## API 参考

### BaaSSkill

#### createNewSystem(requirements)

新建系统模式入口。

**参数：**
- `requirements` {Object}
  - `projectName` {string} 项目名称
  - `description` {string} 业务描述
  - `entities` {Array} 实体列表
  - `scale` {Object} 规模估算

**返回：**
- `status` {string} 状态
- `projectId` {string} 项目ID
- `architecture` {Object} 架构设计
- `connections` {Object} 连接信息

#### takeoverExistingSystem(connectionInfo)

接管模式入口。

**参数：**
- `connectionInfo` {Object}
  - `type` {string} 数据库类型
  - `host` {string} 主机地址
  - `port` {number} 端口
  - `database` {string} 数据库名
  - `account` {string} 账号
  - `password` {string} 密码

**返回：**
- `status` {string} 状态
- `diagnosis` {Object} 诊断结果
- `recommendations` {Array} 优化建议

## 限制说明

1. **单用户模式**：当前版本不支持多租户
2. **阿里云限定**：仅支持阿里云数据库产品
3. **数据同步**：TP→AP 同步需用户自行配置
4. **应用逻辑**：不包含业务层代码生成

## License

MIT
