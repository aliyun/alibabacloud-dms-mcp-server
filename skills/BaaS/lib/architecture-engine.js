/**
 * 架构决策引擎
 * 
 * 职责：
 * 1. 根据业务需求选择合适的数据库产品组合
 * 2. 设计数据分层策略（热/温/冷数据）
 * 3. 确定实例规格和配置
 */

class ArchitectureEngine {
  constructor(config = {}) {
    this.config = config;
    this.regionId = config.regionId || 'cn-hangzhou';
  }

  /**
   * 设计数据架构
   * @param {Object} requirements 分析后的需求
   * @returns {Object} 架构设计
   */
  async design(requirements) {
    const { entities, scale, dataPatterns, accessPatterns } = requirements;
    
    // 决策1：选择数据库产品
    const productSelection = this.selectProducts(entities, scale, accessPatterns);
    
    // 决策2：数据分层
    const dataLayers = this.designDataLayers(entities, dataPatterns);
    
    // 决策3：实例规格
    const specifications = this.determineSpecifications(scale, productSelection);
    
    // 决策4：高可用和扩展策略
    const haStrategy = this.determineHAStrategy(scale);
    
    return {
      summary: {
        recommendation: productSelection.primaryRecommendation,
        architecture: productSelection.architecture,
        estimatedMonthlyCost: this.estimateCost(productSelection, specifications)
      },
      productSelection,
      dataLayers,
      specifications,
      haStrategy,
      rationale: this.generateRationale(productSelection, dataLayers)
    };
  }

  /**
   * 选择数据库产品
   */
  selectProducts(entities, scale, accessPatterns) {
    const products = {
      oltp: null,
      cache: null,
      olap: null,
      nosql: null
    };
    
    const architecture = [];
    
    // OLTP 选择
    if (scale.estimatedQPS > 5000 || scale.estimatedDAU > 100000) {
      products.oltp = {
        product: 'PolarDB MySQL',
        type: 'polardb',
        reason: '高并发场景，PolarDB 提供读写分离和弹性扩展能力',
        features: ['读写分离', '秒级扩容', '并行查询']
      };
      architecture.push('PolarDB MySQL (OLTP主库)');
    } else {
      products.oltp = {
        product: 'RDS MySQL',
        type: 'rds',
        reason: '中等负载，RDS 成本更优',
        features: ['稳定可靠', '备份恢复', '监控告警']
      };
      architecture.push('RDS MySQL (OLTP主库)');
    }
    
    // 缓存层
    if (accessPatterns.needCache || scale.estimatedQPS > 1000) {
      products.cache = {
        product: 'Redis',
        type: 'redis',
        reason: '热点数据缓存，减轻数据库压力',
        features: ['高性能', '丰富数据结构', '持久化'],
        useCases: ['会话存储', '热点数据', '限流计数']
      };
      architecture.push('Redis (缓存层)');
    }
    
    // OLAP 层（如有分析需求）
    const hasAnalytics = entities.some(e => 
      ['report', 'analytics', 'dashboard', '统计'].some(k => 
        e.name.toLowerCase().includes(k)
      )
    );
    
    if (hasAnalytics || scale.estimatedStorageGB > 500) {
      products.olap = {
        product: 'ADB MySQL',
        type: 'adb_mysql',
        reason: '实时分析场景，支持复杂查询',
        features: ['列式存储', '向量化执行', '实时写入'],
        useCases: ['实时报表', '用户行为分析', 'BI查询']
      };
      architecture.push('ADB MySQL (分析库)');
    }
    
    // NoSQL（如有文档/时序需求）
    const hasDocuments = entities.some(e => 
      ['content', 'log', 'document', 'json'].some(k => 
        e.name.toLowerCase().includes(k)
      )
    );
    
    if (hasDocuments) {
      products.nosql = {
        product: 'MongoDB',
        type: 'mongodb',
        reason: '灵活的文档模型，适合非结构化数据',
        features: ['灵活Schema', '水平扩展', '丰富查询']
      };
      architecture.push('MongoDB (文档存储)');
    }
    
    return {
      products,
      architecture: architecture.join(' + '),
      primaryRecommendation: architecture[0]
    };
  }

  /**
   * 设计数据分层
   */
  designDataLayers(entities, dataPatterns) {
    const layers = {
      hot: {
        storage: 'Redis',
        data: dataPatterns.hotData,
        ttl: '7d',
        description: '高频访问数据，如用户会话、实时状态'
      },
      warm: {
        storage: 'PolarDB/RDS',
        data: dataPatterns.warmData,
        retention: '1year',
        description: '业务主数据，如订单、用户信息'
      },
      cold: {
        storage: 'OSS',
        data: dataPatterns.coldData,
        retention: 'permanent',
        description: '历史归档数据，如日志、历史订单'
      }
    };
    
    // 数据流转策略
    const dataFlow = {
      hotToWarm: '业务数据写入OLTP，同时缓存到Redis',
      warmToCold: '历史数据通过定时任务归档到OSS',
      syncStrategy: accessPatterns => {
        if (accessPatterns.realTimeSync) {
          return 'Flink CDC 实时同步到ADB';
        }
        return '定时批量同步（T+1）';
      }
    };
    
    return { layers, dataFlow };
  }

