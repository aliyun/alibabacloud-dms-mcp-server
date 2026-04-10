/**
 * BaaS Skill 示例：接管现有数据库系统
 *
 * 本示例展示如何使用 BaaS Skill 接管现有数据库系统并进行优化分析
 */

const BaaSSkill = require('../index');

async function takeoverExistingSystem() {
  const baas = new BaaSSkill();

  console.log('=== 开始接管现有数据库系统 ===\n');

  // 步骤 1: 连接现有实例
  console.log('步骤 1: 连接现有实例');
  const existingInstances = [
    { type: 'rds', instanceId: 'rm-bp1xxxx', regionId: 'cn-hangzhou' },
    { type: 'redis', instanceId: 'r-bp1xxxx', regionId: 'cn-hangzhou' }
  ];

  // 步骤 2: 自动诊断
  console.log('\n步骤 2: 自动诊断');
  for (const instance of existingInstances) {
    console.log(`\n诊断 ${instance.type} 实例: ${instance.instanceId}`);

    const diagnosis = await baas.operationsCenter.diagnose(instance);
    console.log('诊断结果:', diagnosis);
  }

  // 步骤 3: 生成优化建议
  console.log('\n步骤 3: 生成优化建议');
  const recommendations = await baas.operationsCenter.generateRecommendations({
    instances: existingInstances,
    focusAreas: ['performance', 'cost', 'security']
  });

  console.log('\n优化建议:');
  recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. ${rec.type}: ${rec.title}`);
    console.log(`   描述: ${rec.description}`);
    console.log(`   预期收益: ${rec.benefit}`);
    console.log(`   风险: ${rec.risk}`);
  });

  // 步骤 4: 用户确认后执行优化
  console.log('\n步骤 4: 执行优化（需要用户确认）');
  for (const rec of recommendations) {
    const confirmed = await getUserConfirmation(`是否执行优化: ${rec.title}？`);
    if (confirmed) {
      console.log(`执行优化: ${rec.title}`);
      const result = await baas.operationsCenter.executeOptimization(rec);
      console.log('优化结果:', result);
    } else {
      console.log(`跳过优化: ${rec.title}`);
    }
  }

  console.log('\n=== 接管和优化完成 ===');
}

// 模拟用户确认
async function getUserConfirmation(message) {
  console.log(message + ' (y/n)');
  return true; // 示例中默认确认
}

// 执行
takeoverExistingSystem()
  .then(() => {
    console.log('\n✅ 接管和优化完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 接管失败:', error.message);
    process.exit(1);
  });
