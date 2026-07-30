/**
 * ADB MySQL 数据库操作 Skill - 主入口
 * 使用阿里云 V1 签名机制 (HMAC-SHA1)
 * 
 * 提供 AnalyticDB MySQL 版的完整管理能力
 * 支持两种版本：
 * - 数仓版（2019-03-15）：Cluster 系列
 * - 湖仓版（2021-12-01）：湖仓版系列
 * 
 * 包含：集群管理、资源组管理、数据库管理、网络管理、
 *       账号管理、安全管理、备份恢复、监控管理、
 *       SQL 诊断、空间分析等 10 大模块
 */

const crypto = require('crypto');
const https = require('https');
const CredentialManager = require('./credential-manager');

// API 配置
const API_ENDPOINT = 'adb.aliyuncs.com';
const API_VERSION_WAREHOUSE = '2019-03-15';  // 数仓版
const API_VERSION_LAKEHOUSE = '2021-12-01';  // 湖仓版

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
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * 获取签名随机数
 */
function getSignatureNonce() {
  return crypto.randomUUID();
}

/**
 * 计算 V1 签名
 */
function calculateSignature(params, accessKeySecret, method = 'POST') {
  const sortedKeys = Object.keys(params).sort();
  const canonicalizedQueryString = sortedKeys
    .map(key => `${percentEncode(key)}=${percentEncode(String(params[key]))}`)
    .join('&');
  const stringToSign = `${method}&${percentEncode('/')}&${percentEncode(canonicalizedQueryString)}`;
  const key = `${accessKeySecret}&`;
  return crypto.createHmac('sha1', key).update(stringToSign, 'utf8').digest('base64');
}

/**
 * ADB API 客户端类
 */
class ADBClient {
  constructor(config = {}) {
    this.credentialManager = new CredentialManager();
    this.config = config;
    this.credential = null;
    
    // 支持多种环境变量命名
    const envVarNames = {
      accessKeyId: ['ALIBABA_CLOUD_ACCESS_KEY_ID', 'ALIBABA_ACCESS_KEY_ID', 'ACCESS_KEY_ID'],
      accessKeySecret: ['ALIBABA_CLOUD_ACCESS_KEY_SECRET', 'ALIBABA_ACCESS_KEY_SECRET', 'ACCESS_KEY_SECRET'],
      regionId: ['ALIBABA_CLOUD_REGION_ID', 'ALIBABA_REGION_ID', 'REGION_ID']
    };
    
    this.accessKeyId = config.accessKeyId || this._getEnvVar(envVarNames.accessKeyId);
    this.accessKeySecret = config.accessKeySecret || this._getEnvVar(envVarNames.accessKeySecret);
    this.regionId = config.regionId || this._getEnvVar(envVarNames.regionId) || 'cn-hangzhou';
    
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

  _getEnvVar(names) {
    for (const name of names) {
      if (process.env[name]) return process.env[name];
    }
    return undefined;
  }

  async initCredential() {
    if (this.credential) return this.credential;

    const sources = await this.credentialManager.discoverCredentials(this.config);
    
    if (sources.length === 0) {
      throw new Error(
        'AccessKey 配置缺失。请通过以下方式之一配置：\n' +
        '1. 传入 config 对象\n' +
        '2. 设置环境变量\n' +
        '3. 配置 aliyun-cli\n' +
        '4. 创建凭证文件'
      );
    }
    
    const result = await this.credentialManager.selectCredential(sources, {
      autoSelect: this.config.autoSelect !== false
    });

    if (result.requiresUserSelection) {
      const list = this.credentialManager.formatCredentialList(result.allSources);
      throw new Error(`发现多套阿里云凭证，请指定使用哪一套：\n\n${list}`);
    }

    this.credential = result.selected;
    this.accessKeyId = result.selected.accessKeyId;
    this.accessKeySecret = result.selected.accessKeySecret;
    this.regionId = result.selected.regionId || this.regionId;
    
    return this.credential;
  }

  getCredentialInfo() {
    if (!this.credential) return null;
    const maskId = this.credential.accessKeyId.replace(/^(.{6}).*(.{4})$/, '$1****$2');
    return {
      name: this.credential.name,
      accessKeyId: maskId,
      regionId: this.regionId,
      source: this.credential.source
    };
  }

  async callAPI(action, params = {}, unwrap = true, apiVersion = API_VERSION_WAREHOUSE) {
    if (!this.credential) await this.initCredential();

    const timestamp = getTimestamp();
    const nonce = getSignatureNonce();
    
    const commonParams = {
      Format: 'JSON',
      Version: apiVersion,
      AccessKeyId: this.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      Timestamp: timestamp,
      SignatureVersion: '1.0',
      SignatureNonce: nonce,
      RegionId: this.regionId
    };
    
    const allParams = { ...commonParams, Action: action, ...params };
    
    Object.keys(allParams).forEach(key => {
      if (allParams[key] === undefined || allParams[key] === null || allParams[key] === '') {
        delete allParams[key];
      }
    });
    
    const signature = calculateSignature(allParams, this.accessKeySecret, 'POST');
    allParams.Signature = signature;
    
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
              const error = {
                success: false,
                error: {
                  code: result.Code,
                  message: result.Message || result.ErrorMsg || 'Unknown error'
                }
              };
              resolve(unwrap ? error : result);
            } else {
              resolve(unwrap ? result : { success: true, data: result });
            }
          } catch (e) {
            resolve({ success: false, error: { code: 'ParseError', message: e.message } });
          }
        });
      });
      
      req.on('error', (e) => {
        resolve({ success: false, error: { code: 'RequestError', message: e.message } });
      });
      
      req.setTimeout(60000);
      req.write(body);
      req.end();
    });
  }
}

