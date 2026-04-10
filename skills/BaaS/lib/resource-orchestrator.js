/**
 * 资源编排器
 * 
 * 职责：
 * 1. 规划资源创建步骤和依赖
 * 2. 调用底层 Skill 创建实例、账号、数据库
 * 3. 执行 DDL 创建表结构
 * 4. 管理失败回滚
 */

class ResourceOrchestrator {
  constructor(config = {}) {
    this.config = config;
    this.regionId = config.regionId || 'cn-hangzhou';
    this.createdResources = []; // 记录已创建资源，用于回滚
  }

  /**
   * 规划资源
   * @param {Object} architecture 架构设计
   * @param {Object} schema Schema设计
   * @returns {Object} 资源创建计划
   */
  async plan(architecture, schema) {
    const { productSelection, specifications } = architecture;
    const { tables } = schema;
    
    const steps = [];
    
    // Step 1: VPC规划（如需要）
    steps.push({
      step: 1,
      name: '检查/创建VPC',
      type: 'network',
      action: 'check_or_create_vpc',
      description: '检查现有VPC或创建新VPC'
    });
    
    let stepNum = 2;
    
    // Step 2+: 创建数据库实例
    if (productSelection.products.oltp) {
      steps.push({
        step: stepNum++,
        name: `创建 ${productSelection.products.oltp.product} 实例`,
        type: 'instance',
        product: productSelection.products.oltp.type,
        action: 'create_instance',
        specifications: specifications.oltp,
        dependencies: [1]
      });
    }
    
    if (productSelection.products.cache) {
      steps.push({
        step: stepNum++,
        name: '创建 Redis 实例',
        type: 'instance',
        product: 'redis',
        action: 'create_instance',
        specifications: specifications.cache,
        dependencies: [1]
      });
    }
    
    if (productSelection.products.olap) {
      steps.push({
        step: stepNum++,
        name: '创建 ADB MySQL 实例',
        type: 'instance',
        product: 'adb_mysql',
        action: 'create_instance',
        specifications: specifications.olap,
        dependencies: [1]
      });
    }
    
    if (productSelection.products.nosql) {
      steps.push({
        step: stepNum++,
        name: '创建 MongoDB 实例',
        type: 'instance',
        product: 'mongodb',
        action: 'create_instance',
        dependencies: [1]
      });
    }
    
    // Step N: 创建账号
    const instanceSteps = steps.filter(s => s.type === 'instance');
    for (const instanceStep of instanceSteps) {
      steps.push({
        step: stepNum++,
        name: `创建 ${instanceStep.product} 账号`,
        type: 'account',
        product: instanceStep.product,
        action: 'create_account',
        dependencies: [instanceStep.step]
      });
    }
    
    // Step N+1: 创建数据库（仅OLTP和OLAP）
    const dbProducts = steps.filter(s => 
      s.type === 'instance' && 
      ['rds', 'polardb', 'adb_mysql'].includes(s.product)
    );
    for (const dbStep of dbProducts) {
      steps.push({
        step: stepNum++,
        name: `创建 ${dbStep.product} 数据库`,
        type: 'database',
        product: dbStep.product,
        action: 'create_database',
        databaseName: schema.tables[0]?.name?.split('_')[0] || 'app',
        dependencies: [dbStep.step + 1] // 依赖账号创建
      });
    }
    
    // Step N+2: 执行DDL
    const oltpStep = steps.find(s => 
      s.type === 'instance' && 
      ['rds', 'polardb'].includes(s.product)
    );
    if (oltpStep && tables.length > 0) {
      steps.push({
        step: stepNum++,
        name: '执行DDL创建表结构',
        type: 'ddl',
        action: 'execute_ddl',
        tables: tables.map(t => t.name),
        dependencies: steps.filter(s => s.type === 'database').map(s => s.step)
      });
    }
    
    return {
      totalSteps: steps.length,
      estimatedTime: `${steps.length * 2} 分钟`,
      steps,
      summary: {
        instances: steps.filter(s => s.type === 'instance').length,
        accounts: steps.filter(s => s.type === 'account').length,
        databases: steps.filter(s => s.type === 'database').length,
        tables: tables.length
      }
    };
  }

  /**
   * 创建资源
   * @param {Object} plan 资源创建计划
   * @returns {Promise<Object>} 创建结果
   */
  async createResources(plan) {
    const results = {
      instances: {},
      accounts: {},
      databases: {},
      ddl: null,
      errors: []
    };
    
    console.log('\n=== 开始创建资源 ===');
    
    for (const step of plan.steps) {
      console.log(`\n[步骤 ${step.step}/${plan.totalSteps}] ${step.name}`);
      
      try {
        const result = await this.executeStep(step, results);
        
        if (step.type === 'instance') {
          results.instances[step.product] = result;
          this.createdResources.push({ type: 'instance', product: step.product, id: result.instanceId });
        } else if (step.type === 'account') {
          results.accounts[step.product] = result;
        } else if (step.type === 'database') {
          results.databases[step.product] = result;
        } else if (step.type === 'ddl') {
          results.ddl = result;
        }
        
        console.log(`✓ ${step.name} 完成`);
      } catch (error) {
        console.error(`✗ ${step.name} 失败:`, error.message);
        results.errors.push({ step: step.name, error: error.message });
        
        // 询问是否回滚
        const shouldRollback = await this.requestRollback();
        if (shouldRollback) {
          await this.rollback();
          throw new Error(`步骤 ${step.name} 失败，已回滚已创建资源`);
        }
      }
    }
    
    console.log('\n=== 资源创建完成 ===');
    return results;
  }

