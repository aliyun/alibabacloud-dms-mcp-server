/**
 * Redis 数据库操作 Skill - 主入口
 * 阿里云 Redis (R-KVStore) API 2015-01-01
 * 使用 V1 签名机制 (HMAC-SHA1)
 * 
 * 功能模块:
 * 1. 生命周期管理 (Lifecycle) - 开源版 Redis 实例创建/删除
 * 2. 实例管理 (Instance) - 云原生 Tair 实例管理
 * 3. 连接管理 (Connection) - 连接地址管理
 * 4. 账号管理 (Account) - 账号创建/授权
 * 5. 网络安全 (Security) - 白名单/SSL
 * 6. 参数管理 (Parameter) - 参数配置
 * 7. 备份恢复 (Backup) - 备份/恢复
 */

const crypto = require('crypto');
const https = require('https');
const CredentialManager = require('./credential-manager');

// API 配置
const API_ENDPOINT = 'r-kvstore.aliyuncs.com';
const API_VERSION = '2015-01-01';

/**
 * V1 签名专用 URL 编码
 */
function percentEncode(str) {
  if (!str) return '';
  let encoded = encodeURIComponent(str);
  encoded = encoded.replace(/\+/g, '%20');
  encoded = encoded.replace(/\*/g, '%2A');
  encoded = encoded.replace(/%7E/g, '~');
  return encoded;
}

/**
 * 获取 ISO8601 格式的时间戳（UTC 时间）
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
 * Redis API 客户端类
 */
class RedisClient {
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
 * 生命周期管理模块 (开源版 Redis)
 */
class LifecycleModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 创建开源版 Redis 实例
   * 
   * ⚠️ 重要参数说明：
   * - instanceClass: 必须使用正确的规格，如 redis.logic.sharding.1g.2db.0rodb.4proxy.default
   *   不要使用 redis.master.micro.default（本地磁盘规格，不支持高版本）
   * - engineVersion: 必须先通过 DescribeAvailableResource 查询支持的版本（通常是 5.0）
   * - instanceChargeType: 注意大小写，应该是 'PostPaid'（不是 'Postpaid'）
   * - architectureType: 'cluster'（集群版）或 'standard'（标准版）
   * - seriesType: 'enhanced_performance_type'（性能增强型）
   * 
   * 推荐流程：
   * 1. 先调用 describeAvailableResource 查询可用的规格
   * 2. 从返回结果中选择合适的 instanceClass 和 engineVersion
   * 3. 使用正确的参数创建实例
   * 
   * 示例：
   * await redis.lifecycle.createInstance({
   *   instanceClass: 'redis.logic.sharding.1g.2db.0rodb.4proxy.default',
   *   capacity: 2048,
   *   engineVersion: '5.0',
   *   instanceChargeType: 'PostPaid',
   *   architectureType: 'cluster',
   *   seriesType: 'enhanced_performance_type',
   *   zoneId: 'cn-hangzhou-b'
   * });
   */
  async createInstance(params) {
    const result = await this.client.callAPI('CreateInstance', {
      RegionId: params.regionId || this.client.regionId,
      EngineVersion: params.engineVersion || '5.0',
      InstanceClass: params.instanceClass,
      Capacity: params.capacity,
      InstanceChargeType: params.instanceChargeType || 'PostPaid',
      InstanceName: params.instanceName || '',
      Password: params.password,
      ZoneId: params.zoneId,
      VpcId: params.vpcId,
      VSwitchId: params.vswitchId,
      SeriesType: params.seriesType,
      ArchitectureType: params.architectureType,
      NodeType: params.nodeType
    });
    
    // ⚠️  重要提醒：实例创建是异步的
    if (result.InstanceId) {
      console.warn('\n⚠️  重要提醒:');
      console.warn('   - Redis 实例创建是异步操作，实例状态为 Creating');
      console.warn('   - 需要等待 2-3 分钟实例状态变为 Normal');
      console.warn('   - 请使用 describeInstanceAttribute() 查询实例状态');
      console.warn('   - 不要立即重试创建，避免创建多个实例\n');
    }
    
    return result;
  }