/**
 * 1. 集群管理模块
 */
class ClusterModule {
  constructor(client) {
    this.client = client;
  }

  async createCluster(params) {
    // ⚠️  重要：必须先选择集群版本
    if (!params.clusterType) {
      throw new Error('ClusterType is required. 请指定集群类型：warehouse（数仓版）或 lakehouse（湖仓版）');
    }
    
    const isWarehouse = params.clusterType === 'warehouse';
    const apiVersion = isWarehouse ? API_VERSION_WAREHOUSE : API_VERSION_LAKEHOUSE;
    
    // 数仓版参数校验（2019-03-15）
    if (isWarehouse) {
      if (!params.dbClusterCategory) {
        throw new Error('DBClusterCategory is required. 请指定集群系列：Cluster（预留模式）或 MixedStorage（弹性模式）');
      }
      if (!params.mode) {
        throw new Error('Mode is required. 请指定模式：Reserver（预留）或 Flexible（弹性）');
      }
      
      if (params.mode === 'Reserver') {
        if (!params.dbClusterClass) {
          throw new Error('DBClusterClass is required. 预留模式必须指定集群规格（C8 或 C32）');
        }
        if (!params.dbNodeGroupCount) {
          throw new Error('DBNodeGroupCount is required. 预留模式必须指定节点组数量（1-200）');
        }
        if (!params.dbNodeStorage) {
          throw new Error('DBNodeStorage is required. 预留模式必须指定存储容量（C8: 100-1000GB, C32: 100-8000GB）');
        }
      }
      
      return await this.client.callAPI('CreateDBCluster', {
        RegionId: params.regionId || this.client.regionId,
        DBClusterVersion: params.dbClusterVersion || '3.0',
        DBClusterCategory: params.dbClusterCategory,
        DBClusterNetworkType: 'VPC',
        PayType: params.payType || 'Postpaid',
        Mode: params.mode,
        DBClusterClass: params.dbClusterClass,
        DBNodeGroupCount: params.dbNodeGroupCount,
        DBNodeStorage: params.dbNodeStorage,
        ComputeResource: params.computeResource,
        VpcId: params.vpcId,
        VSwitchId: params.vSwitchId,
        ZoneId: params.zoneId,
        DBClusterDescription: params.description || ''
      }, true, apiVersion);
    }
    
    // 湖仓版参数校验（2021-12-01）
    if (!params.commodityCode) {
      throw new Error('CommodityCode is required. 湖仓版必须指定商品代码（ads_pre、ads_post 等）');
    }
    if (!params.executorCount) {
      throw new Error('ExecutorCount is required. 湖仓版必须指定计算节点数量');
    }
    if (!params.diskCategory) {
      throw new Error('DiskCategory is required. 湖仓版必须指定磁盘类型（cloud_effd 等）');
    }
    if (!params.diskSize) {
      throw new Error('DiskSize is required. 湖仓版必须指定磁盘大小（GB）');
    }
    
    return await this.client.callAPI('CreateDBCluster', {
      RegionId: params.regionId || this.client.regionId,
      CommodityCode: params.commodityCode,
      ExecutorCount: params.executorCount,
      DiskCategory: params.diskCategory,
      DiskSize: params.diskSize,
      PayType: params.payType || 'Postpaid',
      VpcId: params.vpcId,
      VSwitchId: params.vSwitchId,
      ZoneId: params.zoneId,
      DBClusterDescription: params.description || '',
      ClientToken: params.clientToken || require('crypto').randomUUID()
    }, true, apiVersion);
  }

