/**
 * 凭证管理模块
 * 
 * 职责：
 * 1. 管理阿里云 AKSK
 * 2. 管理数据库账号密码
 * 3. 支持多种凭证来源（环境变量、配置文件等）
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class CredentialManager {
  constructor() {
    this.homeDir = os.homedir();
    this.credentials = null;
  }

  /**
   * 获取阿里云凭证
   * @returns {Object} 凭证信息
   */
  async getAliyunCredentials() {
    // 优先级：环境变量 > 配置文件
    let creds = this.scanEnvironmentVariables();
    
    if (!creds) {
      creds = this.scanConfigFiles();
    }
    
    if (!creds) {
      throw new Error('未找到阿里云凭证，请设置环境变量 ALIBABA_CLOUD_ACCESS_KEY_ID 和 ALIBABA_CLOUD_ACCESS_KEY_SECRET');
    }
    
    return creds;
  }

  /**
   * 扫描环境变量
   */
  scanEnvironmentVariables() {
    const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID || 
                        process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET || 
                            process.env.ALIYUN_ACCESS_KEY_SECRET;
    const regionId = process.env.ALIBABA_CLOUD_REGION || 
                     process.env.ALIYUN_REGION || 
                     'cn-hangzhou';
    
    if (accessKeyId && accessKeySecret) {
      return {
        accessKeyId,
        accessKeySecret,
        regionId,
        source: 'environment'
      };
    }
    
    return null;
  }

  /**
   * 扫描配置文件
   */
  scanConfigFiles() {
    // 检查 aliyun-cli 配置文件
    const aliyunConfigPath = path.join(this.homeDir, '.aliyun', 'config.json');
    
    if (fs.existsSync(aliyunConfigPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(aliyunConfigPath, 'utf8'));
        const currentProfile = config.current || 'default';
        const profile = config.profiles?.find(p => p.name === currentProfile);
        
        if (profile) {
          return {
            accessKeyId: profile.access_key_id,
            accessKeySecret: profile.access_key_secret,
            regionId: profile.region_id || 'cn-hangzhou',
            source: 'aliyun-cli-config'
          };
        }
      } catch (error) {
        console.warn('读取 aliyun-cli 配置失败:', error.message);
      }
    }
    
    return null;
  }

  /**
   * 获取数据库账号配置
   * @param {string} dbType 数据库类型
   * @returns {Object} 账号配置
   */
  getDatabaseCredentials(dbType) {
    const envVars = {
      rds: { account: 'BAAS_RDS_ACCOUNT', password: 'BAAS_RDS_PASSWORD' },
      polardb: { account: 'BAAS_RDS_ACCOUNT', password: 'BAAS_RDS_PASSWORD' },
      redis: { account: 'BAAS_REDIS_ACCOUNT', password: 'BAAS_REDIS_PASSWORD' },
      mongodb: { account: 'BAAS_MONGODB_ACCOUNT', password: 'BAAS_MONGODB_PASSWORD' },
      adb_mysql: { account: 'BAAS_ADB_ACCOUNT', password: 'BAAS_ADB_PASSWORD' }
    };
    
    const vars = envVars[dbType];
    if (!vars) {
      return null;
    }
    
    return {
      account: process.env[vars.account] || this.getDefaultAccount(dbType),
      password: process.env[vars.password],
      source: 'environment'
    };
  }

  /**
   * 获取默认账号名
   */
  getDefaultAccount(dbType) {
    const defaults = {
      rds: 'app_user',
      polardb: 'app_user',
      redis: 'default',
      mongodb: 'root',
      adb_mysql: 'admin'
    };
    
    return defaults[dbType] || 'admin';
  }

  /**
   * 验证凭证有效性
   */
  async validateCredentials(credentials) {
    const { accessKeyId, accessKeySecret } = credentials;
    
    if (!accessKeyId || !accessKeySecret) {
      throw new Error('AccessKeyId 和 AccessKeySecret 不能为空');
    }
    
    if (accessKeyId.length < 16) {
      throw new Error('AccessKeyId 格式不正确');
    }
    
    // 这里可以添加实际的 API 调用来验证凭证
    // 简化实现，仅做格式检查
    
    return true;
  }

  /**
   * 安全地显示凭证（脱敏）
   */
  maskCredentials(credentials) {
    const masked = { ...credentials };
    
    if (masked.accessKeyId) {
      masked.accessKeyId = this.maskString(masked.accessKeyId, 4);
    }
    if (masked.accessKeySecret) {
      masked.accessKeySecret = this.maskString(masked.accessKeySecret, 0);
    }
    if (masked.password) {
      masked.password = this.maskString(masked.password, 0);
    }
    
    return masked;
  }

  /**
   * 字符串脱敏
   */
  maskString(str, visibleChars = 4) {
    if (!str || str.length <= visibleChars * 2) {
      return '*'.repeat(str?.length || 0);
    }
    
    const start = str.substring(0, visibleChars);
    const end = str.substring(str.length - visibleChars);
    return `${start}****${end}`;
  }

  /**
   * 保存凭证到配置文件（可选功能）
   */
  async saveCredentials(credentials, profile = 'default') {
    const configDir = path.join(this.homeDir, '.baas');
    const configPath = path.join(configDir, 'credentials');
    
    // 确保目录存在
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 读取现有配置
    let config = {};
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        console.warn('读取现有凭证配置失败:', error.message);
      }
    }
    
    // 更新配置
    config[profile] = {
      accessKeyId: credentials.accessKeyId,
      // 注意：实际应用中应该加密存储
      accessKeySecret: credentials.accessKeySecret,
      regionId: credentials.regionId,
      updatedAt: new Date().toISOString()
    };
    
    // 写入文件（设置权限为仅所有者可读写）
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
    
    return true;
  }

  /**
   * 从配置文件加载凭证
   */
  async loadCredentials(profile = 'default') {
    const configPath = path.join(this.homeDir, '.baas', 'credentials');
    
    if (!fs.existsSync(configPath)) {
      return null;
    }
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const creds = config[profile];
      
      if (creds) {
        return {
          ...creds,
          source: 'config-file'
        };
      }
    } catch (error) {
      console.warn('读取凭证配置失败:', error.message);
    }
    
    return null;
  }
}

module.exports = CredentialManager;
