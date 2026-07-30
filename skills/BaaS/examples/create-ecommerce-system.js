/**
 * BaaS Skill 示例：创建电商系统数据层
 *
 * 本示例展示如何使用 BaaS Skill 创建一个完整的电商系统数据层，包括：
 * - PolarDB（OLTP）- 订单、用户、商品主表
 * - Redis（Cache）- 热点数据缓存
 * - ADB MySQL（OLAP）- 报表分析
 */

const BaaSSkill = require('../index');

async function createEcommerceSystem() {
  const baas = new BaaSSkill();

  console.log('=== 开始创建电商系统数据层 ===\n');

  // 步骤 1: 架构决策
  console.log('步骤 1: 架构决策');
  const architecture = await baas.architectureEngine.design({
    businessType: 'ecommerce',
    dau: 100000,           // 日活 10 万
    dailyOrders: 50000,    // 日订单 5 万
    dataRetentionDays: 365 // 数据保留 1 年
  });
  console.log('架构设计:', architecture);

  // 步骤 2: Schema 设计
  console.log('\n步骤 2: Schema 设计');
  const schema = await baas.schemaDesigner.designFromEntities([
    {
      name: 'users',
      fields: [
        { name: 'user_id', type: 'BIGINT', primaryKey: true },
        { name: 'username', type: 'VARCHAR(50)', notNull: true },
        { name: 'phone', type: 'VARCHAR(20)' },
        { name: 'email', type: 'VARCHAR(100)' },
        { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      name: 'products',
      fields: [
        { name: 'product_id', type: 'BIGINT', primaryKey: true },
        { name: 'name', type: 'VARCHAR(200)', notNull: true },
        { name: 'price', type: 'DECIMAL(10,2)', notNull: true },
        { name: 'stock', type: 'INT', default: 0 },
        { name: 'category_id', type: 'BIGINT' },
        { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      name: 'orders',
      fields: [
        { name: 'order_id', type: 'BIGINT', primaryKey: true },
        { name: 'user_id', type: 'BIGINT', notNull: true, index: true },
        { name: 'total_amount', type: 'DECIMAL(10,2)', notNull: true },
        { name: 'status', type: 'TINYINT', default: 0 },
        { name: 'created_at', type: 'DATETIME', default: 'CURRENT_TIMESTAMP' }
      ]
    },
    {
      name: 'order_items',
      fields: [
        { name: 'item_id', type: 'BIGINT', primaryKey: true },
        { name: 'order_id', type: 'BIGINT', notNull: true, index: true },
        { name: 'product_id', type: 'BIGINT', notNull: true },
        { name: 'quantity', type: 'INT', notNull: true },
        { name: 'price', type: 'DECIMAL(10,2)', notNull: true }
      ]
    }
  ]);
  console.log('Schema 设计完成');

  // 步骤 3: 资源编排
  console.log('\n步骤 3: 资源编排');
  const plan = await baas.resourceOrchestrator.plan({
    architecture: architecture,
    schema: schema,
    regionId: 'cn-hangzhou'
  });
  console.log('资源计划:', plan);

  // 步骤 4: 创建资源
  console.log('\n步骤 4: 创建资源（需要用户确认）');
  const confirmed = await getUserConfirmation('确认创建以上资源？');
  if (!confirmed) {
    console.log('用户取消创建');
    return;
  }

  const resources = await baas.resourceOrchestrator.createResources(plan);
  console.log('资源创建完成:', resources);

  // 步骤 5: 返回连接信息
  console.log('\n步骤 5: 连接信息');
  console.log('=== 电商系统数据层创建完成 ===');
  console.log('\n连接信息:');
  console.log(JSON.stringify(resources.connectionInfo, null, 2));

  return resources;
}

// 模拟用户确认
async function getUserConfirmation(message) {
  // 实际实现中应该使用交互式输入
  console.log(message + ' (y/n)');
  return true; // 示例中默认确认
}

// 执行
createEcommerceSystem()
  .then(result => {
    console.log('\n✅ 电商系统数据层创建成功');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 创建失败:', error.message);
    process.exit(1);
  });
