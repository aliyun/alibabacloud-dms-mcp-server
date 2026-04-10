/**
 * BaaS (Backend as a Service) Skill - 主入口
 * 
 * 功能：
 * 1. 编排8个底层数据库Skill (RDS, PolarDB, Redis, MongoDB, ADB MySQL, Lindorm, DAS)
 * 2. 提供数据架构规划
 * 3. Schema设计（自然语言、ER图、反向工程）
 * 4. 资源编排（实例创建、账号管理、DDL执行）
 * 5. 运维优化（性能诊断、成本优化、安全审计）
 * 
 * 工作模式：
 * - 新建系统模式 (Greenfield)：从零设计并创建完整数据层
 * - 接管模式 (Takeover)：分析现有系统并提供优化建议
 * 
 * 安全边界：
 * - 只读操作自动执行
 * - 写操作需用户确认
 */

const ArchitectureEngine = require('./lib/architecture-engine');
const SchemaDesigner = require('./lib/schema-designer');
const ResourceOrchestrator = require('./lib/resource-orchestrator');
const OperationsCenter = require('./lib/operations-center');
const CredentialManager = require('./lib/credential-manager');
const utils = require('./lib/utils');

/**
 * BaaS Skill 主类
 */
class BaaSSkill {
  constructor(config = {}) {
    this.config = {
      regionId: config.regionId || process.env.ALIBABA_CLOUD_REGION || 'cn-hangzhou',
      accessKeyId: config.accessKeyId || process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      accessKeySecret: config.accessKeySecret || process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
      ...config
    };
    
    // 初始化各模块
    this.architectureEngine = new ArchitectureEngine(this.config);
    this.schemaDesigner = new SchemaDesigner(this.config);
    this.resourceOrchestrator = new ResourceOrchestrator(this.config);
    this.operationsCenter = new OperationsCenter(this.config);
    this.credentialManager = new CredentialManager();
    
    // 项目状态（内存存储，无状态设计）
    this.projects = new Map();
  }

  /**
   * ==================== 模式1：新建系统模式 ====================
   */

  /**
   * 新建系统 - 完整流程
   * @param {Object} requirements 业务需求描述
   * @returns {Promise<Object>} 创建结果和连接信息
   */
  async createNewSystem(requirements) {
    console.log('=== BaaS: 新建系统模式 ===');
    
    // Step 1: 需求理解
    console.log('\n[Step 1/5] 分析业务需求...');
    const analyzedRequirements = await this.analyzeRequirements(requirements);
    
    // Step 2: 架构决策
    console.log('\n[Step 2/5] 设计数据架构...');
    const architecture = await this.designArchitecture(analyzedRequirements);
    
    // Step 3: Schema设计
    console.log('\n[Step 3/5] 设计数据模型...');
    const schema = await this.designSchema(analyzedRequirements, architecture);
    
    // Step 4: 资源编排（需用户确认）
    console.log('\n[Step 4/5] 准备创建资源...');
    const resourcePlan = await this.planResources(architecture, schema);
    
    // 显示创建计划，请求确认
    const confirmed = await this.requestConfirmation('create', resourcePlan);
    if (!confirmed) {
      return { status: 'cancelled', message: '用户取消了资源创建' };
    }
    
    const resources = await this.resourceOrchestrator.createResources(resourcePlan);
    
    // Step 5: 返回连接信息
    console.log('\n[Step 5/5] 生成连接信息...');
    const connections = this.generateConnectionInfo(resources, schema);
    
    // 保存项目信息
    const projectId = utils.generateProjectId();
    this.projects.set(projectId, {
      id: projectId,
      name: requirements.projectName || 'untitled',
      mode: 'greenfield',
      requirements: analyzedRequirements,
      architecture,
      schema,
      resources,
      connections,
      createdAt: new Date().toISOString()
    });
    
    return {
      status: 'success',
      projectId,
      architecture: architecture.summary,
      connections,
      schema: schema.tables
    };
  }

