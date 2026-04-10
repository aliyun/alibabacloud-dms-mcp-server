/**
 * Lindorm 数据库操作 Skill - 主入口
 * 使用阿里云 V1 签名机制 (HMAC-SHA1)
 * 
 * 提供 Lindorm 实例管理、白名单管理、标签管理等 API 能力
 */

const crypto = require('crypto');
const https = require('https');
const CredentialManager = require('./credential-manager');

// API 配置
const API_ENDPOINT = 'hitsdb.aliyuncs.com';
const API_VERSION = '2020-06-15';

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
 * Lindorm API 客户端类
 */
class LindormClient {
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
    
    // 移除空值参数（但保留 EngineList 等 JSON 数组参数）
    Object.keys(allParams).forEach(key => {
      const value = allParams[key];
      // 保留 JSON 数组字符串（如 EngineList）
      if (key === 'EngineList' && typeof value === 'string') {
        return; // 不删除
      }
      if (value === undefined || value === null || value === '') {
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
            const error = {
              success: false,
              error: {
                code: 'ParseError',
                message: `JSON parse error: ${e.message}`
              }
            };
            resolve(unwrap ? error : error.error);
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

  /**
   * 创建 Lindorm 实例
   * 注意：API 参数名使用 PascalCase（首字母大写）
   * 
   * 关键参数要求：
   * 1. LindormNum 至少为 2（总核心数必须 >= 2）
   * 2. InstanceStorage 是必填参数（最小 480GB）
   * 3. VPC 和交换机必须匹配可用区
   * 4. 使用正确的参数名：LindormSpec（不是 CoreSpec）
   * 
   * ⚠️  重要：创建实例是异步操作，需要等待实例状态变为 Running 后再进行下一步操作
   * 不要立即重试创建，应该先查询实例状态
   */
  async createInstance(params) {
    // 参数校验
    if (!params.zoneId) {
      throw new Error('ZoneId is required. 请指定可用区');
    }
    if (!params.vpcId || !params.vSwitchId) {
      throw new Error('VPCId and VSwitchId are required. Lindorm 必须指定 VPC 和交换机');
    }
    if (!params.instanceStorage) {
      throw new Error('InstanceStorage is required. 请指定实例存储空间（最小 480GB）');
    }
    
    // LindormNum 至少为 2
    const lindormNum = params.lindormNum || 2;
    if (lindormNum < 2) {
      throw new Error('LindormNum must be >= 2. 宽表引擎节点数至少为 2');
    }
    
    const result = await this.client.callAPI('CreateLindormInstance', {
      ZoneId: params.zoneId,
      VPCId: params.vpcId,
      VSwitchId: params.vSwitchId,
      LindormType: params.lindormType || 'lindorm',
      LindormSpec: params.lindormSpec || 'lindorm.c.xlarge',  // ✅ 正确的参数名
      LindormNum: lindormNum,
      InstanceStorage: params.instanceStorage,
      DiskCategory: params.diskCategory || 'cloud_efficiency',  // ✅ 使用 DiskCategory
      PayType: params.payType || 'POSTPAY',  // ✅ 使用 POSTPAY
      Period: params.period,
      PricingCycle: params.pricingCycle,
      InstanceName: params.instanceName || '',
      Description: params.description || '',
      CouponCode: params.couponCode,
      AutoRenew: params.autoRenew || 'false',
      AutoRenewPeriod: params.autoRenewPeriod || 1
    });
    
    // ⚠️  重要提醒：实例创建是异步的，需要等待状态变为 Running
    if (result.InstanceId) {
      console.warn('\n⚠️  重要提醒:');
      console.warn('   - 实例创建是异步操作，实例状态为 Creating');
      console.warn('   - 需要等待 3-5 分钟实例状态变为 Running');
      console.warn('   - 请使用 describeInstance() 查询实例状态');
      console.warn('   - 不要立即重试创建，避免创建多个实例\n');
    }
    
    return result;
  }

  /**
   * 创建 Lindorm V2 实例（新架构）
   * 注意：必须指定 EngineList 参数
   */
  async createV2Instance(params) {
    // 参数校验
    if (!params.zoneId) {
      throw new Error('ZoneId is required. 请指定可用区');
    }
    if (!params.seriesCode) {
      throw new Error('SeriesCode is required. 请指定实例系列');
    }
    if (!params.engineList || !Array.isArray(params.engineList)) {
      throw new Error('EngineList is required. 请指定引擎列表，例如：["hbase","mysql"]');
    }
    
    return await this.client.callAPI('CreateLindormV2Instance', {
      ZoneId: params.zoneId,
      VPCId: params.vpcId,
      VSwitchId: params.vSwitchId,
      SeriesCode: params.seriesCode,
      CoreSpec: params.coreSpec,
      CoreDiskSize: params.coreDiskSize,
      CoreNumber: params.coreNumber || 2,
      StorageSpec: params.storageSpec,
      StorageNumber: params.storageNumber,
      LogSpec: params.logSpec,
      LogNumber: params.logNumber,
      TsdbSpec: params.tsdbSpec,
      TsdbNumber: params.tsdbNumber,
      LtsSpec: params.ltsSpec,
      LtsNumber: params.ltsNumber,
      FilestoreSpec: params.filestoreSpec,
      FilestoreNumber: params.filestoreNumber,
      SearchSpec: params.searchSpec,
      SearchNumber: params.searchNumber,
      PayType: params.payType || 'Postpaid',
      Period: params.period,
      PricingCycle: params.pricingCycle,
      InstanceName: params.instanceName || '',
      Description: params.description || '',
      CouponCode: params.couponCode,
      AutoRenew: params.autoRenew || 'false',
      AutoRenewPeriod: params.autoRenewPeriod || 1,
      EngineList: JSON.stringify(params.engineList)
    });
  }

  /**
   * 释放 Lindorm 实例
   */
  async releaseInstance(instanceId) {
    if (!instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('ReleaseLindormInstance', {
      InstanceId: instanceId
    });
  }

  /**
   * 释放 Lindorm V2 实例
   */
  async releaseV2Instance(instanceId) {
    if (!instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('ReleaseLindormV2Instance', {
      InstanceId: instanceId
    });
  }

  /**
   * 获取 Lindorm 实例列表
   * @param {Object} params - 查询参数
   * @param {String} params.regionId - 地域 ID（可选，不传则查询所有地域）
   * @param {Boolean} params.allRegions - 是否查询所有地域（默认 false）
   * 注意：Lindorm API 返回的是 InstanceList 数组，不是 Instances.Instance
   */
  async describeInstances(params = {}) {
    // 如果指定了 allRegions=true，查询所有地域
    if (params.allRegions) {
      return await this.describeAllRegionsInstances(params);
    }
    
    const result = await this.client.callAPI('GetLindormInstanceList', {
      RegionId: params.regionId || this.client.regionId,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 20
    });
    
    // Lindorm API 返回格式：{ InstanceList: [...], Total: N, ... }
    // 转换为统一格式
    return {
      TotalCount: result.Total || 0,
      PageNumber: result.PageNumber || 1,
      PageSize: result.PageSize || 20,
      Instances: {
        Instance: result.InstanceList || []
      }
    };
  }

  /**
   * 查询所有地域的 Lindorm 实例
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
        const result = await this.client.callAPI('GetLindormInstanceList', {
          RegionId: region,
          PageNumber: 1,
          PageSize: 100
        });
        
        const count = result.Total || 0;
        if (count > 0) {
          totalCount += count;
          if (result.InstanceList) {
            result.InstanceList.forEach(inst => {
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
   * 获取 Lindorm 实例详情
   */
  async describeInstance(instanceId) {
    if (!instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('GetLindormInstance', {
      InstanceId: instanceId
    });
  }

  /**
   * 获取 Lindorm V2 实例详情
   */
  async describeV2Instance(instanceId) {
    if (!instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('GetLindormV2InstanceDetails', {
      InstanceId: instanceId
    });
  }

  /**
   * 变配 Lindorm 实例
   */
  async upgradeInstance(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('UpgradeLindormInstance', {
      InstanceId: params.instanceId,
      CoreSpec: params.coreSpec,
      CoreNumber: params.coreNumber,
      StorageNumber: params.storageNumber,
      TsdbSpec: params.tsdbSpec,
      TsdbNumber: params.tsdbNumber
    });
  }

  /**
   * 更新 Lindorm V2 实例
   */
  async updateV2Instance(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('UpdateLindormV2Instance', {
      InstanceId: params.instanceId,
      CoreSpec: params.coreSpec,
      CoreNumber: params.coreNumber,
      StorageNumber: params.storageNumber
    });
  }

  /**
   * 续费 Lindorm 实例
   */
  async renewInstance(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('RenewLindormInstance', {
      InstanceId: params.instanceId,
      Period: params.period,
      PricingCycle: params.pricingCycle || 'Month'
    });
  }

  /**
   * 变更实例计费方式
   */
  async modifyPayType(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('ModifyInstancePayType', {
      InstanceId: params.instanceId,
      PayType: params.payType,
      Period: params.period,
      PricingCycle: params.pricingCycle
    });
  }

  /**
   * 更新实例属性（名称/删除保护）
   */
  async updateInstanceAttribute(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('UpdateLindormInstanceAttribute', {
      InstanceId: params.instanceId,
      InstanceName: params.instanceName,
      DeletionProtection: params.deletionProtection
    });
  }

  /**
   * 获取实例存储详情
   */
  async describeStorageDetail(instanceId) {
    if (!instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('GetLindormFsUsedDetail', {
      InstanceId: instanceId
    });
  }

  /**
   * 获取 Lindorm 实例支持的引擎类型
   */
  async describeEngineList(instanceId) {
    if (!instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('GetLindormInstanceEngineList', {
      InstanceId: instanceId
    });
  }

  /**
   * 开通 Lindorm MySQL 协议
   */
  async switchLSQLV3MySQLService(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('SwitchLSQLV3MySQLService', {
      InstanceId: params.instanceId,
      ServiceAction: params.serviceAction || 'Open'
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

  /**
   * 设置 Lindorm 实例的访问白名单
   */
  async updateWhitelist(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    if (!params.ipList) {
      throw new Error('IpList is required');
    }
    
    // 安全提醒
    if (params.ipList.includes('0.0.0.0/0')) {
      console.warn('⚠️  安全警告：当前设置允许所有 IP 访问 (0.0.0.0/0)，建议设置具体的 IP 白名单以提高安全性');
    }
    
    return await this.client.callAPI('UpdateInstanceIpWhiteList', {
      InstanceId: params.instanceId,
      IpList: params.ipList,
      GroupName: params.groupName || 'default'
    });
  }

  /**
   * 设置 Lindorm V2 实例的访问白名单
   */
  async updateV2Whitelist(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    if (!params.ipList) {
      throw new Error('IpList is required');
    }
    
    // 安全提醒
    if (params.ipList.includes('0.0.0.0/0')) {
      console.warn('⚠️  安全警告：当前设置允许所有 IP 访问 (0.0.0.0/0)，建议设置具体的 IP 白名单以提高安全性');
    }
    
    return await this.client.callAPI('UpdateLindormV2WhiteIpList', {
      InstanceId: params.instanceId,
      IpList: params.ipList,
      GroupName: params.groupName || 'default'
    });
  }

  /**
   * 获取 Lindorm 实例的访问白名单
   */
  async describeWhitelist(instanceId) {
    if (!instanceId) {
      throw new Error('InstanceId is required');
    }
    
    return await this.client.callAPI('GetInstanceIpWhiteList', {
      InstanceId: instanceId
    });
  }
}

/**
 * 标签管理模块
 */
class TagModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 为 Lindorm 实例绑定标签
   */
  async tagResources(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    if (!params.tags || !Array.isArray(params.tags)) {
      throw new Error('Tags is required and must be an array');
    }
    
    return await this.client.callAPI('TagResources', {
      ResourceId: params.instanceId,
      ResourceType: 'INSTANCE',
      Tag: JSON.stringify(params.tags)
    });
  }

  /**
   * 为 Lindorm 实例解绑标签
   */
  async untagResources(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    if (!params.tagKeys || !Array.isArray(params.tagKeys)) {
      throw new Error('TagKeys is required and must be an array');
    }
    
    return await this.client.callAPI('UntagResources', {
      ResourceId: params.instanceId,
      ResourceType: 'INSTANCE',
      TagKey: JSON.stringify(params.tagKeys)
    });
  }

  /**
   * 获取 Lindorm 实例和标签的绑定关系
   */
  async listTagResources(params = {}) {
    return await this.client.callAPI('ListTagResources', {
      RegionId: params.regionId || this.client.regionId,
      ResourceType: 'INSTANCE',
      ResourceId: params.instanceId,
      PageNumber: params.pageNumber || 1,
      PageSize: params.pageSize || 20
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

  /**
   * 获取 Lindorm 产品支持的所有地域
   */
  async describeRegions() {
    return await this.client.callAPI('DescribeRegions');
  }
}

/**
 * 资源组管理模块
 */
class ResourceGroupModule {
  constructor(client) {
    this.client = client;
  }

  /**
   * 资源转组
   */
  async changeResourceGroup(params) {
    if (!params.instanceId) {
      throw new Error('InstanceId is required');
    }
    if (!params.resourceGroupId) {
      throw new Error('ResourceGroupId is required');
    }
    
    return await this.client.callAPI('ChangeResourceGroup', {
      ResourceId: params.instanceId,
      ResourceType: 'INSTANCE',
      ResourceGroupId: params.resourceGroupId
    });
  }
}

/**
 * 主导出类
 */
class LindormDatabaseOperation {
  constructor(config = {}) {
    this.config = config;
    this.client = new LindormClient(config);
    this.instances = new InstanceModule(this.client);
    this.whitelist = new WhitelistModule(this.client);
    this.tags = new TagModule(this.client);
    this.regions = new RegionModule(this.client);
    this.resourceGroups = new ResourceGroupModule(this.client);
  }

  /**
   * 发现并列出所有可用的阿里云凭证
   */
  async discoverCredentials() {
    const manager = new CredentialManager();
    return await manager.discoverCredentials(this.config);
  }

  /**
   * 获取当前凭证信息
   */
  async getCredentialInfo() {
    await this.client.initCredential();
    return this.client.getCredentialInfo();
  }

  /**
   * 手动选择凭证（当有多个时）
   */
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
      throw new Error(`未找到名为 "${profileName}" 的凭证。可用凭证：${sources.map(s => s.name).join(', ')}`);
    }

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

module.exports = LindormDatabaseOperation;
