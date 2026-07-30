/**
 * BaaS Skill 示例：直接使用底层 API 创建数据库实例
 *
 * 本示例展示如何使用各子 Skill 的 API 直接创建数据库实例
 * 基于实际测试经验总结的最佳实践
 */

// ==================== PolarDB 示例 ====================
async function createPolarDBExample(polardb) {
  console.log('=== 创建 PolarDB 实例 ===');

  // 1. 查询可用规格
  const resources = await polardb.clusters.describeDBClusterAvailableResources({
    regionId: 'cn-hangzhou',
    zoneId: 'cn-hangzhou-h'
  });
  console.log('可用规格:', resources);

  // 2. 创建实例（不指定 VPC，让系统自动分配）
  const result = await polardb.clusters.createCluster({
    regionId: 'cn-hangzhou',
    zoneId: 'cn-hangzhou-h',
    dbType: 'MySQL',
    dbVersion: '8.0',
    dbNodeClass: 'polar.mysql.x4.medium',  // 根据查询结果选择
    dbNodeNum: '2',
    payType: 'Postpaid',
    dbClusterDescription: 'test-cluster',
    password: 'YourPassword123'  // 必须由用户提供
    // 不指定 vpcId 和 vSwitchId，让系统自动分配
  });

  console.log('创建结果:', result);
  return result.DBClusterId;
}

// ==================== Redis 示例 ====================
async function createRedisExample(redis) {
  console.log('=== 创建 Redis 实例 ===');

  // 1. 查询可用资源
  const resources = await redis.lifecycle.describeAvailableResource({
    regionId: 'cn-hangzhou',
    zoneId: 'cn-hangzhou-i'  // 注意：部分可用区可能已关闭
  });
  console.log('可用资源:', resources);

  // 2. 创建实例（不指定 VPC，让系统自动分配）
  const result = await redis.lifecycle.createInstance({
    regionId: 'cn-hangzhou',
    zoneId: 'cn-hangzhou-i',
    instanceType: 'Redis',
    engineVersion: '5.0',
    instanceClass: 'redis.master.small.default',
    capacity: 256,
    instanceChargeType: 'PostPaid',
    instanceName: 'test-redis',
    password: 'YourPassword123'  // 必须由用户提供
    // 不指定 vpcId 和 vSwitchId，让系统自动分配
  });

  console.log('创建结果:', result);
  return result.InstanceId;
}

// ==================== RDS 示例 ====================
async function createRDSExample(rds) {
  console.log('=== 创建 RDS 实例 ===');

  const result = await rds.instances.createInstance({
    regionId: 'cn-hangzhou',
    engine: 'MySQL',
    engineVersion: '8.0',
    dbInstanceClass: 'mysql.n2.small.2c',
    dbInstanceStorage: 20,
    payType: 'Postpaid',
    dbInstanceDescription: 'test-rds',
    password: 'YourPassword123'  // 必须由用户提供
    // 不指定 VPC，让系统自动分配
  });

  console.log('创建结果:', result);
  return result.DBInstanceId;
}

// ==================== ADB MySQL 示例 ====================
async function createADBExample(adb) {
  console.log('=== 创建 ADB MySQL 实例 ===');

  // 数仓版
  const result = await adb.clusters.createCluster({
    clusterType: 'warehouse',
    regionId: 'cn-hangzhou',
    zoneId: 'cn-hangzhou-h',
    payType: 'Postpaid',
    dbClusterCategory: 'Cluster',
    mode: 'Reserver',
    dbClusterClass: 'C8',
    dbNodeGroupCount: '2',
    dbNodeStorage: '200',
    dbClusterVersion: '3.0',  // 数仓版需要指定版本
    description: 'test-adb'
    // 不指定 VPC，让系统自动分配
  });

  console.log('创建结果:', result);
  return result.DBClusterId;
}

// ==================== Lindorm 示例 ====================
async function createLindormExample(lindorm) {
  console.log('=== 创建 Lindorm 实例 ===');

  const result = await lindorm.instances.createInstance({
    zoneId: 'cn-hangzhou-i',
    lindormType: 'lindorm',
    coreSpec: 'lindorm.c.2xlarge',
    coreNumber: 2,
    storageNumber: 2,
    payType: 'Postpaid',
    instanceName: 'test-lindorm'
    // 不指定 VPC，让系统自动分配
  });

  console.log('创建结果:', result);
  return result.InstanceId;
}