  /**
   * 删除开源版 Redis 实例
   */
  async deleteInstance(instanceId) {
    return await this.client.callAPI('DeleteInstance', {
      InstanceId: instanceId
    });
  }

  /**
   * 查询开源版 Redis 实例列表
   * @param {Object} params - 查询参数
   * @param {String} params.regionId - 地域 ID（可选，不传则查询所有地域）
   * @param {Boolean} params.allRegions - 是否查询所有地域（默认 false）
   */
  async describeInstances(params = {}) {
    // 如果指定了 allRegions=true，查询所有地域
    if (params.allRegions) {
      return await this.describeAllRegionsInstances(params);
    }
    
    // 否则查询指定地域
    return await this.client.callAPI('DescribeInstances', {
      RegionId: params.regionId || this.client.regionId,
      InstanceId: params.instanceId,
      InstanceName: params.instanceName,
      InstanceType: params.instanceType,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  /**
   * 查询所有地域的 Redis 实例
   * @param {Object} params - 查询参数
   */
  async describeAllRegionsInstances(params = {}) {
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
        const result = await this.client.callAPI('DescribeInstances', {
          RegionId: region,
          PageNumber: 1,
          PageSize: 100
        });
        
        const count = result.TotalCount || 0;
        if (count > 0) {
          totalCount += count;
          if (result.Instances && result.Instances.Instance) {
            result.Instances.Instance.forEach(inst => {
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
      Instances: {
        Instance: allInstances
      }
    };
  }

  /**
   * 查询开源版 Redis 实例详情
   */
  async describeInstanceAttribute(instanceId) {
    return await this.client.callAPI('DescribeInstanceAttribute', {
      InstanceId: instanceId
    });
  }

  /**
   * 修改实例名称
   */
  async modifyInstanceName(instanceId, instanceName) {
    return await this.client.callAPI('ModifyInstanceName', {
      InstanceId: instanceId,
      InstanceName: instanceName
    });
  }

  /**
   * 重启实例
   */
  async restartInstance(instanceId) {
    return await this.client.callAPI('RestartInstance', {
      InstanceId: instanceId
    });
  }

  /**
   * 变更配置
   */
  async modifyInstanceCapacity(instanceId, capacity) {
    return await this.client.callAPI('ModifyInstanceCapacity', {
      InstanceId: instanceId,
      Capacity: capacity
    });
  }

  /**
   * 查询可用地域
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
   * 查询实例规格
   */
  async describeAvailableResource(params) {
    return await this.client.callAPI('DescribeAvailableResource', {
      RegionId: params.regionId || this.client.regionId,
      ZoneId: params.zoneId,
      InstanceChargeType: params.instanceChargeType,
      ArchitectureType: params.architectureType
    });
  }
}

/**
 * 实例管理模块 (云原生 Tair)
 * 注意：Tair 使用独立的 API 前缀，部分 API 可能与开源版 Redis 共用
 */
class InstanceModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 创建 Tair 实例
   */
  async createDBInstance(params) {
    return await this.client.callAPI('CreateInstance', {
      RegionId: params.regionId || this.client.regionId,
      InstanceType: params.instanceType || 3, // 3=企业版 (Tair)
      EngineVersion: params.engineVersion || '6.0',
      NodeType: params.nodeType || 1,
      InstanceClass: params.instanceClass,
      Capacity: params.capacity,
      Quantity: params.quantity || 1,
      ChargeType: params.chargeType || 'Postpaid',
      InstanceName: params.instanceName || '',
      Password: params.password,
      VpcId: params.vpcId,
      VSwitchId: params.vswitchId,
      PrivateIp: params.privateIp,
      CouponCode: params.couponCode,
      AutoRenew: params.autoRenew || 'false',
      AutoRenewPeriod: params.autoRenewPeriod || 1,
      Period: params.period || 1,
      PricingCycle: params.pricingCycle || 'Month',
      ZoneId: params.zoneId,
      ArchitectureType: params.architectureType
    });
  }

  /**
   * 删除 Tair 实例
   */
  async deleteDBInstance(instanceId) {
    return await this.client.callAPI('DeleteInstance', {
      InstanceId: instanceId
    });
  }

  /**
   * 查询 Tair 实例列表 - 使用 DescribeInstances 共用 API
   */
  async describeDBInstances(params = {}) {
    return await this.client.callAPI('DescribeInstances', {
      RegionId: params.regionId || this.client.regionId,
      InstanceId: params.instanceId,
      InstanceType: params.instanceType || 3, // 3=企业版
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  /**
   * 查询 Tair 实例详情
   */
  async describeDBInstanceAttribute(instanceId) {
    return await this.client.callAPI('DescribeInstanceAttribute', {
      InstanceId: instanceId
    });
  }

  /**
   * 修改 Tair 实例名称
   */
  async modifyDBInstanceName(instanceId, instanceName) {
    return await this.client.callAPI('ModifyInstanceName', {
      InstanceId: instanceId,
      InstanceName: instanceName
    });
  }

  /**
   * 重启 Tair 实例
   */
  async restartDBInstance(instanceId) {
    return await this.client.callAPI('RestartInstance', {
      InstanceId: instanceId
    });
  }
}

/**
 * 连接管理模块
 */
class ConnectionModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 查询连接地址
   */
  async describeConnectionDomain(instanceId) {
    return await this.client.callAPI('DescribeConnectionDomain', {
      InstanceId: instanceId
    });
  }

  /**
   * 申请公网连接地址
   */
  async allocatePublicConnection(instanceId) {
    return await this.client.callAPI('AllocatePublicConnection', {
      InstanceId: instanceId
    });
  }

  /**
   * 释放公网连接地址
   */
  async releasePublicConnection(instanceId, connectionDomain) {
    return await this.client.callAPI('ReleasePublicConnection', {
      InstanceId: instanceId,
      ConnectionDomain: connectionDomain
    });
  }

  /**
   * 修改连接地址
   */
  async modifyConnectionDomain(instanceId, newConnectionDomain) {
    return await this.client.callAPI('ModifyConnectionDomain', {
      InstanceId: instanceId,
      ConnectionDomain: newConnectionDomain
    });
  }
}

/**
 * 账号管理模块
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
      InstanceId: params.instanceId,
      AccountName: params.accountName,
      AccountPassword: params.accountPassword || params.password, // 兼容两种参数名
      AccountType: params.accountType || 'Normal', // Normal/Super
      Description: params.description || ''
    });
  }

  /**
   * 删除账号
   */
  async deleteAccount(instanceId, accountName) {
    return await this.client.callAPI('DeleteAccount', {
      InstanceId: instanceId,
      AccountName: accountName
    });
  }

  /**
   * 查询账号列表
   */
  async describeAccounts(instanceId) {
    return await this.client.callAPI('DescribeAccounts', {
      InstanceId: instanceId
    });
  }

  /**
   * 重置账号密码
   */
  async resetAccountPassword(instanceId, accountName, password) {
    return await this.client.callAPI('ResetAccountPassword', {
      InstanceId: instanceId,
      AccountName: accountName,
      AccountPassword: password
    });
  }

  /**
   * 授权账号
   */
  async grantAccountPrivilege(params) {
    return await this.client.callAPI('GrantAccountPrivilege', {
      InstanceId: params.instanceId,
      AccountName: params.accountName,
      DbName: params.dbName,
      AccountPrivilege: params.accountPrivilege // ReadWrite/ReadOnly/DDLOnly/DMLOnly
    });
  }

  /**
   * 撤销账号权限
   */
  async revokeAccountPrivilege(params) {
    return await this.client.callAPI('RevokeAccountPrivilege', {
      InstanceId: params.instanceId,
      AccountName: params.accountName,
      DbName: params.dbName
    });
  }
}

/**
 * 网络安全模块
 */
class SecurityModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 查询 IP 白名单
   */
  async describeSecurityIps(instanceId) {
    return await this.client.callAPI('DescribeSecurityIps', {
      InstanceId: instanceId
    });
  }

  /**
   * 修改 IP 白名单
   */
  async modifySecurityIps(params) {
    return await this.client.callAPI('ModifySecurityIps', {
      InstanceId: params.instanceId,
      SecurityIps: params.securityIps,
      ModifyMode: params.modifyMode || 'Append', // Append/Delete/Overwrite
      SecurityIpGroupName: params.securityIpGroupName
    });
  }

  /**
   * 查询安全组
   */
  async describeSecurityGroups(instanceId) {
    return await this.client.callAPI('DescribeSecurityGroups', {
      InstanceId: instanceId
    });
  }

  /**
   * 修改安全组
   */
  async modifySecurityGroups(params) {
    return await this.client.callAPI('ModifySecurityGroups', {
      InstanceId: params.instanceId,
      SecurityGroups: params.securityGroups
    });
  }
}

/**
 * 参数管理模块
 */
class ParameterModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 查询实例参数
   */
  async describeParameters(instanceId) {
    return await this.client.callAPI('DescribeParameters', {
      InstanceId: instanceId
    });
  }

  /**
   * 修改实例参数
   */
  async modifyParameter(params) {
    return await this.client.callAPI('ModifyParameter', {
      InstanceId: params.instanceId,
      Config: params.config // JSON 格式的参数配置
    });
  }

  /**
   * 查询参数模板
   */
  async describeParameterTemplates(params) {
    return await this.client.callAPI('DescribeParameterTemplates', {
      RegionId: params.regionId || this.client.regionId,
      EngineVersion: params.engineVersion || '6.0',
      ArchitectureType: params.architectureType || 'standard',
      CharacterType: params.characterType || 'h' // h=性能增强型
    });
  }

  /**
   * 应用参数模板
   */
  async applyParameterTemplate(params) {
    return await this.client.callAPI('ApplyParameterTemplate', {
      InstanceId: params.instanceId,
      TemplateId: params.templateId
    });
  }
}

/**
 * 备份恢复模块
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
      InstanceId: params.instanceId,
      BackupName: params.backupName || ''
    });
  }

  /**
   * 删除备份
   */
  async deleteBackup(instanceId, backupId) {
    return await this.client.callAPI('DeleteBackup', {
      InstanceId: instanceId,
      BackupId: backupId
    });
  }

  /**
   * 查询备份列表
   */
  async describeBackups(params) {
    return await this.client.callAPI('DescribeBackups', {
      InstanceId: params.instanceId,
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
  async describeBackupPolicy(instanceId) {
    return await this.client.callAPI('DescribeBackupPolicy', {
      InstanceId: instanceId
    });
  }

  /**
   * 修改备份策略
   */
  async modifyBackupPolicy(params) {
    return await this.client.callAPI('ModifyBackupPolicy', {
      InstanceId: params.instanceId,
      BackupTime: params.backupTime,
      BackupPeriod: params.backupPeriod,
      BackupRetentionPeriod: params.backupRetentionPeriod
    });
  }

  /**
   * 恢复数据
   */
  async restoreInstance(params) {
    return await this.client.callAPI('RestoreInstance', {
      InstanceId: params.instanceId,
      BackupId: params.backupId,
      RestoreTime: params.restoreTime
    });
  }
}

/**
 * 主导出类
 */
class RedisDatabaseOperation {
  constructor(config) {
    if (!config?.accessKeyId && !process.env.ALIBABA_CLOUD_ACCESS_KEY_ID) {
      throw new Error('AccessKey 配置缺失');
    }

    this.client = new RedisClient(config);
    this.lifecycle = new LifecycleModule(this.client); // 开源版 Redis
    this.instances = new InstanceModule(this.client);  // 云原生 Tair
    this.connection = new ConnectionModule(this.client);
    this.accounts = new AccountModule(this.client);
    this.security = new SecurityModule(this.client);
    this.parameters = new ParameterModule(this.client);
    this.backup = new BackupModule(this.client);
  }
}

module.exports = RedisDatabaseOperation;