  /**
   * 确定实例规格
   */
  determineSpecifications(scale, productSelection) {
    const specs = {};
    
    // OLTP 规格
    const { estimatedQPS, estimatedDAU, estimatedStorageGB } = scale;
    
    if (productSelection.products.oltp) {
      if (productSelection.products.oltp.type === 'polardb') {
        specs.oltp = this.selectPolarDBSpec(estimatedQPS, estimatedStorageGB);
      } else {
        specs.oltp = this.selectRDSSpec(estimatedQPS, estimatedStorageGB);
      }
    }
    
    // Redis 规格
    if (productSelection.products.cache) {
      specs.cache = this.selectRedisSpec(estimatedDAU);
    }
    
    // ADB 规格
    if (productSelection.products.olap) {
      specs.olap = this.selectADBSpec(estimatedStorageGB);
    }
    
    return specs;
  }

  /**
   * 选择 PolarDB 规格
   */
  selectPolarDBSpec(qps, storageGB) {
    if (qps > 10000) {
      return {
        nodeClass: 'polar.mysql.x8.2xlarge',
        cpu: 16,
        memory: '128GB',
        storage: Math.max(storageGB * 2, 100),
        nodes: 2 // 1主1只读
      };
    } else if (qps > 5000) {
      return {
        nodeClass: 'polar.mysql.x4.2xlarge',
        cpu: 8,
        memory: '32GB',
        storage: Math.max(storageGB * 2, 100),
        nodes: 2
      };
    } else {
      return {
        nodeClass: 'polar.mysql.x4.large',
        cpu: 4,
        memory: '16GB',
        storage: Math.max(storageGB * 2, 50),
        nodes: 1
      };
    }
  }

  /**
   * 选择 RDS 规格
   */
  selectRDSSpec(qps, storageGB) {
    if (qps > 5000) {
      return {
        instanceClass: 'rds.mysql.c1.2xlarge',
        cpu: 8,
        memory: '16GB',
        storage: Math.max(storageGB * 1.5, 100),
        storageType: 'cloud_ssd'
      };
    } else if (qps > 1000) {
      return {
        instanceClass: 'rds.mysql.s3.large',
        cpu: 4,
        memory: '8GB',
        storage: Math.max(storageGB * 1.5, 50),
        storageType: 'cloud_ssd'
      };
    } else {
      return {
        instanceClass: 'rds.mysql.s2.large',
        cpu: 2,
        memory: '4GB',
        storage: Math.max(storageGB * 1.5, 20),
        storageType: 'cloud_ssd'
      };
    }
  }

  /**
   * 选择 Redis 规格
   */
  selectRedisSpec(dau) {
    if (dau > 1000000) {
      return {
        instanceClass: 'redis.master.xlarge',
        memory: '32GB',
        architecture: 'cluster'
      };
    } else if (dau > 100000) {
      return {
        instanceClass: 'redis.master.large',
        memory: '8GB',
        architecture: 'standard'
      };
    } else {
      return {
        instanceClass: 'redis.master.small',
        memory: '1GB',
        architecture: 'standard'
      };
    }
  }

  /**
   * 选择 ADB 规格
   */
  selectADBSpec(storageGB) {
    if (storageGB > 1000) {
      return {
        instanceClass: 'C32',
        cpu: 32,
        storage: Math.max(storageGB, 1000),
        storageType: 'cloud_ssd'
      };
    } else if (storageGB > 100) {
      return {
        instanceClass: 'C8',
        cpu: 8,
        storage: Math.max(storageGB, 100),
        storageType: 'cloud_ssd'
      };
    } else {
      return {
        instanceClass: 'C4',
        cpu: 4,
        storage: 100,
        storageType: 'cloud_ssd'
      };
    }
  }

  /**
   * 确定高可用策略
   */
  determineHAStrategy(scale) {
    const { estimatedDAU } = scale;
    
    if (estimatedDAU > 1000000) {
      return {
        level: 'enterprise',
        rto: '< 30s',
        rpo: '< 1s',
        features: ['跨可用区部署', '自动故障切换', '数据备份', '异地灾备']
      };
    } else if (estimatedDAU > 100000) {
      return {
        level: 'high',
        rto: '< 60s',
        rpo: '< 5s',
        features: ['主备架构', '自动故障切换', '数据备份']
      };
    } else {
      return {
        level: 'standard',
        rto: '< 5min',
        rpo: '< 1min',
        features: ['基础版/高可用版', '自动备份']
      };
    }
  }

  /**
   * 估算月度成本
   */
  estimateCost(productSelection, specifications) {
    // 简化估算，实际价格请参考阿里云官网
    let estimatedCost = 0;
    
    if (specifications.oltp) {
      estimatedCost += specifications.oltp.cpu * 200; // 粗略估算
    }
    if (specifications.cache) {
      const memoryGB = parseInt(specifications.cache.memory);
      estimatedCost += memoryGB * 50;
    }
    if (specifications.olap) {
      estimatedCost += specifications.olap.cpu * 300;
    }
    
    return {
      estimatedMonthlyCost: estimatedCost,
      currency: 'CNY',
      note: '此为粗略估算，实际费用以阿里云账单为准'
    };
  }

  /**
   * 生成决策理由
   */
  generateRationale(productSelection, dataLayers) {
    const reasons = [];
    
    reasons.push(`选择 ${productSelection.products.oltp?.product || 'RDS'} 作为OLTP主库，` +
      `原因：${productSelection.products.oltp?.reason || '标准选择'}`);
    
    if (productSelection.products.cache) {
      reasons.push(`引入 Redis 缓存层，缓存热点数据，提升读取性能`);
    }
    
    if (productSelection.products.olap) {
      reasons.push(`使用 ADB MySQL 处理分析查询，避免影响OLTP性能`);
    }
    
    reasons.push(`数据分层策略：热数据存Redis，温数据存OLTP，冷数据归档OSS`);
    
    return reasons;
  }
}

module.exports = ArchitectureEngine;
