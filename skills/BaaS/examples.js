/**
 * BaaS Skill 使用示例
 */

const BaaSSkill = require('./index');

// 示例 1：新建电商系统
async function exampleCreateEcommerceSystem() {
  console.log('=== 示例 1：新建电商系统 ===\n');
  
  const baas = new BaaSSkill({
    regionId: 'cn-hangzhou'
  });
  
  const requirements = {
    projectName: '电商平台',
    description: 'B2C电商平台，包含用户注册、商品浏览、下单支付、物流跟踪功能',
    entities: [
      { name: 'user' },
      { name: 'product' },
      { name: 'order' },
      { name: 'category' },
      { name: 'payment' },
      { name: 'logistics' }
    ],
    scale: {
      estimatedDAU: 100000,
      estimatedQPS: 2000,
      estimatedStorageGB: 500
    }
  };
  
  try {
    const result = await baas.createNewSystem(requirements);
    console.log('创建结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('创建失败:', error.message);
  }
}

// 示例 2：新建内容管理系统
async function exampleCreateCMS() {
  console.log('\n=== 示例 2：新建内容管理系统 ===\n');
  
  const baas = new BaaSSkill({
    regionId: 'cn-hangzhou'
  });
  
  const requirements = {
    projectName: '内容管理系统',
    description: '企业官网CMS，文章发布、分类管理、用户评论',
    entities: [
      { name: 'article' },
      { name: 'category' },
      { name: 'user' },
      { name: 'comment' }
    ],
    scale: {
      estimatedDAU: 10000,
      estimatedQPS: 100,
      estimatedStorageGB: 50
    }
  };
  
  try {
    const result = await baas.createNewSystem(requirements);
    console.log('创建结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('创建失败:', error.message);
  }
}

// 示例 3：接管现有系统并优化
async function exampleTakeoverAndOptimize() {
  console.log('\n=== 示例 3：接管现有系统并优化 ===\n');
  
  const baas = new BaaSSkill({
    regionId: 'cn-hangzhou'
  });
  
  const connectionInfo = {
    type: 'rds',
    host: 'rm-xxxx.mysql.rds.aliyuncs.com',
    port: 3306,
    database: 'ecommerce',
    account: process.env.BAAS_RDS_ACCOUNT || 'admin',
    password: process.env.BAAS_RDS_PASSWORD || 'password'
  };
  
  try {
    // 诊断现有系统
    const diagnosis = await baas.takeoverExistingSystem(connectionInfo);
    console.log('诊断结果:', JSON.stringify(diagnosis, null, 2));
    
    // 如果有优化建议，可以执行
    if (diagnosis.recommendations && diagnosis.recommendations.length > 0) {
      console.log('\n发现优化建议:');
      for (const rec of diagnosis.recommendations) {
        console.log(`- [${rec.priority}] ${rec.description}`);
      }
    }
  } catch (error) {
    console.error('接管失败:', error.message);
  }
}

// 示例 4：使用架构决策引擎
async function exampleArchitectureEngine() {
  console.log('\n=== 示例 4：架构决策引擎 ===\n');
  
  const baas = new BaaSSkill({
    regionId: 'cn-hangzhou'
  });
  
  const requirements = {
    entities: [
      { name: 'user' },
      { name: 'order' },
      { name: 'product' }
    ],
    scale: {
      estimatedDAU: 500000,
      estimatedQPS: 5000,
      estimatedStorageGB: 1000
    },
    dataPatterns: {
      hotData: [{ name: 'user' }],
      warmData: [{ name: 'order' }, { name: 'product' }],
      coldData: []
    },
    accessPatterns: {
      readHeavy: true,
      writeHeavy: false,
      needCache: true
    }
  };
  
  const architecture = await baas.architectureEngine.design(requirements);
  console.log('架构决策结果:');
  console.log('- 推荐架构:', architecture.summary.recommendation);
  console.log('- 产品组合:', architecture.productSelection.architecture);
  console.log('- 数据分层:', Object.keys(architecture.dataLayers.layers).join(', '));
  console.log('- 决策理由:');
  for (const reason of architecture.rationale) {
    console.log('  *', reason);
  }
}

// 示例 5：Schema 设计
async function exampleSchemaDesign() {
  console.log('\n=== 示例 5：Schema 设计 ===\n');
  
  const baas = new BaaSSkill({
    regionId: 'cn-hangzhou'
  });
  
  const requirements = {
    entities: [
      { name: 'user' },
      { name: 'product' },
      { name: 'order' }
    ]
  };
  
  const architecture = {
    productSelection: {
      products: {
        oltp: { type: 'polardb' }
      }
    }
  };
  
  const schema = await baas.schemaDesigner.design(requirements, architecture);
  
  console.log('Schema 设计结果:');
  console.log('- 表数量:', schema.summary.tableCount);
  console.log('- 实体表:', schema.summary.entityCount);
  console.log('- 关系表:', schema.summary.relationCount);
  console.log('\n表列表:');
  for (const table of schema.tables) {
    console.log(`- ${table.name} (${table.columns.length} 个字段)`);
  }
  console.log('\nDDL 预览:');
  console.log(schema.ddl.substring(0, 500) + '...');
}

// 示例 6：ER图解析
async function exampleERDiagramParsing() {
  console.log('\n=== 示例 6：ER图解析 ===\n');
  
  const baas = new BaaSSkill({
    regionId: 'cn-hangzhou'
  });
  
  // Mermaid 格式的 ER 图
  const erDiagram = `
    USER {
      bigint user_id PK
      varchar username
      varchar email
      datetime created_at
    }
    
    ORDER {
      bigint order_id PK
      bigint user_id FK
      decimal total_amount
      tinyint status
      datetime created_at
    }
    
    PRODUCT {
      bigint product_id PK
      varchar product_name
      decimal price
      int stock
    }
  `;
  
  const entities = baas.schemaDesigner.parseERDiagram(erDiagram);
  console.log('从 ER 图解析出的实体:');
  for (const entity of entities) {
    console.log(`- ${entity.name}: ${entity.fields.length} 个字段`);
  }
}

// 运行示例
async function runExamples() {
  console.log('BaaS Skill 使用示例\n');
  console.log('====================\n');
  
  // 检查环境变量
  if (!process.env.ALIBABA_CLOUD_ACCESS_KEY_ID) {
    console.log('提示: 未设置 ALIBABA_CLOUD_ACCESS_KEY_ID，部分示例可能无法运行');
    console.log('请配置 .env 文件后再运行\n');
  }
  
  try {
    await exampleCreateEcommerceSystem();
    await exampleCreateCMS();
    await exampleTakeoverAndOptimize();
    await exampleArchitectureEngine();
    await exampleSchemaDesign();
    await exampleERDiagramParsing();
  } catch (error) {
    console.error('运行示例时出错:', error);
  }
  
  console.log('\n====================');
  console.log('示例运行完成');
}

// 如果直接运行此文件
if (require.main === module) {
  runExamples();
}

module.exports = {
  exampleCreateEcommerceSystem,
  exampleCreateCMS,
  exampleTakeoverAndOptimize,
  exampleArchitectureEngine,
  exampleSchemaDesign,
  exampleERDiagramParsing,
  runExamples
};