  async deleteCluster(dbClusterId) {
    return await this.client.callAPI('DeleteDBCluster', {
      DBClusterId: dbClusterId
    });
  }

  async modifyCluster(params) {
    return await this.client.callAPI('ModifyDBCluster', {
      DBClusterId: params.dbClusterId,
      DBClusterClass: params.dbClusterClass,
      DBClusterCapacity: params.dbClusterCapacity
    });
  }

  async describeClusters(params = {}) {
    if (params.allRegions) {
      return await this.describeAllRegionsClusters(params);
    }
    
    return await this.client.callAPI('DescribeDBClusters', {
      RegionId: params.regionId || this.client.regionId,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  async describeAllRegionsClusters(params = {}) {
    const regions = [
      'cn-hangzhou', 'cn-shanghai', 'cn-beijing',
      'cn-shenzhen', 'cn-hongkong',
      'ap-southeast-1', 'ap-southeast-2',
      'us-west-1', 'eu-central-1'
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
        
        const count = result.TotalCount || 0;
        if (count > 0) {
          totalCount += count;
          if (result.Items && result.Items.DBCluster) {
            result.Items.DBCluster.forEach(cluster => {
              allClusters.push({ ...cluster, RegionId: region });
            });
          }
        }
      } catch (error) {
        // 跳过不支持的地域
      }
    }
    
    return {
      TotalCount: totalCount,
      PageNumber: 1,
      PageSize: 100,
      Items: { DBCluster: allClusters }
    };
  }

  async describeClusterStatus(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterStatus', {
      DBClusterId: dbClusterId
    });
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

  async modifyClusterPayType(params) {
    return await this.client.callAPI('ModifyDBClusterPayType', {
      DBClusterId: params.dbClusterId,
      PayType: params.payType,
      Period: params.period,
      PricingCycle: params.pricingCycle
    });
  }
}

/**
 * 2. 资源组管理模块
 */
class ResourceGroupModule {
  constructor(client) {
    this.client = client;
  }

  async createDBResourceGroup(params) {
    return await this.client.callAPI('CreateDBResourceGroup', {
      DBClusterId: params.dbClusterId,
      ResourceGroupName: params.resourceGroupName,
      NodeCount: params.nodeCount
    });
  }

  async deleteDBResourceGroup(dbClusterId, resourceGroupId) {
    return await this.client.callAPI('DeleteDBResourceGroup', {
      DBClusterId: dbClusterId,
      ResourceGroupId: resourceGroupId
    });
  }

  async describeDBResourceGroup(dbClusterId) {
    return await this.client.callAPI('DescribeDBResourceGroup', {
      DBClusterId: dbClusterId
    });
  }

