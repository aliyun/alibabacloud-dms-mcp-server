/**
 * RDS 数据库操作 Skill - 主入口
 * 使用阿里云 V1 签名机制 (HMAC-SHA1)
 * 参考成功的 Python 实现
 * 
 * 关键点：
 * - 使用 POST 方法
 * - 参数放在 body 中
 * - percent_encode 特殊处理
 * - 参数验证
 */

const crypto = require('crypto');
const https = require('https');
const validator = require('./validator');
const CredentialManager = require('./credential-manager');

// API 配置
const API_ENDPOINT = 'rds.aliyuncs.com';
const API_VERSION = '2014-08-15';

/**
 * V1 签名专用 URL 编码
 * 规则：
 * 1. 字母、数字、下划线、连字符、点、波浪线不编码
 * 2. 空格编码为%20（不是+）
 * 3. *编码为%2A
 * 4. 其他字符按 RFC3986 编码
 */
function percentEncode(str) {
  if (!str) return '';
  
  // 先进行 encodeURIComponent 编码
  let encoded = encodeURIComponent(str);
  
  // 替换特殊字符
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
 * 1. 按参数名字典序排序
 * 2. 对每个参数名和值进行 URL 编码
 * 3. 用"="连接参数名和值
 * 4. 用"&"连接所有参数
 */
function buildCanonicalizedQueryString(params) {
  const sortedKeys = Object.keys(params).sort();
  
  return sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(String(params[key]))}`)
    .join('&');
}

/**
 * 计算 V1 签名
 * 公式：
 * StringToSign = HTTPMethod + "&" + percentEncode("/") + "&" + percentEncode(CanonicalizedQueryString)
 * Signature = Base64(HMAC-SHA1(AccessKeySecret + "&", StringToSign))
 */
function calculateSignature(params, accessKeySecret, method = 'POST') {
  // 构造规范化查询字符串
  const canonicalizedQueryString = buildCanonicalizedQueryString(params);
  
  // 构造待签名字符串
  const stringToSign = `${method}&${percentEncode('/')}&${percentEncode(canonicalizedQueryString)}`;
  
  // 计算 HMAC-SHA1
  const key = `${accessKeySecret}&`;
  const hmacSha1 = crypto
    .createHmac('sha1', key)
    .update(stringToSign, 'utf8')
    .digest('base64');
  
  return hmacSha1;
}

/**
 * RDS API 客户端类
 */
class RDSClient {
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
   * 当没有直接传入 AKSK 时，从其他来源发现
   */
  async initCredential() {
    if (this.credential) {
      return this.credential;
    }

    // 发现所有凭证来源
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
    
    // 选择凭证（自动选择最高优先级）
    const result = await this.credentialManager.selectCredential(sources, {
      autoSelect: this.config.autoSelect !== false,
      requireConfirmation: this.config.requireConfirmation || false
    });

    if (result.requiresUserSelection) {
      // 需要用户选择，抛出带凭证列表的错误
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
   * @param {string} action API 动作
   * @param {object} params API 参数
   * @param {boolean} unwrap 是否自动解包（默认 true，直接返回 data）
   * @returns {Promise<any>} API 响应
   */
  async callAPI(action, params = {}, unwrap = true) {
    // 确保凭证已初始化
    await this.initCredential();

    // 构建公共参数
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
    
    // 合并参数
    const allParams = { ...commonParams, ...params, Action: action };
    
    // 移除空值参数
    Object.keys(allParams).forEach(key => {
      if (allParams[key] === undefined || allParams[key] === null || allParams[key] === '') {
        delete allParams[key];
      }
    });
    
    // 计算签名
    const signature = calculateSignature(allParams, this.accessKeySecret, 'POST');
    allParams.Signature = signature;
    
    // 构建请求 body（POST 请求，参数放在 body 中）
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
        const error = {
          success: false,
          error: {
            code: 'RequestError',
            message: e.message
          }
        };
        resolve(unwrap ? error : error.error);
      });
      
      req.setTimeout(60000);
      req.write(body);
      req.end();
    });
  }
}

/**
 * 实例管理模块
 */
class InstanceModule {
  constructor(client) {
    this.client = client;
  }

  async createInstance(params) {
    // 安全提醒：如果未指定安全 IP，使用 0.0.0.0/0 会有安全风险
    const securityIpList = params.securityIpList || '0.0.0.0/0';
    if (securityIpList === '0.0.0.0/0') {
      console.warn('⚠️  安全警告：当前设置允许所有 IP 访问 (0.0.0.0/0)，建议设置具体的 IP 白名单以提高安全性');
    }
    
    const result = await this.client.callAPI('CreateDBInstance', {
      RegionId: params.regionId || this.client.regionId,
      Engine: params.engine,
      EngineVersion: params.engineVersion,
      DBInstanceClass: params.dbInstanceClass,
      DBInstanceStorage: params.dbInstanceStorage,
      DBInstanceNetType: 'Intranet',
      PayType: params.payType || 'Postpaid',
      DBInstanceStorageType: params.dbInstanceStorageType || 'cloud_essd',
      Category: params.category || 'HighAvailability',
      ZoneId: params.zoneId,
      VPCId: params.vpcId,
      VSwitchId: params.vSwitchId,
      SecurityIPList: securityIpList,
      DBInstanceDescription: params.description || '',
      AutoRenew: params.autoRenew || 'false',
      ClientToken: params.clientToken
    });
    
    // ⚠️  重要提醒：实例创建是异步的
    if (result.DBInstanceId) {
      console.warn('\n⚠️  重要提醒:');
      console.warn('   - RDS 实例创建是异步操作，实例状态为 Creating');
      console.warn('   - 需要等待 3-5 分钟实例状态变为 Running');
      console.warn('   - 请使用 describeInstanceAttribute() 查询实例状态');
      console.warn('   - 不要立即重试创建，避免创建多个实例\n');
    }
    
    return result;
  }

  async deleteInstance(dbInstanceId) {
    return await this.client.callAPI('DeleteDBInstance', {
      DBInstanceId: dbInstanceId
    });
  }

  /**
   * 获取 RDS 实例列表
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
    return await this.client.callAPI('DescribeDBInstances', {
      RegionId: params.regionId || this.client.regionId,
      Engine: params.engine,
      DBInstanceId: params.dbInstanceId,
      DBInstanceStatus: params.status,
      PayType: params.payType,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  /**
   * 查询所有地域的 RDS 实例
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
        const result = await this.client.callAPI('DescribeDBInstances', {
          RegionId: region,
          PageNumber: 1,
          PageSize: 100
        });
        
        const count = result.TotalRecordCount || 0;
        if (count > 0) {
          totalCount += count;
          if (result.Items && result.Items.DBInstance) {
            result.Items.DBInstance.forEach(inst => {
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
      TotalRecordCount: totalCount,
      PageNumber: 1,
      PageSize: 100,
      Items: {
        DBInstance: allInstances
      }
    };
  }

  async describeInstanceAttribute(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceAttribute', {
      DBInstanceId: dbInstanceId
    });
  }

  async restartInstance(dbInstanceId) {
    return await this.client.callAPI('RestartDBInstance', {
      DBInstanceId: dbInstanceId
    });
  }

  async startInstance(dbInstanceId) {
    return await this.client.callAPI('StartDBInstance', {
      DBInstanceId: dbInstanceId
    });
  }

  async stopInstance(dbInstanceId) {
    return await this.client.callAPI('StopDBInstance', {
      DBInstanceId: dbInstanceId
    });
  }

  async modifyInstanceSpec(dbInstanceId, spec, storage) {
    return await this.client.callAPI('ModifyDBInstanceSpec', {
      DBInstanceId: dbInstanceId,
      DBInstanceClass: spec,
      DBInstanceStorage: storage
    });
  }

  async modifyInstanceDescription(dbInstanceId, description) {
    return await this.client.callAPI('ModifyDBInstanceDescription', {
      DBInstanceId: dbInstanceId,
      DBInstanceDescription: description
    });
  }

  async describeRegions() {
    return await this.client.callAPI('DescribeRegions');
  }

  async describeAvailableZones(params = {}) {
    return await this.client.callAPI('DescribeAvailableZones', {
      RegionId: params.regionId || this.client.regionId,
      Engine: params.engine,
      DBInstanceCategory: params.category
    });
  }

  async describeAvailableClasses(dbInstanceId) {
    return await this.client.callAPI('DescribeAvailableClasses', {
      DBInstanceId: dbInstanceId
    });
  }

  async checkInstanceExist(dbInstanceId) {
    return await this.client.callAPI('CheckInstanceExist', {
      DBInstanceId: dbInstanceId
    });
  }

  async modifyAutoRenewal(dbInstanceId, autoRenew, duration) {
    return await this.client.callAPI('ModifyInstanceAutoRenewalAttribute', {
      DBInstanceId: dbInstanceId,
      AutoRenew: autoRenew,
      Duration: duration
    });
  }

  async describeAutoRenewal(dbInstanceId) {
    return await this.client.callAPI('DescribeInstanceAutoRenewalAttribute', {
      DBInstanceId: dbInstanceId
    });
  }

  async renewInstance(dbInstanceId, period) {
    return await this.client.callAPI('RenewInstance', {
      DBInstanceId: dbInstanceId,
      Period: period
    });
  }

  async modifyDeletionProtection(dbInstanceId, enabled) {
    return await this.client.callAPI('ModifyDBInstanceDeletionProtection', {
      DBInstanceId: dbInstanceId,
      DeletionProtection: enabled ? 'true' : 'false'
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

  async createAccount(params) {
    // 参数验证
    const nameValidation = validator.validateAccountName(params.accountName);
    if (!nameValidation.valid) {
      return { success: false, error: { code: 'InvalidParameter', message: nameValidation.message } };
    }
    
    const passwordValidation = validator.validatePassword(params.accountPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: { code: 'InvalidParameter', message: passwordValidation.message } };
    }
    
    const typeValidation = validator.validateAccountType(params.accountType || 'Normal');
    if (!typeValidation.valid) {
      return { success: false, error: { code: 'InvalidParameter', message: typeValidation.message } };
    }
    
    // 警告：如果是 0.0.0.0/0
    if (passwordValidation.warning) {
      console.warn('⚠️ 警告：' + passwordValidation.message);
    }
    
    return await this.client.callAPI('CreateAccount', {
      DBInstanceId: params.dbInstanceId,
      AccountName: params.accountName,
      AccountPassword: params.accountPassword,
      AccountDescription: params.description || '',
      AccountType: params.accountType || 'Normal'
    });
  }

  async deleteAccount(dbInstanceId, accountName) {
    return await this.client.callAPI('DeleteAccount', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName
    });
  }

  async describeAccounts(dbInstanceId, accountName) {
    return await this.client.callAPI('DescribeAccounts', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName
    });
  }

  async resetAccountPassword(dbInstanceId, accountName, newPassword) {
    return await this.client.callAPI('ResetAccountPassword', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName,
      AccountPassword: newPassword
    });
  }

  async modifyAccountDescription(dbInstanceId, accountName, description) {
    return await this.client.callAPI('ModifyAccountDescription', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName,
      AccountDescription: description
    });
  }

  async grantAccountPrivilege(dbInstanceId, accountName, dbName, privilege) {
    return await this.client.callAPI('GrantAccountPrivilege', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName,
      DBName: dbName,
      AccountPrivilege: privilege
    });
  }

  async revokeAccountPrivilege(dbInstanceId, accountName, dbName) {
    return await this.client.callAPI('RevokeAccountPrivilege', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName,
      DBName: dbName
    });
  }

  async checkAccountNameAvailable(dbInstanceId, accountName) {
    return await this.client.callAPI('CheckAccountNameAvailable', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName
    });
  }

  async lockAccount(dbInstanceId, accountName) {
    return await this.client.callAPI('LockAccount', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName
    });
  }

  async unlockAccount(dbInstanceId, accountName) {
    return await this.client.callAPI('UnlockAccount', {
      DBInstanceId: dbInstanceId,
      AccountName: accountName
    });
  }
}

/**
 * 数据库管理模块
 */
class DatabaseModule {
  constructor(client) {
    this.client = client;
  }

  async createDatabase(params) {
    // 参数验证
    const nameValidation = validator.validateDatabaseName(params.dbName);
    if (!nameValidation.valid) {
      return { success: false, error: { code: 'InvalidParameter', message: nameValidation.message } };
    }
    
    const charsetValidation = validator.validateCharset(params.characterSetName || 'utf8');
    if (!charsetValidation.valid) {
      return { success: false, error: { code: 'InvalidParameter', message: charsetValidation.message } };
    }
    
    // 警告：utf8 不支持 emoji
    if ((params.characterSetName || 'utf8').toLowerCase() === 'utf8') {
      console.warn('⚠️ 提示：utf8 字符集不支持 emoji，建议使用 utf8mb4');
    }
    
    if (!params.accountName) {
      return { success: false, error: { code: 'MissingParameter', message: 'accountName（所有者账号）不能为空' } };
    }
    
    return await this.client.callAPI('CreateDatabase', {
      DBInstanceId: params.dbInstanceId,
      DBName: params.dbName,
      CharacterSetName: params.characterSetName || 'utf8',
      AccountName: params.accountName,
      AccountPrivilege: params.accountPrivilege || 'ReadWrite',
      DBDescription: params.description || ''
    });
  }

  async deleteDatabase(dbInstanceId, dbName) {
    return await this.client.callAPI('DeleteDatabase', {
      DBInstanceId: dbInstanceId,
      DBName: dbName
    });
  }

  async describeDatabases(dbInstanceId, dbName) {
    return await this.client.callAPI('DescribeDatabases', {
      DBInstanceId: dbInstanceId,
      DBName: dbName
    });
  }

  async modifyDBDescription(dbInstanceId, dbName, description) {
    return await this.client.callAPI('ModifyDBDescription', {
      DBInstanceId: dbInstanceId,
      DBName: dbName,
      DBDescription: description
    });
  }

  async checkDBNameAvailable(dbInstanceId, dbName) {
    return await this.client.callAPI('CheckDBNameAvailable', {
      DBInstanceId: dbInstanceId,
      DBName: dbName
    });
  }

  async describeCharacterSetName(dbInstanceId, engine) {
    return await this.client.callAPI('DescribeCharacterSetName', {
      DBInstanceId: dbInstanceId,
      Engine: engine
    });
  }
}

/**
 * 安全加密模块
 */
class SecurityModule {
  constructor(client) {
    this.client = client;
  }

  async modifySecurityIps(params) {
    return await this.client.callAPI('ModifySecurityIps', {
      DBInstanceId: params.dbInstanceId,
      SecurityIps: params.securityIps,
      SecurityIpGroupName: params.securityIpGroupName || 'default',
      ModifyMode: params.modifyMode || 'Cover'
    });
  }

  async describeIPArrayList(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceIPArrayList', {
      DBInstanceId: dbInstanceId
    });
  }

  async modifySSL(dbInstanceId, sslStatus) {
    return await this.client.callAPI('ModifyDBInstanceSSL', {
      DBInstanceId: dbInstanceId,
      SSLAction: sslStatus ? 'Open' : 'Close'
    });
  }

  async describeSSL(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceSSL', {
      DBInstanceId: dbInstanceId
    });
  }

  async modifyTDE(dbInstanceId, tdeStatus) {
    return await this.client.callAPI('ModifyDBInstanceTDE', {
      DBInstanceId: dbInstanceId,
      TDEStatus: tdeStatus ? 'Enabled' : 'Disabled'
    });
  }

  async describeTDE(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceTDE', {
      DBInstanceId: dbInstanceId
    });
  }

  async describeEncryptionKey(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceEncryptionKey', {
      DBInstanceId: dbInstanceId
    });
  }

  async modifySecurityGroupConfiguration(dbInstanceId, securityGroupId) {
    return await this.client.callAPI('ModifySecurityGroupConfiguration', {
      DBInstanceId: dbInstanceId,
      SecurityGroupId: securityGroupId
    });
  }

  async describeSecurityGroupConfiguration(dbInstanceId) {
    return await this.client.callAPI('DescribeSecurityGroupConfiguration', {
      DBInstanceId: dbInstanceId
    });
  }
}

/**
 * 网络与连接地址模块
 */
class NetworkModule {
  constructor(client) {
    this.client = client;
  }

  async allocatePublicConnection(dbInstanceId, connectionStringPrefix, port = '3306') {
    return await this.client.callAPI('AllocateInstancePublicConnection', {
      DBInstanceId: dbInstanceId,
      ConnectionStringPrefix: connectionStringPrefix,
      Port: port
    });
  }

  async releasePublicConnection(dbInstanceId, currentConnectionString) {
    const params = {
      DBInstanceId: dbInstanceId
    };
    if (currentConnectionString) {
      params.CurrentConnectionString = currentConnectionString;
    }
    return await this.client.callAPI('ReleaseInstancePublicConnection', params);
  }

  async describeNetInfo(dbInstanceId) {
    return await this.client.callAPI('DescribeDBInstanceNetInfo', {
      DBInstanceId: dbInstanceId
    });
  }

  async modifyConnectionString(dbInstanceId, connectionString, connectionStringPrefix) {
    return await this.client.callAPI('ModifyDBInstanceConnectionString', {
      DBInstanceId: dbInstanceId,
      ConnectionString: connectionString,
      ConnectionStringPrefix: connectionStringPrefix
    });
  }

  async switchNetworkType(dbInstanceId, networkType) {
    return await this.client.callAPI('ModifyDBInstanceNetworkType', {
      DBInstanceId: dbInstanceId,
      InstanceNetworkType: networkType
    });
  }

  async switchVPC(dbInstanceId, vpcId, vSwitchId) {
    return await this.client.callAPI('SwitchDBInstanceVpc', {
      DBInstanceId: dbInstanceId,
      VPCId: vpcId,
      VSwitchId: vSwitchId
    });
  }

  async describeVSwitches(regionId, vpcId, zoneId) {
    return await this.client.callAPI('DescribeVSwitches', {
      RegionId: regionId,
      VPCId: vpcId,
      ZoneId: zoneId
    });
  }

  async describeVpcs(regionId, vpcId) {
    return await this.client.callAPI('DescribeVpcs', {
      RegionId: regionId,
      VPCId: vpcId
    });
  }
}

/**
 * 备份管理模块
 */
class BackupModule {
  constructor(client) {
    this.client = client;
  }

  async createBackup(params) {
    return await this.client.callAPI('CreateBackup', {
      DBInstanceId: params.dbInstanceId,
      BackupStrategy: params.backupStrategy || 'Manual',
      BackupMethod: params.backupMethod || 'Snapshot',
      BackupName: params.backupName
    });
  }

  async deleteBackup(dbInstanceId, backupId) {
    return await this.client.callAPI('DeleteBackup', {
      DBInstanceId: dbInstanceId,
      BackupId: backupId
    });
  }

  async describeBackups(params) {
    return await this.client.callAPI('DescribeBackups', {
      DBInstanceId: params.dbInstanceId,
      BackupStatus: params.backupStatus,
      StartTime: params.startTime,
      EndTime: params.endTime,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30,
      RegionId: params.regionId || this.client.regionId
    });
  }

  async describeBackupPolicy(dbInstanceId) {
    return await this.client.callAPI('DescribeBackupPolicy', {
      DBInstanceId: dbInstanceId
    });
  }

  async modifyBackupPolicy(params) {
    return await this.client.callAPI('ModifyBackupPolicy', {
      DBInstanceId: params.dbInstanceId,
      PreferredBackupTime: params.preferredBackupTime,
      PreferredBackupPeriod: params.preferredBackupPeriod,
      BackupRetentionPeriod: params.backupRetentionPeriod,
      BackupLog: params.backupLog
    });
  }

  async describeBackupTasks(dbInstanceId, backupJobId) {
    return await this.client.callAPI('DescribeBackupTasks', {
      DBInstanceId: dbInstanceId,
      BackupJobId: backupJobId
    });
  }

  async describeBinlogFiles(params) {
    return await this.client.callAPI('DescribeBinlogFiles', {
      DBInstanceId: params.dbInstanceId,
      StartTime: params.startTime,
      EndTime: params.endTime,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  async modifyBackupSetExpireTime(dbInstanceId, backupId, expireTime) {
    return await this.client.callAPI('ModifyBackupSetExpireTime', {
      DBInstanceId: dbInstanceId,
      BackupId: backupId,
      ExpireTime: expireTime
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
   * 查询实例参数列表
   * @param {string} dbInstanceId - 实例 ID
   * @param {object} params - 可选参数
   * @returns {Promise<object>} 参数列表
   */
  async describeParameters(dbInstanceId, params = {}) {
    return await this.client.callAPI('DescribeParameters', {
      DBInstanceId: dbInstanceId,
      ParameterGroupId: params.parameterGroupId,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  /**
   * 修改实例参数
   * @param {object} params - 参数
   * @param {string} params.dbInstanceId - 实例 ID
   * @param {Array} params.parameters - 参数数组 [{name, value}]
   * @param {string} params.forceRestart - 是否强制重启（可选）
   * @returns {Promise<object>} 修改结果
   */
  async modifyParameter(params) {
    // 参数数组格式转换：[{name, value}] => '{"parameters":[{"name":"max_connections","value":"2000"}]}'
    const parametersJson = JSON.stringify({
      parameters: params.parameters.map(p => ({
        ParameterName: p.name,
        ParameterValue: p.value
      }))
    });

    return await this.client.callAPI('ModifyParameter', {
      DBInstanceId: params.dbInstanceId,
      Parameters: parametersJson,
      ForceRestart: params.forceRestart || 'false'
    });
  }

  /**
   * 查询参数模板列表
   * @param {object} params - 可选参数
   * @returns {Promise<object>} 参数模板列表
   */
  async describeParameterGroups(params = {}) {
    return await this.client.callAPI('DescribeParameterGroups', {
      RegionId: params.regionId || this.client.regionId,
      ParameterGroupId: params.parameterGroupId,
      ParameterGroupName: params.parameterGroupName,
      Engine: params.engine,
      EngineVersion: params.engineVersion,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  /**
   * 创建参数模板
   * @param {object} params - 参数
   * @param {string} params.parameterGroupName - 模板名称
   * @param {string} params.engine - 数据库类型（MySQL/PostgreSQL/SQLServer/MariaDB）
   * @param {string} params.engineVersion - 数据库版本
   * @param {Array} params.parameters - 参数数组（可选）[{name, value}]
   * @param {string} params.description - 描述（可选）
   * @returns {Promise<object>} 创建结果
   */
  async createParameterGroup(params) {
    const requestParams = {
      ParameterGroupName: params.parameterGroupName,
      Engine: params.engine,
      EngineVersion: params.engineVersion,
      Description: params.description || ''
    };

    // 如果有参数，转换为 JSON 格式
    if (params.parameters && params.parameters.length > 0) {
      requestParams.Parameters = JSON.stringify({
        parameters: params.parameters.map(p => ({
          ParameterName: p.name,
          ParameterValue: p.value
        }))
      });
    }

    return await this.client.callAPI('CreateParameterGroup', requestParams);
  }

  /**
   * 修改参数模板
   * @param {object} params - 参数
   * @param {string} params.parameterGroupId - 模板 ID
   * @param {string} params.parameterGroupName - 新名称（可选）
   * @param {string} params.description - 新描述（可选）
   * @param {Array} params.parameters - 参数数组（可选）[{name, value}]
   * @returns {Promise<object>} 修改结果
   */
  async modifyParameterGroup(params) {
    const requestParams = {
      ParameterGroupId: params.parameterGroupId
    };

    if (params.parameterGroupName) {
      requestParams.ParameterGroupName = params.parameterGroupName;
    }
    if (params.description) {
      requestParams.Description = params.description;
    }
    if (params.parameters && params.parameters.length > 0) {
      requestParams.Parameters = JSON.stringify({
        parameters: params.parameters.map(p => ({
          ParameterName: p.name,
          ParameterValue: p.value
        }))
      });
    }

    return await this.client.callAPI('ModifyParameterGroup', requestParams);
  }

  /**
   * 删除参数模板
   * @param {string} parameterGroupId - 模板 ID
   * @returns {Promise<object>} 删除结果
   */
  async deleteParameterGroup(parameterGroupId) {
    return await this.client.callAPI('DeleteParameterGroup', {
      ParameterGroupId: parameterGroupId
    });
  }

  /**
   * 应用参数模板到实例
   * @param {object} params - 参数
   * @param {string} params.parameterGroupId - 模板 ID
   * @param {string} params.dbInstanceId - 实例 ID
   * @returns {Promise<object>} 应用结果
   */
  async applyParameterToInstance(params) {
    return await this.client.callAPI('ApplyParameterGroup', {
      ParameterGroupId: params.parameterGroupId,
      DBInstanceId: params.dbInstanceId
    });
  }

  /**
   * 查询参数模板详情
   * @param {string} parameterGroupId - 模板 ID
   * @returns {Promise<object>} 模板详情
   */
  async describeParameterGroupDetail(parameterGroupId) {
    return await this.client.callAPI('DescribeParameterGroupDetail', {
      ParameterGroupId: parameterGroupId
    });
  }
}

/**
 * 主导出类
 */
class RDSDatabaseOperation {
  constructor(config = {}) {
    this.config = config;
    this.client = new RDSClient(config);
    this.instances = new InstanceModule(this.client);
    this.accounts = new AccountModule(this.client);
    this.databases = new DatabaseModule(this.client);
    this.security = new SecurityModule(this.client);
    this.network = new NetworkModule(this.client);
    this.backup = new BackupModule(this.client);
    this.parameters = new ParameterModule(this.client);
  }

  /**
   * 发现并列出所有可用的阿里云凭证
   * @returns {Promise<Array>} 凭证列表
   */
  async discoverCredentials() {
    const manager = new CredentialManager();
    return await manager.discoverCredentials(this.config);
  }

  /**
   * 获取当前凭证信息
   * @returns {Promise<Object>} 凭证信息
   */
  async getCredentialInfo() {
    await this.client.initCredential();
    return this.client.getCredentialInfo();
  }

  /**
   * 手动选择凭证（当有多个时）
   * @param {string} profileName 凭证名称或 profile 名
   * @returns {Promise<Object>} 选中的凭证
   */
  async selectCredential(profileName) {
    const manager = new CredentialManager();
    const sources = await manager.discoverCredentials(this.config);
    
    if (!profileName) {
      // 返回列表让用户选择
      return {
        requiresSelection: true,
        sources: sources,
        formattedList: manager.formatCredentialList(sources)
      };
    }

    // 根据名称查找
    const selected = sources.find(
      s => s.name.includes(profileName) || s.profile === profileName
    );

    if (!selected) {
      throw new Error(`未找到名为 "${profileName}" 的凭证。可用凭证：${sources.map(s => s.name).join(', ')}`);
    }

    // 设置到 client
    this.client.credential = selected;
    this.client.accessKeyId = selected.accessKeyId;
    this.client.accessKeySecret = selected.accessKeySecret;
    this.client.regionId = selected.regionId;

    return {
      selected: true,
      credential: selected
    };
  }
}

module.exports = RDSDatabaseOperation;