  /**
   * 分析业务需求
   */
  async analyzeRequirements(requirements) {
    const { projectName, description, entities, scale } = requirements;
    
    // 解析实体和访问模式
    const analyzedEntities = entities || this.parseEntitiesFromDescription(description);
    
    // 估算规模
    const estimatedScale = scale || this.estimateScale(description, analyzedEntities);
    
    return {
      projectName,
      description,
      entities: analyzedEntities,
      scale: estimatedScale,
      dataPatterns: this.analyzeDataPatterns(analyzedEntities),
      accessPatterns: this.analyzeAccessPatterns(analyzedEntities)
    };
  }

  /**
   * 设计数据架构
   */
  async designArchitecture(requirements) {
    return this.architectureEngine.design(requirements);
  }

  /**
   * 设计Schema
   */
  async designSchema(requirements, architecture) {
    return this.schemaDesigner.design(requirements, architecture);
  }

  /**
   * 规划资源
   */
  async planResources(architecture, schema) {
    return this.resourceOrchestrator.plan(architecture, schema);
  }

  /**
   * ==================== 模式2：接管模式 ====================
   */

  /**
   * 接管现有系统
   * @param {Object} connectionInfo 现有系统连接信息
   * @returns {Promise<Object>} 诊断报告和优化建议
   */
  async takeoverExistingSystem(connectionInfo) {
    console.log('=== BaaS: 接管模式 ===');
    
    // Step 1: 连接并分析现状
    console.log('\n[Step 1/4] 连接现有系统...');
    const existingSystem = await this.connectAndAnalyze(connectionInfo);
    
    // Step 2: 自动诊断（只读）
    console.log('\n[Step 2/4] 执行自动诊断...');
    const diagnosis = await this.operationsCenter.diagnose(existingSystem);
    
    // Step 3: 生成优化建议
    console.log('\n[Step 3/4] 生成优化建议...');
    const recommendations = await this.generateRecommendations(diagnosis);
    
    // Step 4: 返回报告
    console.log('\n[Step 4/4] 生成诊断报告...');
    const report = this.generateReport(existingSystem, diagnosis, recommendations);
    
    return {
      status: 'success',
      mode: 'takeover',
      existingSystem: {
        instanceType: existingSystem.type,
        instanceId: existingSystem.instanceId,
        engineVersion: existingSystem.engineVersion,
        specifications: existingSystem.specifications
      },
      diagnosis: diagnosis.summary,
      recommendations: recommendations.map(r => ({
        type: r.type,
        priority: r.priority,
        description: r.description,
        impact: r.impact,
        action: r.action,
        requiresConfirmation: r.requiresWrite
      })),
      report
    };
  }