  async modifyDBResourceGroup(params) {
    return await this.client.callAPI('ModifyDBResourceGroup', {
      DBClusterId: params.dbClusterId,
      ResourceGroupId: params.resourceGroupId,
      NodeCount: params.nodeCount
    });
  }

  async bindDBResourceGroupWithUser(params) {
    return await this.client.callAPI('BindDBResourceGroupWithUser', {
      DBClusterId: params.dbClusterId,
      ResourceGroupId: params.resourceGroupId,
      AccountName: params.accountName
    });
  }

  async unbindDBResourceGroupWithUser(params) {
    return await this.client.callAPI('UnbindDBResourceGroupWithUser', {
      DBClusterId: params.dbClusterId,
      ResourceGroupId: params.resourceGroupId,
      AccountName: params.accountName
    });
  }
}

/**
 * 3. 数据库管理模块
 */
class DatabaseModule {
  constructor(client) {
    this.client = client;
  }

  async describeSchemas(dbClusterId) {
    return await this.client.callAPI('DescribeSchemas', {
      DBClusterId: dbClusterId
    });
  }

  async describeTables(params) {
    return await this.client.callAPI('DescribeTables', {
      DBClusterId: params.dbClusterId,
      DBName: params.dbName
    });
  }

  async describeTableDetail(params) {
    return await this.client.callAPI('DescribeTableDetail', {
      DBClusterId: params.dbClusterId,
      DBName: params.dbName,
      TableName: params.tableName
    });
  }

  async describeColumns(params) {
    return await this.client.callAPI('DescribeColumns', {
      DBClusterId: params.dbClusterId,
      DBName: params.dbName,
      TableName: params.tableName
    });
  }

  async describeAllDataSource(dbClusterId) {
    return await this.client.callAPI('DescribeAllDataSource', {
      DBClusterId: dbClusterId
    });
  }

  async getCreateTableSQL(params) {
    return await this.client.callAPI('GetCreateTableSQL', {
      DBClusterId: params.dbClusterId,
      DBName: params.dbName,
      TableName: params.tableName
    });
  }
}

/**
 * 4. 网络管理模块
 */
class NetworkModule {
  constructor(client) {
    this.client = client;
  }

  async describeDBClusterNetInfo(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterNetInfo', {
      DBClusterId: dbClusterId
    });
  }

  async allocateClusterPublicConnection(dbClusterId, connectionStringPrefix) {
    return await this.client.callAPI('AllocateClusterPublicConnection', {
      DBClusterId: dbClusterId,
      ConnectionStringPrefix: connectionStringPrefix
    });
  }

  async releaseClusterPublicConnection(dbClusterId) {
    return await this.client.callAPI('ReleaseClusterPublicConnection', {
      DBClusterId: dbClusterId
    });
  }

  async modifyClusterConnectionString(params) {
    return await this.client.callAPI('ModifyClusterConnectionString', {
      DBClusterId: params.dbClusterId,
      ConnectionString: params.connectionString,
      ConnectionStringPrefix: params.connectionStringPrefix
    });
  }

  async describeVpcs(regionId) {
    return await this.client.callAPI('DescribeVpcs', {
      RegionId: regionId || this.client.regionId
    });
  }

  async describeVSwitches(params) {
    return await this.client.callAPI('DescribeVSwitches', {
      RegionId: params.regionId || this.client.regionId,
      VpcId: params.vpcId,
      ZoneId: params.zoneId
    });
  }
}

/**
 * 5. 账号管理模块
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
      AccountType: params.accountType || 'Normal',
      AccountDescription: params.description || ''
    });
  }

  async deleteAccount(params) {
    return await this.client.callAPI('DeleteAccount', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName
    });
  }

  async describeAccounts(params) {
    return await this.client.callAPI('DescribeAccounts', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName
    });
  }

  async describeAllAccounts(params) {
    return await this.client.callAPI('DescribeAllAccounts', {
      DBClusterId: params.dbClusterId,
      DBName: params.dbName
    });
  }

  async resetAccountPassword(params) {
    return await this.client.callAPI('ResetAccountPassword', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName,
      AccountPassword: params.accountPassword
    });
  }

  async modifyAccountDescription(params) {
    return await this.client.callAPI('ModifyAccountDescription', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName,
      AccountDescription: params.description
    });
  }
}

/**
 * 6. 安全管理模块
 */
