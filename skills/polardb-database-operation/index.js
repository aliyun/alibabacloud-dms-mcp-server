/**
 * PolarDB 数据库操作 Skill - 主入口
 * 使用阿里云 V1 签名机制 (HMAC-SHA1)
 * 
 * 提供 PolarDB 7 大章节的 API 能力封装
 */

const crypto = require('crypto');
const https = require('https');
const CredentialManager = require('./credential-manager');

// API 配置
const API_ENDPOINT = 'polardb.aliyuncs.com';
const API_VERSION = '2017-08-01';

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
  const signature = crypto
    .createHmac('sha1', key)
    .update(stringToSign, 'utf8')
    .digest('base64');
  return signature;
}

/**
 * PolarDB API 客户端类
 */
class PolarDBClient {
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
   * 调用 API (V1 签名)
   */
  async callAPI(action, params = {}, unwrap = true) {
    // 确保凭证已初始化
    if (!this.credential) {
      await this.initCredential();
    }
    const timestamp = getTimestamp();
    const nonce = getSignatureNonce();
    
    // 构建公共参数
    const commonParams = {
      Format: 'JSON',
      Version: API_VERSION,
      AccessKeyId: this.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      Timestamp: timestamp,
      SignatureVersion: '1.0',
      SignatureNonce: nonce,
      RegionId: this.regionId
    };
    
    // 合并参数
    const allParams = { ...commonParams, Action: action, ...params };
    
    // 移除空值参数
    Object.keys(allParams).forEach(key => {
      if (allParams[key] === undefined || allParams[key] === null || allParams[key] === '') {
        delete allParams[key];
      }
    });
    
    // 计算签名
    const signature = calculateSignature(allParams, this.accessKeySecret, 'POST');
    allParams.Signature = signature;
    
    // 构建请求 body（POST 请求）
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
 * 集群管理模块
 */
class ClusterModule {
  constructor(client) {
    this.client = client;
  }

  async createCluster(params) {
    // 参数校验
    if (!params.dbNodeClass) {
      throw new Error('DBNodeClass is required. Please specify the node specification (e.g., "polar.mysql.x4.medium")');
    }
    
    // 安全提醒
    if (!params.vpcId || !params.vSwitchId) {
      console.warn('⚠️  安全警告：建议指定 VPC 和交换机以增强网络安全性');
    }
    
    const result = await this.client.callAPI('CreateDBCluster', {
      DBType: params.dbType || 'MySQL',
      DBVersion: params.dbVersion || '8.0',
      PayType: params.payType || 'Postpaid',
      DBNodeClass: params.dbNodeClass,
      DBNodes: params.dbNodes || 2,
      VPCId: params.vpcId,
      VSwitchId: params.vSwitchId,
      ZoneId: params.zoneId,
      DBClusterDescription: params.description || ''
    });
    
    // ⚠️  重要提醒：实例创建是异步的
    if (result.DBClusterId) {
      console.warn('\n⚠️  重要提醒:');
      console.warn('   - PolarDB 集群创建是异步操作，集群状态为 Creating');
      console.warn('   - 需要等待 5-10 分钟集群状态变为 Running');
      console.warn('   - 请使用 describeCluster() 查询集群状态');
      console.warn('   - 不要立即重试创建，避免创建多个集群\n');
    }
    
    return result;
  }

  async deleteCluster(dbClusterId) {
    return await this.client.callAPI('DeleteDBCluster', {
      DBClusterId: dbClusterId
    });
  }

  /**
   * 获取 PolarDB 集群列表
   * @param {Object} params - 查询参数
   * @param {String} params.regionId - 地域 ID（可选，不传则查询所有地域）
   * @param {Boolean} params.allRegions - 是否查询所有地域（默认 false）
   */
  async describeClusters(params = {}) {
    // 如果指定了 allRegions=true，查询所有地域
    if (params.allRegions) {
      return await this.describeAllRegionsClusters(params);
    }
    
    // 否则查询指定地域
    return await this.client.callAPI('DescribeDBClusters', {
      RegionId: params.regionId || this.client.regionId,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  /**
   * 查询所有地域的 PolarDB 集群
   * @param {Object} params - 查询参数
   */
  async describeAllRegionsClusters(params = {}) {
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
    
    const allClusters = [];
    let totalCount = 0;
    
    for (const region of regions) {
      try {
        const result = await this.client.callAPI('DescribeDBClusters', {
          RegionId: region,
          PageNumber: 1,
          PageSize: 100
        });
        
        const count = result.TotalRecordCount || 0;
        if (count > 0) {
          totalCount += count;
          if (result.Items && result.Items.DBCluster) {
            result.Items.DBCluster.forEach(cluster => {
              allClusters.push({
                ...cluster,
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
        DBCluster: allClusters
      }
    };
  }

  async describeClusterAttribute(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterAttribute', {
      DBClusterId: dbClusterId
    });
  }

  async modifyClusterDescription(dbClusterId, description) {
    return await this.client.callAPI('ModifyDBClusterDescription', {
      DBClusterId: dbClusterId,
      DBClusterDescription: description
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
    return await this.client.callAPI('CreateAccount', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName,
      AccountPassword: params.accountPassword,
      AccountDescription: params.description || '',
      AccountType: params.accountType || 'Normal'
    });
  }

  async deleteAccount(dbClusterId, accountName) {
    return await this.client.callAPI('DeleteAccount', {
      DBClusterId: dbClusterId,
      AccountName: accountName
    });
  }

  async describeAccounts(dbClusterId, accountName) {
    return await this.client.callAPI('DescribeAccounts', {
      DBClusterId: dbClusterId,
      AccountName: accountName
    });
  }

  async modifyAccountPassword(dbClusterId, accountName, newPassword) {
    return await this.client.callAPI('ModifyAccountPassword', {
      DBClusterId: dbClusterId,
      AccountName: accountName,
      AccountPassword: newPassword
    });
  }

  async grantAccountPrivilege(dbClusterId, accountName, dbName, privilege) {
    return await this.client.callAPI('GrantAccountPrivilege', {
      DBClusterId: dbClusterId,
      AccountName: accountName,
      DBName: dbName,
      AccountPrivilege: privilege
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
    return await this.client.callAPI('CreateDatabase', {
      DBClusterId: params.dbClusterId,
      DBName: params.dbName,
      CharacterSetName: params.characterSetName || 'utf8mb4',
      Description: params.description || ''
    });
  }

  async deleteDatabase(dbClusterId, dbName) {
    return await this.client.callAPI('DeleteDatabase', {
      DBClusterId: dbClusterId,
      DBName: dbName
    });
  }

  async describeDatabases(dbClusterId, dbName) {
    return await this.client.callAPI('DescribeDatabases', {
      DBClusterId: dbClusterId,
      DBName: dbName
    });
  }

  async modifyDatabaseDescription(dbClusterId, dbName, description) {
    return await this.client.callAPI('ModifyDBDescription', {
      DBClusterId: dbClusterId,
      DBName: dbName,
      DBDescription: description
    });
  }
}

/**
 * 白名单管理模块
 */
class WhitelistModule {
  constructor(client) {
    this.client = client;
  }

  async describeWhitelist(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterAccessWhitelist', {
      DBClusterId: dbClusterId
    });
  }

  async modifyWhitelist(params) {
    return await this.client.callAPI('ModifyDBClusterAccessWhitelist', {
      DBClusterId: params.dbClusterId,
      ModifyMode: params.modifyMode || 'Append',
      SecurityIps: params.securityIps,
      SecurityGroupId: params.securityGroupId
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
      DBClusterId: params.dbClusterId,
      BackupType: params.backupType || 'Snapshot',
      BackupName: params.backupName
    });
  }

  async deleteBackup(dbClusterId, backupId) {
    return await this.client.callAPI('DeleteBackup', {
      DBClusterId: dbClusterId,
      BackupId: backupId
    });
  }

  async describeBackups(params) {
    // 修复：添加必需的时间参数，使用ISO格式
    const now = new Date();
    const startTime = params.startTime || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endTime = params.endTime || now;

    return await this.client.callAPI('DescribeBackups', {
      DBClusterId: params.dbClusterId,
      StartTime: startTime.toISOString(),
      EndTime: endTime.toISOString(),
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  async describeBackupPolicy(dbClusterId) {
    return await this.client.callAPI('DescribeBackupPolicy', {
      DBClusterId: dbClusterId
    });
  }
}

/**
 * 访问地址管理模块
 */
class EndpointModule {
  constructor(client) {
    this.client = client;
  }

  async describeEndpoints(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterEndpoints', {
      DBClusterId: dbClusterId
    });
  }

  async createPublicConnection(dbClusterId, connectionPrefix) {
    // 先查询 DBEndpointId
    const endpoints = await this.client.callAPI('DescribeDBClusterEndpoints', {
      DBClusterId: dbClusterId
    });

    let dbEndpointId = null;
    // 修复：直接访问Items，不需要.data
    if (endpoints.Items && endpoints.Items.length > 0) {
      dbEndpointId = endpoints.Items[0].DBEndpointId;
    } else {
      return { success: false, error: { code: 'EndpointNotFound', message: '未找到集群地址，无法创建公网连接' } };
    }

    return await this.client.callAPI('CreateDBEndpointAddress', {
      DBClusterId: dbClusterId,
      DBEndpointId: dbEndpointId,
      ConnectionStringPrefix: connectionPrefix,
      NetType: 'Public'
    });
  }

  async deletePublicConnection(dbClusterId, connectionString) {
    // 先查询 DBEndpointId
    const endpoints = await this.client.callAPI('DescribeDBClusterEndpoints', {
      DBClusterId: dbClusterId
    });

    let dbEndpointId = null;
    // 修复：直接访问Items，不需要.data
    if (endpoints.Items && endpoints.Items.length > 0) {
      dbEndpointId = endpoints.Items[0].DBEndpointId;
    } else {
      return { success: false, error: { code: 'EndpointNotFound', message: '未找到集群地址，无法删除公网连接' } };
    }

    return await this.client.callAPI('DeleteDBEndpointAddress', {
      DBClusterId: dbClusterId,
      DBEndpointId: dbEndpointId,
      ConnectionString: connectionString
    });
  }
}

/**
 * 连接诊断模块
 */
class ConnectionModule {
  constructor(client) {
    this.client = client;
  }

  async describeClusterConnectivity(dbClusterId, sourceIp) {
    // 修复：参数名应为SourceIpAddress
    return await this.client.callAPI('DescribeDBClusterConnectivity', {
      DBClusterId: dbClusterId,
      SourceIpAddress: sourceIp
    });
  }

  async describeClusterSSL(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterSSL', {
      DBClusterId: dbClusterId
    });
  }

  async modifyClusterSSL(dbClusterId, sslStatus) {
    return await this.client.callAPI('ModifyDBClusterSSL', {
      DBClusterId: dbClusterId,
      SSLAction: sslStatus ? 'Open' : 'Close'
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
   * 查询集群参数
   * @param {string} dbClusterId - 集群 ID
   * @param {object} params - 可选参数
   * @returns {Promise<object>} 参数列表
   */
  async describeDBClusterConfig(dbClusterId, params = {}) {
    // 修复：使用正确的API名称 DescribeDBClusterParameters
    return await this.client.callAPI('DescribeDBClusterParameters', {
      DBClusterId: dbClusterId
    });
  }

  /**
   * 修改集群参数
   * @param {object} params - 参数
   * @param {string} params.dbClusterId - 集群 ID
   * @param {Array} params.parameters - 参数数组 [{name, value}]
   * @param {string} params.forceRestart - 是否强制重启（可选）
   * @returns {Promise<object>} 修改结果
   */
  async modifyDBClusterConfig(params) {
    // 参数数组格式转换：[{name, value}] => '{"parameters":[{"name":"max_connections","value":"2000"}]}'
    const parametersJson = JSON.stringify({
      parameters: params.parameters.map(p => ({
        ParameterName: p.name,
        ParameterValue: p.value
      }))
    });

    return await this.client.callAPI('ModifyDBClusterConfig', {
      DBClusterId: params.dbClusterId,
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
      DBType: params.dbType,
      DBVersion: params.dbVersion,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  /**
   * 创建参数模板
   * @param {object} params - 参数
   * @param {string} params.parameterGroupName - 模板名称
   * @param {string} params.dbType - 数据库类型（MySQL/PostgreSQL/Oracle）
   * @param {string} params.dbVersion - 数据库版本
   * @param {Array} params.parameters - 参数数组（可选）[{name, value}]
   * @param {string} params.description - 描述（可选）
   * @returns {Promise<object>} 创建结果
   */
  async createParameterGroup(params) {
    const requestParams = {
      ParameterGroupName: params.parameterGroupName,
      DBType: params.dbType,
      DBVersion: params.dbVersion,
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
   * 应用参数模板到集群
   * @param {object} params - 参数
   * @param {string} params.parameterGroupId - 模板 ID
   * @param {string} params.dbClusterId - 集群 ID
   * @returns {Promise<object>} 应用结果
   */
  async applyParameterGroup(params) {
    return await this.client.callAPI('ApplyParameterGroup', {
      ParameterGroupId: params.parameterGroupId,
      DBClusterId: params.dbClusterId
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
class PolarDBDatabaseOperation {
  constructor(config) {
    if (!config?.accessKeyId && !process.env.ALIBABA_CLOUD_ACCESS_KEY_ID) {
      throw new Error('AccessKey 配置缺失');
    }

    this.client = new PolarDBClient(config);
    this.clusters = new ClusterModule(this.client);
    this.accounts = new AccountModule(this.client);
    this.databases = new DatabaseModule(this.client);
    this.whitelist = new WhitelistModule(this.client);
    this.backup = new BackupModule(this.client);
    this.endpoints = new EndpointModule(this.client);
    this.connection = new ConnectionModule(this.client);
    this.parameters = new ParameterModule(this.client);
  }
}

module.exports = PolarDBDatabaseOperation;