  /**
   * 执行优化建议
   */
  async executeOptimization(projectId, recommendationId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`项目 ${projectId} 不存在`);
    }
    
    const recommendation = project.recommendations.find(r => r.id === recommendationId);
    if (!recommendation) {
      throw new Error(`优化建议 ${recommendationId} 不存在`);
    }
    
    // 请求用户确认
    const confirmed = await this.requestConfirmation('optimize', recommendation);
    if (!confirmed) {
      return { status: 'cancelled', message: '用户取消了优化操作' };
    }
    
    // 执行优化
    return this.operationsCenter.execute(recommendation);
  }

  /**
   * ==================== 辅助方法 ====================
   */

  /**
   * 从描述中解析实体
   */
  parseEntitiesFromDescription(description) {
    // 简单的实体识别逻辑
    const entities = [];
    
    // 常见业务实体关键词
    const entityPatterns = [
      { name: 'user', keywords: ['用户', '会员', 'customer', 'user'] },
      { name: 'order', keywords: ['订单', 'order'] },
      { name: 'product', keywords: ['商品', '产品', 'product', 'item'] },
      { name: 'payment', keywords: ['支付', 'payment', 'transaction'] },
      { name: 'inventory', keywords: ['库存', 'inventory', 'stock'] },
      { name: 'category', keywords: ['分类', '类目', 'category'] },
      { name: 'logistics', keywords: ['物流', '配送', 'logistics', 'shipping'] },
      { name: 'comment', keywords: ['评论', '评价', 'comment', 'review'] }
    ];
    
    const lowerDesc = description.toLowerCase();
    
    for (const pattern of entityPatterns) {
      if (pattern.keywords.some(k => lowerDesc.includes(k.toLowerCase()))) {
        entities.push({
          name: pattern.name,
          inferred: true,
          confidence: 'medium'
        });
      }
    }
    
    return entities;
  }

  /**
   * 估算系统规模
   */
  estimateScale(description, entities) {
    const lowerDesc = description.toLowerCase();
    
    // 根据关键词估算
    let dau = 10000; // 默认日活1万
    let qps = 100;
    let storageGB = 100;
    
    if (lowerDesc.includes('百万') || lowerDesc.includes('million')) {
      dau = 1000000;
      qps = 5000;
      storageGB = 1000;
    } else if (lowerDesc.includes('十万') || lowerDesc.includes('100k')) {
      dau = 100000;
      qps = 1000;
      storageGB = 500;
    } else if (lowerDesc.includes('一万') || lowerDesc.includes('10k')) {
      dau = 10000;
      qps = 100;
      storageGB = 100;
    }
    
    return {
      estimatedDAU: dau,
      estimatedQPS: qps,
      estimatedStorageGB: storageGB,
      growthRate: 'moderate'
    };
  }

  /**
   * 分析数据模式
   */
  analyzeDataPatterns(entities) {
    const patterns = {
      hotData: [],
      warmData: [],
      coldData: []
    };
    
    for (const entity of entities) {
      const name = entity.name.toLowerCase();
      
      // 热数据：高频访问
      if (['user', 'session', 'cache', 'config'].includes(name)) {
        patterns.hotData.push(entity);
      }
      // 冷数据：历史归档
      else if (['log', 'history', 'archive', 'backup'].includes(name)) {
        patterns.coldData.push(entity);
      }
      // 温数据：业务主数据
      else {
        patterns.warmData.push(entity);
      }
    }
    
    return patterns;
  }

  /**
   * 分析访问模式
   */
  analyzeAccessPatterns(entities) {
    return {
      readHeavy: entities.length > 0,
      writeHeavy: false,
      balanced: true,
      needCache: entities.some(e => ['user', 'product'].includes(e.name.toLowerCase()))
    };
  }

  /**
   * 连接并分析现有系统
   */
  async connectAndAnalyze(connectionInfo) {
    const { type, host, port, account, password, database } = connectionInfo;
    
    // 根据类型调用对应的诊断方法
    switch (type) {
      case 'rds':
      case 'polardb':
        return this.operationsCenter.analyzeMySQL(connectionInfo);
      case 'redis':
        return this.operationsCenter.analyzeRedis(connectionInfo);
      case 'mongodb':
        return this.operationsCenter.analyzeMongoDB(connectionInfo);
      default:
        throw new Error(`不支持的数据库类型: ${type}`);
    }
  }

  /**
   * 生成优化建议
   */
  async generateRecommendations(diagnosis) {
    const recommendations = [];
    
    // 性能优化建议
    if (diagnosis.slowQueries && diagnosis.slowQueries.length > 0) {
      recommendations.push({
        id: utils.generateId(),
        type: 'performance',
        priority: 'high',
        description: `发现 ${diagnosis.slowQueries.length} 个慢查询，建议优化`,
        impact: '提升查询响应速度',
        action: '创建索引或优化SQL',
        requiresWrite: true,
        details: diagnosis.slowQueries
      });
    }
    
    // 成本优化建议
    if (diagnosis.largeTables && diagnosis.largeTables.length > 0) {
      recommendations.push({
        id: utils.generateId(),
        type: 'cost',
        priority: 'medium',
        description: `发现 ${diagnosis.largeTables.length} 个大表，建议归档冷数据`,
        impact: '降低存储成本',
        action: '归档历史数据到OSS',
        requiresWrite: true,
        details: diagnosis.largeTables
      });
    }
    
    // 架构优化建议
    if (diagnosis.cacheOpportunities) {
      recommendations.push({
        id: utils.generateId(),
        type: 'architecture',
        priority: 'medium',
        description: '建议引入Redis缓存热点数据',
        impact: '减轻数据库压力，提升并发能力',
        action: '创建Redis实例并实施缓存策略',
        requiresWrite: true
      });
    }
    
    return recommendations;
  }

  /**
   * 生成连接信息
   */
  generateConnectionInfo(resources, schema) {
    const connections = {};
    
    for (const [layer, resource] of Object.entries(resources)) {
      if (resource && resource.endpoint) {
        connections[layer] = {
          type: resource.type,
          instanceId: resource.instanceId,
          host: resource.endpoint,
          port: resource.port,
          database: resource.database,
          account: resource.account,
          connectionString: this.buildConnectionString(resource)
        };
      }
    }
    
    return connections;
  }

  /**
   * 构建连接字符串
   */
  buildConnectionString(resource) {
    const { type, endpoint, port, database, account } = resource;
    
    switch (type) {
      case 'mysql':
      case 'polardb':
        return `mysql://${account}:****@${endpoint}:${port}/${database}`;
      case 'redis':
        return `redis://:****@${endpoint}:${port}/0`;
      case 'mongodb':
        return `mongodb://${account}:****@${endpoint}:${port}/${database}`;
      default:
        return `${type}://${endpoint}:${port}`;
    }
  }

  /**
   * 请求用户确认
   */
  async requestConfirmation(actionType, details) {
    // 在实际实现中，这里应该通过UI或交互方式请求用户确认
    // 简化实现：返回true表示需要确认，由调用方处理确认逻辑
    console.log(`\n[需要用户确认] 操作类型: ${actionType}`);
    console.log('详情:', JSON.stringify(details, null, 2));
    
    // 返回确认请求对象，由上层处理
    return {
      needsConfirmation: true,
      actionType,
      details,
      message: this.getConfirmationMessage(actionType, details)
    };
  }

  /**
   * 获取确认消息
   */
  getConfirmationMessage(actionType, details) {
    const messages = {
      create: `即将创建以下资源，预计费用请参考阿里云官网定价：\n${JSON.stringify(details, null, 2)}`,
      optimize: `即将执行优化操作：\n${details.description || details.action}`,
      delete: `即将删除资源，此操作不可恢复，请确认：\n${JSON.stringify(details, null, 2)}`
    };
    
    return messages[actionType] || '请确认此操作';
  }

  /**
   * 生成诊断报告
   */
  generateReport(existingSystem, diagnosis, recommendations) {
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        overallHealth: diagnosis.overallHealth || 'unknown',
        criticalIssues: recommendations.filter(r => r.priority === 'critical').length,
        warnings: recommendations.filter(r => r.priority === 'high').length,
        suggestions: recommendations.filter(r => r.priority === 'medium').length
      },
      systemOverview: {
        type: existingSystem.type,
        version: existingSystem.engineVersion,
        specifications: existingSystem.specifications,
        databaseSize: existingSystem.databaseSize
      },
      findings: diagnosis.findings || [],
      recommendations: recommendations.map(r => ({
        type: r.type,
        priority: r.priority,
        description: r.description,
        action: r.action
      }))
    };
  }
}

// 导出主类和工具函数
module.exports = BaaSSkill;
module.exports.ArchitectureEngine = ArchitectureEngine;
module.exports.SchemaDesigner = SchemaDesigner;
module.exports.ResourceOrchestrator = ResourceOrchestrator;
module.exports.OperationsCenter = OperationsCenter;
module.exports.CredentialManager = CredentialManager;
module.exports.utils = utils;