class SecurityModule {
  constructor(client) {
    this.client = client;
  }

  async modifyDBClusterAccessWhiteList(params) {
    const securityIps = params.securityIps || '127.0.0.1';
    if (securityIps.includes('0.0.0.0/0')) {
      console.warn('⚠️  安全警告：当前设置允许所有 IP 访问 (0.0.0.0/0)，建议设置具体的 IP 白名单以提高安全性');
    }
    
    return await this.client.callAPI('ModifyDBClusterAccessWhiteList', {
      DBClusterId: params.dbClusterId,
      SecurityIps: securityIps,
      DbClusterAccessWhiteListGroupName: params.groupName || 'default'
    });
  }

  async describeDBClusterAccessWhiteList(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterAccessWhiteList', {
      DBClusterId: dbClusterId
    });
  }

  async describeDBClusterSSL(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterSSL', {
      DBClusterId: dbClusterId
    });
  }

  async modifyDBClusterSSL(params) {
    return await this.client.callAPI('ModifyDBClusterSSL', {
      DBClusterId: params.dbClusterId,
      SSLStatus: params.sslStatus
    });
  }

  /**
   * 查询湖仓版集群白名单（2021-12-01）
   */
  async describeClusterAccessWhiteList(dbClusterId) {
    return await this.client.callAPI('DescribeClusterAccessWhiteList', {
      DBClusterId: dbClusterId
    }, true, API_VERSION_LAKEHOUSE);
  }

  /**
   * 修改湖仓版集群白名单（2021-12-01）
   */
  async modifyClusterAccessWhiteList(params) {
    const securityIps = params.securityIps || '127.0.0.1';
    if (securityIps.includes('0.0.0.0/0')) {
      console.warn('⚠️  安全警告：当前设置允许所有 IP 访问 (0.0.0.0/0)，建议设置具体的 IP 白名单以提高安全性');
    }
    
    return await this.client.callAPI('ModifyClusterAccessWhiteList', {
      DBClusterId: params.dbClusterId,
      SecurityIps: securityIps,
      DbClusterAccessWhiteListGroupName: params.groupName || 'default'
    }, true, API_VERSION_LAKEHOUSE);
  }

  /**
   * 湖仓版网络管理（2021-12-01）
   */
  async describeClusterNetInfo(dbClusterId) {
    return await this.client.callAPI('DescribeClusterNetInfo', {
      DBClusterId: dbClusterId
    }, true, API_VERSION_LAKEHOUSE);
  }

  async allocateClusterPublicConnection(dbClusterId, connectionStringPrefix) {
    return await this.client.callAPI('AllocateClusterPublicConnection', {
      DBClusterId: dbClusterId,
      ConnectionStringPrefix: connectionStringPrefix
    }, true, API_VERSION_LAKEHOUSE);
  }

  async releaseClusterPublicConnection(dbClusterId) {
    return await this.client.callAPI('ReleaseClusterPublicConnection', {
      DBClusterId: dbClusterId
    }, true, API_VERSION_LAKEHOUSE);
  }

  /**
   * 湖仓版账号管理（2021-12-01）
   */
  async createAccount(params) {
    return await this.client.callAPI('CreateAccount', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName,
      AccountPassword: params.accountPassword,
      AccountType: params.accountType || 'Normal',
      AccountDescription: params.description || ''
    }, true, API_VERSION_LAKEHOUSE);
  }

  async deleteAccount(params) {
    return await this.client.callAPI('DeleteAccount', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName
    }, true, API_VERSION_LAKEHOUSE);
  }

  async describeAccounts(params) {
    return await this.client.callAPI('DescribeAccounts', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName
    }, true, API_VERSION_LAKEHOUSE);
  }

  async resetAccountPassword(params) {
    return await this.client.callAPI('ResetAccountPassword', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName,
      AccountPassword: params.accountPassword
    }, true, API_VERSION_LAKEHOUSE);
  }

  async modifyAccountDescription(params) {
    return await this.client.callAPI('ModifyAccountDescription', {
      DBClusterId: params.dbClusterId,
      AccountName: params.accountName,
      AccountDescription: params.description
    }, true, API_VERSION_LAKEHOUSE);
  }

  /**
   * 湖仓版备份管理（2021-12-01）
   */
  async createBackup(params) {
    return await this.client.callAPI('CreateBackup', {
      DBClusterId: params.dbClusterId
    }, true, API_VERSION_LAKEHOUSE);
  }

  async describeBackupPolicy(dbClusterId) {
    return await this.client.callAPI('DescribeBackupPolicy', {
      DBClusterId: dbClusterId
    }, true, API_VERSION_LAKEHOUSE);
  }

  async modifyBackupPolicy(params) {
    return await this.client.callAPI('ModifyBackupPolicy', {
      DBClusterId: params.dbClusterId,
      PreferredBackupPeriod: params.preferredBackupPeriod,
      PreferredBackupTime: params.preferredBackupTime,
      BackupRetentionPeriod: params.backupRetentionPeriod
    }, true, API_VERSION_LAKEHOUSE);
  }

  async describeBackups(params) {
    return await this.client.callAPI('DescribeBackups', {
      DBClusterId: params.dbClusterId,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    }, true, API_VERSION_LAKEHOUSE);
  }

  async deleteBackups(params) {
    return await this.client.callAPI('DeleteBackups', {
      DBClusterId: params.dbClusterId,
      BackupId: params.backupId
    }, true, API_VERSION_LAKEHOUSE);
  }
}