// ==================== MongoDB 示例 ====================
async function createMongoDBExample(mongodb) {
  console.log('=== 创建 MongoDB 实例 ===');

  const result = await mongodb.create.createDBInstance({
    regionId: 'cn-hangzhou',
    zoneId: 'cn-hangzhou-h',
    engine: 'MongoDB',
    engineVersion: '4.4',
    dbInstanceClass: 'dds.mongo.mid',
    dbInstanceStorage: 20,
    instanceChargeType: 'Postpaid',
    dbInstanceName: 'test-mongodb',
    password: 'YourPassword123',  // 必须由用户提供
    nodeAmount: 3  // 副本集固定 3 节点
    // 不指定 VPC，让系统自动分配
  });

  console.log('创建结果:', result);
  return result.DBInstanceId;
}

// ==================== 等待实例就绪 ====================
async function waitForInstanceReady(skill, instanceId, checkStatus) {
  console.log(`等待实例 ${instanceId} 就绪...`);

  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await checkStatus(instanceId);
      if (status === 'Running' || status === 'Normal') {
        console.log(`实例 ${instanceId} 已就绪`);
        return true;
      }
      console.log(`当前状态: ${status}，等待 30 秒...`);
    } catch (error) {
      console.log(`查询状态失败: ${error.message}，继续等待...`);
    }
    await sleep(30000);
  }

  throw new Error(`实例 ${instanceId} 启动超时`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== 主函数 ====================
async function main() {
  // 初始化各 Skill（从环境变量读取 AKSK）
  const PolarDBDatabaseOperation = require('../polardb-database-operation');
  const RedisDatabaseOperation = require('../redis-database-operation');
  const RDSDatabaseOperation = require('../rds-database-operation');
  const ADBMySQLDatabaseOperation = require('../adb-mysql-database-operation');
  const LindormDatabaseOperation = require('../lindorm-database-operation');
  const MongoDBDatabaseOperation = require('../mongodb-database-operation');

  const polardb = new PolarDBDatabaseOperation();
  const redis = new RedisDatabaseOperation();
  const rds = new RDSDatabaseOperation();
  const adb = new ADBMySQLDatabaseOperation();
  const lindorm = new LindormDatabaseOperation();
  const mongodb = new MongoDBDatabaseOperation();

  try {
    // 创建 PolarDB 实例
    const polarDBId = await createPolarDBExample(polardb);
    await waitForInstanceReady(polardb, polarDBId, async (id) => {
      const info = await polardb.clusters.describeClusterAttribute(id);
      return info.DBClusterStatus;
    });

    // 创建 Redis 实例
    const redisId = await createRedisExample(redis);
    await waitForInstanceReady(redis, redisId, async (id) => {
      const info = await redis.lifecycle.describeInstanceAttribute(id);
      return info.InstanceStatus;
    });

    // 创建 RDS 实例
    const rdsId = await createRDSExample(rds);
    await waitForInstanceReady(rds, rdsId, async (id) => {
      const info = await rds.instances.describeInstanceAttribute(id);
      return info.DBInstanceStatus;
    });

    // 创建 ADB 实例
    const adbId = await createADBExample(adb);
    await waitForInstanceReady(adb, adbId, async (id) => {
      const info = await adb.clusters.describeClusterStatus(id);
      return info.DBClusterStatus;
    });

    // 创建 Lindorm 实例
    const lindormId = await createLindormExample(lindorm);
    await waitForInstanceReady(lindorm, lindormId, async (id) => {
      const info = await lindorm.instances.describeInstance(id);
      return info.Status;
    });

    // 创建 MongoDB 实例
    const mongodbId = await createMongoDBExample(mongodb);
    await waitForInstanceReady(mongodb, mongodbId, async (id) => {
      const info = await mongodb.describe.describeDBInstanceAttribute(id);
      return info.DBInstanceStatus;
    });

    console.log('\n✅ 所有实例创建成功');

  } catch (error) {
    console.error('\n❌ 创建失败:', error.message);
    throw error;
  }
}

// 执行
main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
