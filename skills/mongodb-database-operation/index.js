/**
 * MongoDB 数据库操作 Skill - 主入口
 * 阿里云 MongoDB (DDS) API 2015-12-01
 * 使用 V1 签名机制 (HMAC-SHA1)
 * 
 * 功能模块:
 * 1. 创建或克隆实例 (Create)
 * 2. 变更实例配置 (Modify)
 * 3. 实例管理 (Instance)
 * 4. 查询实例 (Describe)
 * 5. 连接管理 (Connection)
 * 6. 资源管理 (Resource)
 * 7. 账号管理 (Account)
 * 8. 白名单和安全组 (Security)
 * 9. 参数管理 (Parameter)
 * 10. 备份与恢复 (Backup)
 */

const crypto = require('crypto');
const https = require('https');
const CredentialManager = require('./credential-manager');

// API 配置
const API_ENDPOINT = 'mongodb.aliyuncs.com';
const API_VERSION = '2015-12-01';

/**
 * V1 签名专用 URL 编码
 * MongoDB API 需要额外编码特殊字符如 !'()
 */
function percentEncode(str) {
  if (!str) return '';
  let encoded = encodeURIComponent(str);
  encoded = encoded.replace(/\+/g, '%20');
  encoded = encoded.replace(/\*/g, '%2A');
  encoded = encoded.replace(/%7E/g, '~');
  // MongoDB API 额外要求编码这些字符
  encoded = encoded.replace(/\!/g, '%21');
  encoded = encoded.replace(/\'/g, '%27');
  encoded = encoded.replace(/\(/g, '%28');
  encoded = encoded.replace(/\)/g, '%29');
  return encoded;
}

/**
 * 获取 ISO8601 格式的时间戳
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * 生成唯一随机数
 */
function getSignatureNonce() {
  return crypto.randomUUID();
}

/**
 * 构造规范化查询字符串
 */
function buildCanonicalizedQueryString(params) {
  const sortedKeys = Object.keys(params).sort();
  return sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(String(params[key]))}`)
    .join('&');
}

/**
 * 计算 V1 签名
 */
function calculateSignature(params, accessKeySecret, method = 'POST') {
  const canonicalizedQueryString = buildCanonicalizedQueryString(params);
  const stringToSign = `${method}&${percentEncode('/')}&${percentEncode(canonicalizedQueryString)}`;
  const key = `${accessKeySecret}&`;
  const hmacSha1 = crypto.createHmac('sha1', key).update(stringToSign, 'utf8').digest('base64');
  return hmacSha1;
}

/**
 * MongoDB API 客户端类
 */
class MongoDBClient {
  constructor(config = {}) {
    this.credentialManager = new CredentialManager();
    this.config = config;
    this.credential = null;
    
    // 支持多种环境变量命名（兼容 QoderWork、OpenClaw、其他 AI 工具）
    const envVarNames = {
      accessKeyId: ['ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_ACCESS_KEY_ID', 'ACCESS_KEY_ID'],
      accessKeySecret: ['ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'ALIBABA_ACCESS_KEY_SECRET', 'ACCESS_KEY_SECRET'],
      regionId: ['ALIBABA_CLOUD_REGION_ID', 'ALIBABA_REGION_ID', 'REGION_ID']
    };
    
    this.accessKeyId = config.accessKeyId || this._getEnvVar(envVarNames.accessKeyId);
    this.accessKeySecret = config.accessKeySecret || this._getEnvVar(envVarNames.accessKeySecret);
    this.regionId = config.regionId || this._getEnvVar(envVarNames.regionId) || 'cn-hangzhou';
    
    // 如果直接传入了 AKSK，立即初始化凭证
    if (this.accessKeyId && this.accessKeySecret) {
      this.credential = {
        name: '直接配置',
        accessKeyId: this.accessKeyId,
        accessKeySecret: this.accessKeySecret,
        regionId: this.regionId,
        source: 'config',
        profile: config.profileName || 'default'
      };
    }
  }

  /**
   * 辅助方法：从多个环境变量名中获取第一个存在的值
   */
  _getEnvVar(names) {
    for (const name of names) {
      if (process.env[name]) return process.env[name];
    }
    return undefined;
  }

  /**
   * 初始化凭证（延迟加载）
   */
  async initCredential() {
    if (this.credential) {
      return this.credential;
    }

    const sources = await this.credentialManager.discoverCredentials(this.config);
    
    if (sources.length === 0) {
      throw new Error(
        'AccessKey 配置缺失。请通过以下方式之一配置：\n' +
        '1. 传入 config 对象：{ accessKeyId, accessKeySecret }\n' +
        '2. 设置环境变量（支持多种命名）：\n' +
        '   - ALIBABA_CLOUD_ACCESS_KEY_ID / ALIBABA_CLOUD_ACCESS_KEY_SECRET (QoderWork / 阿里云官方)\n' +
        '   - ALIBABA_ACCESS_KEY_ID / ALIBABA_ACCESS_KEY_SECRET (简写)\n' +
        '   - ACCESS_KEY_ID / ACCESS_KEY_SECRET (通用)\n' +
        '3. 配置 aliyun-cli: aliyun configure\n' +
        '4. 创建凭证文件：~/.alibabacloud/credentials'
      );
    }
    
    const result = await this.credentialManager.selectCredential(sources, {
      autoSelect: this.config.autoSelect !== false,
      requireConfirmation: this.config.requireConfirmation || false
    });

    if (result.requiresUserSelection) {
      const list = this.credentialManager.formatCredentialList(result.allSources);
      throw new Error(
        `发现多套阿里云凭证，请指定使用哪一套：\n\n${list}\n\n` +
        `调用时传入 profileName 或 accessKeyId 来指定`
      );
    }

    this.credential = result.selected;
    this.accessKeyId = result.selected.accessKeyId;
    this.accessKeySecret = result.selected.accessKeySecret;
    this.regionId = result.selected.regionId || this.regionId;
    
    return this.credential;
  }

  /**
   * 获取凭证信息（用于展示）
   */
  getCredentialInfo() {
    if (!this.credential) {
      return null;
    }
    const maskId = this.credential.accessKeyId.replace(/^(.{6}).*(.{4})$/, '$1****$2');
    return {
      name: this.credential.name,
      accessKeyId: maskId,
      regionId: this.regionId,
      source: this.credential.source
    };
  }

  /**
   * 调用 API
   */
  async callAPI(action, params = {}, unwrap = true) {
    // 确保凭证已初始化
    if (!this.credential) {
      await this.initCredential();
    }
    const commonParams = {
      Format: 'JSON',
      Version: API_VERSION,
      AccessKeyId: this.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      Timestamp: getTimestamp(),
      SignatureVersion: '1.0',
      SignatureNonce: getSignatureNonce(),
      RegionId: this.regionId
    };
    
    const allParams = { ...commonParams, Action: action, ...params };
    
    // 移除空值
    Object.keys(allParams).forEach(key => {
      if (allParams[key] === undefined || allParams[key] === null || allParams[key] === '') {
        delete allParams[key];
      }
    });
    
    // 计算签名
    const signature = calculateSignature(allParams, this.accessKeySecret, 'POST');
    allParams.Signature = signature;
    
    // 构建请求 body
    const body = Object.entries(allParams)
      .map(([key, value]) => `${percentEncode(key)}=${percentEncode(String(value))}`)
      .join('&');
    
    const options = {
      hostname: API_ENDPOINT,
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.Code) {
              resolve({
                success: false,
                error: {
                  code: result.Code,
                  message: result.Message || result.ErrorMsg || 'Unknown error'
                }
              });
            } else {
              // 统一返回格式：总是包装为 {success: true, data: result}
              resolve({ success: true, data: result });
            }
          } catch (e) {
            resolve({
              success: false,
              error: {
                code: 'ParseError',
                message: `JSON parse error: ${e.message}`
              }
            });
          }
        });
      });
      
      req.on('error', (e) => {
        resolve({
          success: false,
          error: {
            code: 'RequestError',
            message: e.message
          }
        });
      });
      
      req.setTimeout(60000);
      req.write(body);
      req.end();
    });
  }
}

/**
 * 1. 创建或克隆实例模块
 */
class CreateModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 创建实例
   * @param {Object} params - 参数
   * @param {String} params.architecture - 架构类型：'ReplicaSet' (副本集) 或 'Sharding' (分片集群)
   */
  async createDBInstance(params) {
    // 参数互斥校验
    const isReplicaSet = params.architecture === 'ReplicaSet' || !params.architecture;
    const isSharding = params.architecture === 'Sharding';
    
    if (isSharding) {
      // 分片集群模式：检查必要参数
      if (!params.mongosClass || !params.shardClass) {
        throw new Error('分片集群必须指定 MongosClass 和 ShardClass 参数');
      }
      // 移除副本集特有参数
      params.nodeAmount = undefined;
      params.replicationFactor = undefined;
    } else {
      // 副本集模式：检查必要参数
      if (!params.dbInstanceClass) {
        throw new Error('副本集必须指定 dbInstanceClass 参数');
      }
      // 移除分片集群特有参数
      params.mongosClass = undefined;
      params.mongosQuantity = undefined;
      params.shardClass = undefined;
      params.shardQuantity = undefined;
    }
    
    const result = await this.client.callAPI('CreateDBInstance', {
      RegionId: params.regionId || this.client.regionId,
      DBInstanceId: params.dbInstanceId, // 克隆时填写源实例 ID
      Engine: params.engine || 'MongoDB',
      EngineVersion: params.engineVersion || '5.0',
      DBInstanceClass: params.dbInstanceClass,
      DBInstanceStorage: params.dbInstanceStorage,
      DBInstanceName: params.dbInstanceName || '',
      Password: params.password,
      VPCId: params.vpcId,
      VSwitchId: params.vswitchId,
      PrivateIpAddress: params.privateIpAddress,
      ZoneId: params.zoneId,
      NodeAmount: isReplicaSet ? (params.nodeAmount || 3) : undefined,
      MongosClass: params.mongosClass,
      MongosQuantity: params.mongosQuantity,
      ShardClass: params.shardClass,
      ShardQuantity: params.shardQuantity,
      CouponCode: params.couponCode,
      AutoRenew: params.autoRenew || 'false',
      AutoRenewPeriod: params.autoRenewPeriod || 1,
      Period: params.period || 1,
      PricingCycle: params.pricingCycle || 'Month',
      NetworkType: params.networkType || 'VPC',
      ReplicationFactor: isReplicaSet ? (params.replicationFactor || '3') : undefined,
      StorageEngine: params.storageEngine || 'WiredTiger',
      InstanceChargeType: params.instanceChargeType || 'PostPaid'
    });
    
    // ⚠️  重要提醒：实例创建是异步的
    if (result.DBInstanceId) {
      console.warn('\n⚠️  重要提醒:');
      console.warn('   - MongoDB 实例创建是异步操作，实例状态为 Creating');
      console.warn('   - 需要等待 5-10 分钟实例状态变为 Running');
      console.warn('   - 请使用 describeDBInstanceAttribute() 查询实例状态');
      console.warn('   - 不要立即重试创建，避免创建多个实例\n');
    }
    
    return result;
  }

  /**
   * 克隆实例
   */
  async cloneDBInstance(params) {
    return await this.client.callAPI('CloneDBInstance', {
      RegionId: params.regionId || this.client.regionId,
      DBInstanceId: params.dbInstanceId, // 源实例 ID
      BackupId: params.backupId, // 备份 ID
      DBInstanceClass: params.dbInstanceClass,
      DBInstanceStorage: params.dbInstanceStorage,
      ChargeType: params.chargeType || 'Postpaid',
      DBInstanceName: params.dbInstanceName || '',
      VPCId: params.vpcId,
      VSwitchId: params.vswitchId
    });
  }
}

/**
 * 2. 变更实例配置模块
 */
class ModifyModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 变更实例配置
   */
  async modifyDBInstanceSpec(params) {
    return await this.client.callAPI('ModifyDBInstanceSpec', {
      DBInstanceId: params.dbInstanceId,
      DBInstanceClass: params.dbInstanceClass,
      DBInstanceStorage: params.dbInstanceStorage
    });
  }

  /**
   * 修改实例名称
   */
  async modifyDBInstanceName(dbInstanceId, dbInstanceName) {
    return await this.client.callAPI('ModifyDBInstanceName', {
      DBInstanceId: dbInstanceId,
      DBInstanceName: dbInstanceName
    });
  }

  /**
   * 修改密码
   */
  async modifyDBInstancePassword(dbInstanceId, password) {
    return await this.client.callAPI('ModifyDBInstancePassword', {
      DBInstanceId: dbInstanceId,
      Password: password
    });
  }

  /**
   * 修改实例描述
   */
  async modifyDBInstanceDescription(dbInstanceId, description) {
    return await this.client.callAPI('ModifyDBInstanceDescription', {
      DBInstanceId: dbInstanceId,
      DBInstanceDescription: description
    });
  }

  /**
   * 修改实例维护时间
   */
  async modifyDBInstanceMaintainTime(dbInstanceId, maintainStartTime, maintainEndTime) {
    return await this.client.callAPI('ModifyDBInstanceMaintainTime', {
      DBInstanceId: dbInstanceId,
      MaintainStartTime: maintainStartTime,
      MaintainEndTime: maintainEndTime
    });
  }
}

/**
 * 3. 实例管理模块
 */
class InstanceModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 删除实例
   */
  async deleteDBInstance(dbInstanceId) {
    return await this.client.callAPI('DeleteDBInstance', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 重启实例
   */
  async restartDBInstance(dbInstanceId) {
    return await this.client.callAPI('RestartDBInstance', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 锁定实例
   */
  async lockDBInstance(dbInstanceId) {
    return await this.client.callAPI('LockDBInstance', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 解锁实例
   */
  async unlockDBInstance(dbInstanceId) {
    return await this.client.callAPI('UnlockDBInstance', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 设置实例释放保护
   */
  async modifyDBInstanceDeletionProtection(dbInstanceId, deletionProtection) {
    return await this.client.callAPI('ModifyDBInstanceDeletionProtection', {
      DBInstanceId: dbInstanceId,
      DeletionProtection: deletionProtection
    });
  }
}

/**
 * 4. 查询实例模块
 */
class DescribeModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 查询实例列表
   * @param {Object} params - 查询参数
   * @param {String} params.regionId - 地域 ID（可选，不传则查询所有地域）
   * @param {Boolean} params.allRegions - 是否查询所有地域（默认 false）
   */
  async describeDBInstances(params = {}) {
    // 如果指定了 allRegions=true，查询所有地域
    if (params.allRegions) {
      return await this.describeAllRegionsDBInstances(params);
    }
    
    // 否则查询指定地域
    return await this.client.callAPI('DescribeDBInstances', {
      RegionId: params.regionId || this.client.regionId,
      DBInstanceId: params.dbInstanceId,
      DBInstanceName: params.dbInstanceName,
      Engine: params.engine,
      EngineVersion: params.engineVersion,
      ChargeType: params.chargeType,
      NetworkType: params.networkType,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  /**
   * 查询所有地域的 MongoDB 实例
   * @param {Object} params - 查询参数
   */
  async describeAllRegionsDBInstances(params = {}) {
    const regions = [
      'cn-hangzhou', 'cn-shanghai', 'cn-nanjing',
      'cn-beijing', 'cn-zhangjiakou', 'cn-huhehaote',
      'cn-shenzhen', 'cn-guangzhou', 'cn-chengdu',
      'cn-hongkong',
      'ap-southeast-1', 'ap-southeast-2', 'ap-southeast-3', 'ap-southeast-5',
      'ap-northeast-1', 'ap-south-1',
      'us-west-1', 'us-east-1',
      'eu-central-1', 'eu-west-1',
      'me-east-1'
    ];
    
    const allInstances = [];
    let totalCount = 0;
    
    for (const region of regions) {
      try {
        const result = await this.client.callAPI('DescribeDBInstances', {
          RegionId: region,
          PageNumber: 1,
          PageSize: 100
        });
        
        const count = result.TotalCount || 0;
        if (count > 0) {
          totalCount += count;
          if (result.DBInstances && result.DBInstances.DBInstance) {
            result.DBInstances.DBInstance.forEach(inst => {
              allInstances.push({
                ...inst,
                RegionId: region
              });
            });
          }
        }
      } catch (error) {
        // 某些地域可能不支持或无权限，跳过
      }
    }
    
    return {
      TotalCount: totalCount,
      PageNumber: 1,
      PageSize: 100,
      DBInstances: {
        DBInstance: allInstances
      }
    };
  }

  /**
   * 查询实例详情
   */
  async describeDBInstanceAttribute(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceAttribute', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 查询地域列表
   */
  async describeRegions() {
    return await this.client.callAPI('DescribeRegions');
  }

  /**
   * 查询可用区
   */
  async describeZones() {
    return await this.client.callAPI('DescribeZones');
  }

  /**
   * 查询规格列表
   */
  async describeAvailableResource(params) {
    return await this.client.callAPI('DescribeAvailableResource', {
      RegionId: params.regionId || this.client.regionId,
      ZoneId: params.zoneId,
      Engine: params.engine || 'MongoDB',
      EngineVersion: params.engineVersion
    });
  }
}

/**
 * 5. 连接管理模块
 */
class ConnectionModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 查询连接地址
   */
  async describeDBInstanceNetInfo(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceNetInfo', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 申请连接地址
   */
  async allocatePublicConnection(params) {
    return await this.client.callAPI('AllocatePublicConnection', {
      DBInstanceId: params.dbInstanceId,
      ConnectionStringPrefix: params.connectionStringPrefix
    });
  }

  /**
   * 释放连接地址
   */
  async releasePublicConnection(dbInstanceId, connectionString) {
    return await this.client.callAPI('ReleasePublicConnection', {
      DBInstanceId: dbInstanceId,
      ConnectionString: connectionString
    });
  }

  /**
   * 切换连接地址
   */
  async switchDBInstanceNetType(params) {
    return await this.client.callAPI('SwitchDBInstanceNetType', {
      DBInstanceId: params.dbInstanceId,
      ConnectionString: params.connectionString,
      NetType: params.netType // VPC|Classic
    });
  }
}

/**
 * 6. 资源管理模块
 */
class ResourceModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 查询标签列表
   */
  async listTagResources(params) {
    return await this.client.callAPI('ListTagResources', {
      RegionId: params.regionId || this.client.regionId,
      ResourceType: 'DBInstance',
      ResourceId: params.resourceIds
    });
  }

  /**
   * 绑定标签
   */
  async tagResources(params) {
    return await this.client.callAPI('TagResources', {
      RegionId: params.regionId || this.client.regionId,
      ResourceType: 'DBInstance',
      ResourceId: params.resourceIds,
      Tag: JSON.stringify(params.tags)
    });
  }

  /**
   * 解绑标签
   */
  async untagResources(params) {
    return await this.client.callAPI('UntagResources', {
      RegionId: params.regionId || this.client.regionId,
      ResourceType: 'DBInstance',
      ResourceId: params.resourceIds,
      TagKey: params.tagKeys
    });
  }
}

/**
 * 7. 账号管理模块
 */
class AccountModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 创建账号
   */
  async createAccount(params) {
    return await this.client.callAPI('CreateAccount', {
      DBInstanceId: params.dbInstanceId,
      AccountName: params.accountName,
      AccountPassword: params.password,
      AccountDescription: params.description || ''
    });
  }

  /**
   * 删除账号
   */
  async deleteAccount(dbInstanceId, accountName) {
    return await this.client.callAPI('DeleteAccount', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName
    });
  }

  /**
   * 查询账号列表
   */
  async describeAccounts(dbInstanceId) {
    return await this.client.callAPI('DescribeAccounts', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 重置账号密码
   */
  async resetAccountPassword(dbInstanceId, accountName, password) {
    return await this.client.callAPI('ResetAccountPassword', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName,
      AccountPassword: password
    });
  }

  /**
   * 授予账号权限
   */
  async grantAccountPrivilege(params) {
    return await this.client.callAPI('GrantAccountPrivilege', {
      DBInstanceId: params.dbInstanceId,
      AccountName: params.accountName,
      DbName: params.dbName,
      AccountPrivilege: params.accountPrivilege // ReadWrite|ReadOnly|DBOwner
    });
  }

  /**
   * 撤销账号权限
   */
  async revokeAccountPrivilege(params) {
    return await this.client.callAPI('RevokeAccountPrivilege', {
      DBInstanceId: params.dbInstanceId,
      AccountName: params.accountName,
      DbName: params.dbName
    });
  }
}

/**
 * 8. 白名单和安全组模块
 */
class SecurityModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 查询白名单
   */
  async describeDBInstanceIPArrayList(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceIPArrayList', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 修改白名单
   */
  async modifySecurityIps(params) {
    return await this.client.callAPI('ModifySecurityIps', {
      DBInstanceId: params.dbInstanceId,
      SecurityIps: params.securityIps,
      SecurityIpGroupAttribute: params.securityIpGroupAttribute,
      SecurityIpGroupName: params.securityIpGroupName
    });
  }

  /**
   * 查询安全组
   */
  async describeDBInstanceSecurityGroups(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceSecurityGroups', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 修改安全组
   */
  async modifyDBInstanceSecurityGroups(params) {
    return await this.client.callAPI('ModifyDBInstanceSecurityGroups', {
      DBInstanceId: params.dbInstanceId,
      SecurityGroupId: params.securityGroupId
    });
  }
}

/**
 * 9. 参数管理模块
 */
class ParameterModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 查询实例参数
   */
  async describeParameters(dbInstanceId) {
    return await this.client.callAPI('DescribeParameters', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 修改实例参数
   */
  async modifyParameters(params) {
    return await this.client.callAPI('ModifyParameters', {
      DBInstanceId: params.dbInstanceId,
      Parameters: params.parameters // JSON 格式
    });
  }

  /**
   * 查询参数模板
   */
  async describeParameterTemplates(params) {
    return await this.client.callAPI('DescribeParameterTemplates', {
      RegionId: params.regionId || this.client.regionId,
      Engine: params.engine || 'MongoDB',
      EngineVersion: params.engineVersion
    });
  }

  /**
   * 应用参数模板
   */
  async applyParameterTemplate(params) {
    return await this.client.callAPI('ApplyParameterTemplate', {
      DBInstanceId: params.dbInstanceId,
      TemplateId: params.templateId
    });
  }
}

/**
 * 10. 备份与恢复模块
 */
class BackupModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 创建备份
   */
  async createBackup(params) {
    return await this.client.callAPI('CreateBackup', {
      DBInstanceId: params.dbInstanceId,
      BackupMethod: params.backupMethod || 'Logic',
      BackupName: params.backupName || ''
    });
  }

  /**
   * 删除备份
   */
  async deleteBackup(dbInstanceId, backupId) {
    return await this.client.callAPI('DeleteBackup', {
      DBInstanceId: dbInstanceId,
      BackupId: backupId
    });
  }

  /**
   * 查询备份列表
   */
  async describeBackups(params) {
    return await this.client.callAPI('DescribeBackups', {
      DBInstanceId: params.dbInstanceId,
      BackupStatus: params.backupStatus,
      StartTime: params.startTime,
      EndTime: params.endTime,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  /**
   * 查询备份策略
   */
  async describeBackupPolicy(dbInstanceId) {
    return await this.client.callAPI('DescribeBackupPolicy', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 修改备份策略
   */
  async modifyBackupPolicy(params) {
    return await this.client.callAPI('ModifyBackupPolicy', {
      DBInstanceId: params.dbInstanceId,
      BackupTime: params.backupTime,
      BackupPeriod: params.backupPeriod,
      BackupRetentionPeriod: params.backupRetentionPeriod,
      BackupMethod: params.backupMethod
    });
  }

  /**
   * 恢复实例
   */
  async restoreDBInstance(params) {
    return await this.client.callAPI('RestoreDBInstance', {
      DBInstanceId: params.dbInstanceId,
      BackupId: params.backupId,
      RestoreTime: params.restoreTime
    });
  }

  /**
   * 按时间点恢复
   */
  async restoreDBInstanceByTime(params) {
    return await this.client.callAPI('RestoreDBInstanceByTime', {
      DBInstanceId: params.dbInstanceId,
      RestoreTime: params.restoreTime
    });
  }
}

/**
 * 主导出类
 */
class MongoDBDatabaseOperation {
  constructor(config) {
    if (!config?.accessKeyId && !process.env.ALIBABA_CLOUD_ACCESS_KEY_ID) {
      throw new Error('AccessKey 配置缺失');
    }

    this.client = new MongoDBClient(config);
    this.create = new CreateModule(this.client);
    this.modify = new ModifyModule(this.client);
    this.instances = new InstanceModule(this.client);
    this.describe = new DescribeModule(this.client);
    this.connection = new ConnectionModule(this.client);
    this.resources = new ResourceModule(this.client);
    this.accounts = new AccountModule(this.client);
    this.security = new SecurityModule(this.client);
    this.parameters = new ParameterModule(this.client);
    this.backup = new BackupModule(this.client);
  }
}

module.exports = MongoDBDatabaseOperation;