/**
 * 7. 备份恢复模块
 */
class BackupModule {
  constructor(client) {
    this.client = client;
  }

  async describeBackupPolicy(dbClusterId) {
    return await this.client.callAPI('DescribeBackupPolicy', {
      DBClusterId: dbClusterId
    });
  }

  async modifyBackupPolicy(params) {
    return await this.client.callAPI('ModifyBackupPolicy', {
      DBClusterId: params.dbClusterId,
      PreferredBackupPeriod: params.preferredBackupPeriod,
      PreferredBackupTime: params.preferredBackupTime,
      BackupRetentionPeriod: params.backupRetentionPeriod
    });
  }

  async describeBackups(params) {
    return await this.client.callAPI('DescribeBackups', {
      DBClusterId: params.dbClusterId,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  async deleteBackups(params) {
    return await this.client.callAPI('DeleteBackups', {
      DBClusterId: params.dbClusterId,
      BackupId: params.backupId
    });
  }
}

/**
 * 8. 监控管理模块
 */
class MonitorModule {
  constructor(client) {
    this.client = client;
  }

  async describeDBClusterPerformance(params) {
    return await this.client.callAPI('DescribeDBClusterPerformance', {
      DBClusterId: params.dbClusterId,
      Key: params.key,
      StartTime: params.startTime,
      EndTime: params.endTime
    });
  }

  async describeDBClusterHealthStatus(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterHealthStatus', {
      DBClusterId: dbClusterId
    });
  }

  async describeInclinedTables(params) {
    return await this.client.callAPI('DescribeInclinedTables', {
      DBClusterId: params.dbClusterId,
      StartTime: params.startTime,
      EndTime: params.endTime
    });
  }

  async describeDBClusterSpaceSummary(dbClusterId) {
    return await this.client.callAPI('DescribeDBClusterSpaceSummary', {
      DBClusterId: dbClusterId
    });
  }
}

/**
 * 9. SQL 诊断模块
 */
class DiagnosisModule {
  constructor(client) {
    this.client = client;
  }

