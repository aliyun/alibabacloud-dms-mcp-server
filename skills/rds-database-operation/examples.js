/**
 * RDS 数据库操作 Skill - 使用示例
 * 
 * 使用前请确保：
 * 1. 已创建阿里云 AccessKey
 * 2. AccessKey 具备 RDS 相关 API 调用权限
 * 3. 在 OpenClaw 环境变量中配置：
 *    - ALIBABA_CLOUD_ACCESS_KEY_ID
 *    - ALIBABA_CLOUD_ACCESS_KEY_SECRET
 *    - ALIBABA_CLOUD_REGION_ID (可选，默认 cn-hangzhou)
 * 
 * 注意：环境变量在 OpenClaw 系统中配置，不是操作系统环境变量
 */

const RDSDatabaseOperation = require('./index');

// 初始化客户端（自动从 OpenClaw 环境变量读取 AKSK）
const rds = new RDSDatabaseOperation({
  // 如果已在 OpenClaw 环境变量中配置，可以省略这些参数
  // 或者在这里直接传入配置（优先级高于环境变量）
  // accessKeyId: 'YOUR_ACCESS_KEY_ID',
  // accessKeySecret: 'YOUR_ACCESS_KEY_SECRET',
  // regionId: 'cn-hangzhou'
});

/**
 * 示例 1: 查询实例列表
 */