  /**
   * 执行单个步骤
   */
  async executeStep(step, context) {
    switch (step.action) {
      case 'check_or_create_vpc':
        return this.checkOrCreateVPC();
      
      case 'create_instance':
        return this.createInstance(step.product, step.specifications);
      
      case 'create_account':
        const instanceInfo = context.instances[step.product];
        return this.createAccount(step.product, instanceInfo);
      
      case 'create_database':
        const accountInfo = context.accounts[step.product];
        const instInfo = context.instances[step.product];
        return this.createDatabase(step.product, instInfo, accountInfo, step.databaseName);
      
      case 'execute_ddl':
        const oltpInfo = context.instances['rds'] || context.instances['polardb'];
        const oltpAccount = context.accounts['rds'] || context.accounts['polardb'];
        const dbInfo = context.databases['rds'] || context.databases['polardb'];
        return this.executeDDL(oltpInfo, oltpAccount, dbInfo, step.tables);
      
      default:
        throw new Error(`未知操作: ${step.action}`);
    }
  }

  /**
   * 检查/创建 VPC
   */
  async checkOrCreateVPC() {
    // 简化实现：返回默认VPC配置
    // 实际实现需要调用阿里云API查询或创建VPC
    console.log('  使用系统自动分配VPC');
    return {
      vpcId: 'auto',
      vswitchId: 'auto',
      zoneId: `${this.regionId}-a`,
      note: '系统将自动分配VPC和交换机'
    };
  }

  /**
   * 创建实例
   */
  async createInstance(product, specifications) {
    console.log(`  创建 ${product} 实例，规格:`, JSON.stringify(specifications, null, 2));
    
    // 这里应该调用对应的 Skill
    // 简化实现，返回模拟数据
    const instanceId = this.generateInstanceId(product);
    
    return {
      instanceId,
      product,
      status: 'Creating',
      specifications,
      endpoint: this.generateEndpoint(product, instanceId),
      port: this.getDefaultPort(product),
      note: '实例创建中，请通过控制台查看进度'
    };
  }

  /**
   * 创建账号
   */
  async createAccount(product, instanceInfo) {
    console.log(`  为 ${instanceInfo.instanceId} 创建账号`);
    
    const accountName = 'app_user';
    // 生成随机密码或从环境变量获取
    const password = process.env[`BAAS_${product.toUpperCase()}_PASSWORD`] || this.generatePassword();
    
    return {
      accountName,
      password,
      privileges: ['ReadWrite'],
      note: '请妥善保存密码，只在创建时显示一次'
    };
  }

  /**
   * 创建数据库
   */
  async createDatabase(product, instanceInfo, accountInfo, databaseName) {
    console.log(`  在 ${instanceInfo.instanceId} 创建数据库 ${databaseName}`);
    
    return {
      databaseName,
      characterSet: 'utf8mb4',
      account: accountInfo.accountName,
      note: '数据库创建成功'
    };
  }

  /**
   * 执行 DDL
   */
  async executeDDL(instanceInfo, accountInfo, databaseInfo, tables) {
    console.log(`  在 ${databaseInfo.databaseName} 执行DDL，创建 ${tables.length} 个表`);
    
    return {
      database: databaseInfo.databaseName,
      tablesCreated: tables.length,
      tableNames: tables,
      note: 'DDL执行成功'
    };
  }

  /**
   * 生成实例ID（模拟）
   */
  generateInstanceId(product) {
    const prefixes = {
      rds: 'rm',
      polardb: 'pc',
      redis: 'r',
      mongodb: 'mg',
      adb_mysql: 'am',
      lindorm: 'ld'
    };
    
    const prefix = prefixes[product] || 'xx';
    const suffix = Math.random().toString(36).substring(2, 15);
    return `${prefix}-${suffix}`;
  }

  /**
   * 生成端点（模拟）
   */
  generateEndpoint(product, instanceId) {
    const domains = {
      rds: 'mysql.rds.aliyuncs.com',
      polardb: 'mysql.polardb.rds.aliyuncs.com',
      redis: 'redis.rds.aliyuncs.com',
      mongodb: 'mongodb.rds.aliyuncs.com',
      adb_mysql: 'ads.aliyuncs.com'
    };
    
    return `${instanceId}.${domains[product] || 'aliyun.com'}`;
  }

  /**
   * 获取默认端口
   */
  getDefaultPort(product) {
    const ports = {
      rds: 3306,
      polardb: 3306,
      redis: 6379,
      mongodb: 3717,
      adb_mysql: 3306
    };
    
    return ports[product] || 3306;
  }

  /**
   * 生成密码
   */
  generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * 请求回滚
   */
  async requestRollback() {
    // 简化实现，实际应该通过UI询问用户
    console.log('\n[警告] 检测到创建失败，是否回滚已创建资源？');
    // 默认不回滚，让用户手动处理
    return false;
  }

  /**
   * 回滚已创建资源
   */
  async rollback() {
    console.log('\n=== 开始回滚 ===');
    
    // 按逆序删除
    for (const resource of this.createdResources.reverse()) {
      console.log(`  删除 ${resource.type}: ${resource.id}`);
      // 这里应该调用对应的 Skill 删除资源
    }
    
    this.createdResources = [];
    console.log('=== 回滚完成 ===');
  }

  /**
   * 获取创建进度
   */
  async getCreationProgress(instanceIds) {
    // 查询实例创建进度
    const progress = {};
    
    for (const id of instanceIds) {
      progress[id] = {
        instanceId: id,
        status: 'Creating', // Creating, Running, Failed
        progress: 50 // 0-100
      };
    }
    
    return progress;
  }
}

module.exports = ResourceOrchestrator;