  async describeDiagnosisRecords(params) {
    return await this.client.callAPI('DescribeDiagnosisRecords', {
      DBClusterId: params.dbClusterId,
      StartTime: params.startTime,
      EndTime: params.endTime
    });
  }

  async describeDiagnosisSQLInfo(params) {
    return await this.client.callAPI('DescribeDiagnosisSQLInfo', {
      DBClusterId: params.dbClusterId,
      QueryId: params.queryId
    });
  }

  async describeSlowLogRecords(params) {
    return await this.client.callAPI('DescribeSlowLogRecords', {
      DBClusterId: params.dbClusterId,
      StartTime: params.startTime,
      EndTime: params.endTime,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 30
    });
  }

  async describeProcessList(dbClusterId) {
    return await this.client.callAPI('DescribeProcessList', {
      DBClusterId: dbClusterId
    });
  }

  async killProcess(params) {
    return await this.client.callAPI('KillProcess', {
      DBClusterId: params.dbClusterId,
      NodeId: params.nodeId,
      QueryId: params.queryId
    });
  }
}

/**
 * 10. 空间分析模块
 */
class SpaceAnalysisModule {
  constructor(client) {
    this.client = client;
  }

  async describeTableStatistics(params) {
    return await this.client.callAPI('DescribeTableStatistics', {
      DBClusterId: params.dbClusterId,
      DBName: params.dbName
    });
  }

  async describeExcessivePrimaryKeys(dbClusterId) {
    return await this.client.callAPI('DescribeExcessivePrimaryKeys', {
      DBClusterId: dbClusterId
    });
  }

  async describeOversizeNonPartitionTableInfos(dbClusterId) {
    return await this.client.callAPI('DescribeOversizeNonPartitionTableInfos', {
      DBClusterId: dbClusterId
    });
  }

  async describeTableAccessCount(params) {
    return await this.client.callAPI('DescribeTableAccessCount', {
      DBClusterId: params.dbClusterId,
      DBName: params.dbName,
      StartTime: params.startTime,
      EndTime: params.endTime
    });
  }
}

/**
 * 地域管理模块
 */
class RegionModule {
  constructor(client) {
    this.client = client;
  }

  async describeRegions() {
    return await this.client.callAPI('DescribeRegions');
  }
}

/**
 * 主导出类
 */
class ADBMySQLDatabaseOperation {
  constructor(config = {}) {
    this.config = config;
    this.client = new ADBClient(config);
    this.clusters = new ClusterModule(this.client);
    this.resourceGroups = new ResourceGroupModule(this.client);
    this.databases = new DatabaseModule(this.client);
    this.network = new NetworkModule(this.client);
    this.accounts = new AccountModule(this.client);
    this.security = new SecurityModule(this.client);
    this.backup = new BackupModule(this.client);
    this.monitor = new MonitorModule(this.client);
    this.diagnosis = new DiagnosisModule(this.client);
    this.spaceAnalysis = new SpaceAnalysisModule(this.client);
    this.regions = new RegionModule(this.client);
  }

  async discoverCredentials() {
    const manager = new CredentialManager();
    return await manager.discoverCredentials(this.config);
  }

  async getCredentialInfo() {
    await this.client.initCredential();
    return this.client.getCredentialInfo();
  }

  async selectCredential(profileName) {
    const manager = new CredentialManager();
    const sources = await manager.discoverCredentials(this.config);
    
    if (!profileName) {
      return {
        requiresSelection: true,
        sources: sources,
        formattedList: manager.formatCredentialList(sources)
      };
    }

    const selected = sources.find(
      s => s.name.includes(profileName) || s.profile === profileName
    );

    if (!selected) {
      throw new Error(`未找到名为 "${profileName}" 的凭证`);
    }

    this.client.credential = selected;
    this.client.accessKeyId = selected.accessKeyId;
    this.client.accessKeySecret = selected.accessKeySecret;
    this.client.regionId = selected.regionId;

    return { selected: true, credential: selected };
  }
}

module.exports = ADBMySQLDatabaseOperation;