async function exampleDescribeInstances() {
  try {
    const result = await rds.instances.describeInstances({
      regionId: process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou',
      engine: 'MySQL',
      pageNumber: 1,
      pageSize: 10
    });

    if (result.success) {
      console.log('实例列表:', JSON.stringify(result.data, null, 2));
    } else {
      console.error('查询失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 2: 创建 RDS 实例
 */
async function exampleCreateInstance() {
  try {
    const result = await rds.instances.createInstance({
      regionId: process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou',
      engine: 'MySQL',
      engineVersion: '8.0',
      dbInstanceClass: 'mysql.n2.medium.2c',
      dbInstanceStorage: 100,
      payType: 'Postpaid',
      dbInstanceStorageType: 'general_essd',
      category: 'HighAvailability',
      securityIpList: '127.0.0.1',
      description: '测试实例'
    });

    if (result.success) {
      console.log('实例创建成功:', result.data);
      console.log('实例 ID:', result.data.DBInstanceId);
      console.log('连接地址:', result.data.ConnectionString);
    } else {
      console.error('创建失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 3: 查询实例详情
 */
async function exampleDescribeInstance(dbInstanceId) {
  try {
    const result = await rds.instances.describeInstanceAttribute(dbInstanceId);

    if (result.success) {
      console.log('实例详情:', JSON.stringify(result.data, null, 2));
    } else {
      console.error('查询失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 4: 创建数据库账号
 * 
 * ⚠️ 重要：实际使用时必须询问用户：
 * 1. 账号类型：Normal（普通账号）或 Super（高权限账号）
 * 2. 密码：必须由用户提供，符合复杂度要求
 */
async function exampleCreateAccount(dbInstanceId) {
  try {
    // ⚠️ 实际使用时应该这样：
    // console.log('请选择账号类型：1-Normal（普通） 2-Super（高权限）');
    // const accountTypeChoice = getUserInput();
    // const accountType = accountTypeChoice === '1' ? 'Normal' : 'Super';
    //
    // console.log('请输入密码（8-32 位，包含大小写字母、数字、特殊字符中的至少三种）：');
    // const accountPassword = getUserPassword();
    
    // 示例使用固定值
    const result = await rds.accounts.createAccount({
      dbInstanceId: dbInstanceId,
      accountName: 'testuser',
      accountPassword: 'Test123456',
      description: '测试账号',
      accountType: 'Normal' // ⚠️ 必须询问用户
    });

    if (result.success) {
      console.log('账号创建成功:', result.data);
    } else {
      console.error('创建失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 5: 创建数据库
 * 
 * ⚠️ 重要：实际使用时必须询问用户：
 * 1. 字符集：utf8mb4（推荐，支持 emoji）或 utf8（不支持 emoji）或其他
 * 2. 所有者账号：必须是已存在的账号
 * 3. 权限：ReadWrite/ReadOnly/DDLOnly/DMLOnly
 */
async function exampleCreateDatabase(dbInstanceId) {
  try {
    // ⚠️ 实际使用时应该这样：
    // console.log('请选择字符集：1-utf8mb4（推荐） 2-utf8 3-gbk');
    // const charsetChoice = getUserInput();
    // const characterSetName = ['utf8mb4', 'utf8', 'gbk'][charsetChoice - 1];
    //
    // console.log('请选择权限：1-ReadWrite 2-ReadOnly 3-DDLOnly 4-DMLOnly');
    // const privChoice = getUserInput();
    // const accountPrivilege = ['ReadWrite', 'ReadOnly', 'DDLOnly', 'DMLOnly'][privChoice - 1];
    
    // 示例使用固定值
    const result = await rds.databases.createDatabase({
      dbInstanceId: dbInstanceId,
      dbName: 'testdb',
      characterSetName: 'utf8', // ⚠️ 必须询问用户
      accountName: 'testuser',
      accountPrivilege: 'ReadWrite', // ⚠️ 建议确认
      description: '测试数据库'
    });

    if (result.success) {
      console.log('数据库创建成功:', result.data);
    } else {
      console.error('创建失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 6: 修改 IP 白名单
 */
async function exampleModifySecurityIps(dbInstanceId) {
  try {
    const result = await rds.security.modifySecurityIps({
      dbInstanceId: dbInstanceId,
      securityIps: '192.168.1.1,10.0.0.0/24',
      securityIpGroupName: 'default',
      modifyMode: 'Append'
    });

    if (result.success) {
      console.log('白名单修改成功:', result.data);
    } else {
      console.error('修改失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 7: 查询 IP 白名单
 */
async function exampleDescribeSecurityIps(dbInstanceId) {
  try {
    const result = await rds.security.describeIPArrayList(dbInstanceId);

    if (result.success) {
      console.log('白名单列表:', JSON.stringify(result.data, null, 2));
    } else {
      console.error('查询失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 8: 创建备份
 */
async function exampleCreateBackup(dbInstanceId) {
  try {
    const result = await rds.backup.createBackup({
      dbInstanceId: dbInstanceId,
      backupStrategy: 'Manual',
      backupMethod: 'Snapshot',
      backupName: '手动备份_' + new Date().toISOString()
    });

    if (result.success) {
      console.log('备份创建成功:', result.data);
    } else {
      console.error('创建失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 9: 查询备份列表
 */
async function exampleDescribeBackups(dbInstanceId) {
  try {
    const result = await rds.backup.describeBackups({
      dbInstanceId: dbInstanceId,
      pageNumber: 1,
      pageSize: 10
    });

    if (result.success) {
      console.log('备份列表:', JSON.stringify(result.data, null, 2));
    } else {
      console.error('查询失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 10: 申请外网连接地址
 */
async function exampleAllocatePublicConnection(dbInstanceId) {
  try {
    const result = await rds.network.allocatePublicConnection(
      dbInstanceId,
      'my-rds',
      '3306'
    );

    if (result.success) {
      console.log('外网地址申请成功:', result.data);
    } else {
      console.error('申请失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 11: 重启实例
 */
async function exampleRestartInstance(dbInstanceId) {
  try {
    const result = await rds.instances.restartInstance(dbInstanceId);

    if (result.success) {
      console.log('重启请求已发送:', result.data);
    } else {
      console.error('重启失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 12: 删除数据库
 */
async function exampleDeleteDatabase(dbInstanceId, dbName) {
  try {
    const result = await rds.databases.deleteDatabase(dbInstanceId, dbName);

    if (result.success) {
      console.log('数据库删除成功:', result.data);
    } else {
      console.error('删除失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 13: 删除账号
 */
async function exampleDeleteAccount(dbInstanceId, accountName) {
  try {
    const result = await rds.accounts.deleteAccount(dbInstanceId, accountName);

    if (result.success) {
      console.log('账号删除成功:', result.data);
    } else {
      console.error('删除失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 14: 删除实例
 */
async function exampleDeleteInstance(dbInstanceId) {
  try {
    const result = await rds.instances.deleteInstance(dbInstanceId);

    if (result.success) {
      console.log('实例删除成功:', result.data);
    } else {
      console.error('删除失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

/**
 * 示例 15: 查询地域列表
 */
async function exampleDescribeRegions() {
  try {
    const result = await rds.instances.describeRegions();

    if (result.success) {
      console.log('地域列表:', JSON.stringify(result.data, null, 2));
    } else {
      console.error('查询失败:', result.error);
    }
  } catch (error) {
    console.error('异常:', error.message);
  }
}

// 导出所有示例函数
module.exports = {
  exampleDescribeInstances,
  exampleCreateInstance,
  exampleDescribeInstance,
  exampleCreateAccount,
  exampleCreateDatabase,
  exampleModifySecurityIps,
  exampleDescribeSecurityIps,
  exampleCreateBackup,
  exampleDescribeBackups,
  exampleAllocatePublicConnection,
  exampleRestartInstance,
  exampleDeleteDatabase,
  exampleDeleteAccount,
  exampleDeleteInstance,
  exampleDescribeRegions
};

// 如果直接运行此文件，执行示例
if (require.main === module) {
  console.log('RDS 数据库操作 Skill - 使用示例');
  console.log('请确保已设置环境变量:');
  console.log('  export ALIBABA_CLOUD_ACCESS_KEY_ID="your_key"');
  console.log('  export ALIBABA_CLOUD_ACCESS_KEY_SECRET="your_secret"');
  console.log('  export ALIBABA_CLOUD_REGION_ID="cn-hangzhou"');
  console.log('');
  console.log('运行示例：node examples.js <example-name> [args...]');
  console.log('');
  console.log('可用示例:');
  console.log('  describe-instances');
  console.log('  describe-regions');
}
