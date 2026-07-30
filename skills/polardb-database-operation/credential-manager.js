/**
 * 阿里云凭证管理模块
 * 支持多种 AKSK 来源发现与管理
 * 
 * 来源优先级：
 * 1. 直接传入 config（显式指定）
 * 2. OpenClaw 系统环境变量
 * 3. 阿里云官方 SDK 环境变量
 * 4. aliyun-cli 配置文件
 * 5. 默认凭证文件
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class CredentialManager {
  constructor() {
    this.homeDir = os.homedir();
  }

  /**
   * 扫描所有可能的 AKSK 来源
   * @returns {Promise<Array>} 凭证列表 [{name, accessKeyId, accessKeySecret, source, profile, regionId}]
   */
  async discoverCredentials(config = {}) {
    const sources = [];

    // 来源 1: 直接传入 config（最高优先级）
    if (config.accessKeyId && config.accessKeySecret) {
      sources.push({
        name: config.profileName || '直接配置',
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        regionId: config.regionId || 'cn-hangzhou',
        source: 'config',
        profile: config.profileName || 'default',
        priority: 1
      });
    }

    // 来源 2: OpenClaw 系统环境变量
    const openclawCred = this.scanOpenClawEnv();
    if (openclawCred) sources.push(openclawCred);

    // 来源 3: 阿里云官方 SDK 环境变量
    const aliyunEnvCreds = this.scanAliyunEnvVars();
    sources.push(...aliyunEnvCreds);

    // 来源 4: aliyun-cli 配置文件
    const cliCreds = await this.scanAliyunCLI();
    sources.push(...cliCreds);

    // 来源 5: 默认凭证文件
    const fileCreds = await this.scanCredentialsFile();
    sources.push(...fileCreds);

    // 按优先级排序
    return sources.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 扫描 OpenClaw 系统环境变量
   */
  scanOpenClawEnv() {
    const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
    const regionId = process.env.ALIBABA_CLOUD_REGION_ID || 'cn-hangzhou';

    if (accessKeyId && accessKeySecret) {
      return {
        name: 'OpenClaw 系统配置',
        accessKeyId,
        accessKeySecret,
        regionId,
        source: 'env:openclaw',
        profile: 'default',
        priority: 2
      };
    }
    return null;
  }

  /**
   * 扫描阿里云官方 SDK 环境变量
   * 支持多套环境变量命名（兼容 QoderWork、OpenClaw、其他 AI 工具）
   * 
   * 优先级：
   * 1. ALIBABA_CLOUD_* (QoderWork / 阿里云官方推荐)
   * 2. ALIBABA_* (简写形式)
   * 3. ACCESS_KEY_* (通用形式)
   * 4. ALIYUN_* (旧版 CLI)
   */
  scanAliyunEnvVars() {
    const sources = [];

    // 定义多组环境变量命名（按优先级排序）
    const envGroups = [
      {
        name: 'QoderWork / 阿里云官方',
        idKeys: ['ALIBABA_CLOUD_ACCESS_KEY_ID'],
        secretKeys: ['ALIBABA_CLOUD_ACCESS_KEY_SECRET'],
        regionKeys: ['ALIBABA_CLOUD_REGION_ID'],
        priority: 3
      },
      {
        name: '阿里云简写',
        idKeys: ['ALIBABA_ACCESS_KEY_ID'],
        secretKeys: ['ALIBABA_ACCESS_KEY_SECRET'],
        regionKeys: ['ALIBABA_REGION_ID'],
        priority: 4
      },
      {
        name: '通用形式',
        idKeys: ['ACCESS_KEY_ID'],
        secretKeys: ['ACCESS_KEY_SECRET'],
        regionKeys: ['REGION_ID'],
        priority: 5
      },
      {
        name: '旧版 CLI',
        idKeys: ['ALIYUN_ACCESS_KEY_ID'],
        secretKeys: ['ALIYUN_ACCESS_KEY_SECRET'],
        regionKeys: ['ALIYUN_REGION_ID'],
        priority: 6
      }
    ];

    for (const group of envGroups) {
      // 查找第一个存在的环境变量
      let accessKeyId = null;
      let accessKeySecret = null;
      let regionId = null;
      let usedIdKey = null;
      let usedSecretKey = null;

      for (const key of group.idKeys) {
        if (process.env[key]) {
          accessKeyId = process.env[key];
          usedIdKey = key;
          break;
        }
      }

      for (const key of group.secretKeys) {
        if (process.env[key]) {
          accessKeySecret = process.env[key];
          usedSecretKey = key;
          break;
        }
      }

      for (const key of group.regionKeys) {
        if (process.env[key]) {
          regionId = process.env[key];
          break;
        }
      }

      // 只有当 ID 和 Secret 都存在时才添加
      if (accessKeyId && accessKeySecret) {
        sources.push({
          name: `环境变量 (${group.name})`,
          accessKeyId,
          accessKeySecret,
          regionId: regionId || 'cn-hangzhou',
          source: `env:${usedIdKey}`,
          profile: 'default',
          priority: group.priority
        });
      }
    }

    return sources;
  }

  /**
   * 辅助方法：从多个环境变量名中获取第一个存在的值
   * @param {Array<string>} names 环境变量名列表
   * @returns {string|undefined} 环境变量值
   */
  _getEnvVar(names) {
    for (const name of names) {
      if (process.env[name]) {
        return process.env[name];
      }
    }
    return undefined;
  }

  /**
   * 扫描 aliyun-cli 配置文件
   * 位置：~/.aliyun/config.json
   */
  async scanAliyunCLI() {
    const sources = [];
    const configPath = path.join(this.homeDir, '.aliyun', 'config.json');

    try {
      if (!fs.existsSync(configPath)) {
        return sources;
      }

      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      // aliyun-cli 支持多 profile
      const profiles = config.profiles || [];
      const currentProfile = config.current || 'default';

      for (const profile of profiles) {
        if (profile.accessKeyId && profile.accessKeySecret) {
          sources.push({
            name: `aliyun-cli: ${profile.name || profile.mode || 'default'}`,
            accessKeyId: profile.accessKeyId,
            accessKeySecret: profile.accessKeySecret,
            regionId: profile.regionId || 'cn-hangzhou',
            source: 'aliyun-cli',
            profile: profile.name || 'default',
            priority: 4,
            isCurrent: profile.name === currentProfile
          });
        }
      }

      // 如果没有 profiles，检查根级别
      if (profiles.length === 0 && config.accessKeyId && config.accessKeySecret) {
        sources.push({
          name: 'aliyun-cli: default',
          accessKeyId: config.accessKeyId,
          accessKeySecret: config.accessKeySecret,
          regionId: config.regionId || 'cn-hangzhou',
          source: 'aliyun-cli',
          profile: 'default',
          priority: 4,
          isCurrent: true
        });
      }
    } catch (error) {
      // 文件解析失败，静默忽略
      console.warn(`[CredentialManager] 读取 aliyun-cli 配置失败：${error.message}`);
    }

    return sources;
  }

  /**
   * 扫描默认凭证文件
   * 位置：~/.alibabacloud/credentials
   * 格式：INI 风格
   */
  async scanCredentialsFile() {
    const sources = [];
    const credPath = path.join(this.homeDir, '.alibabacloud', 'credentials');

    try {
      if (!fs.existsSync(credPath)) {
        return sources;
      }

      const content = fs.readFileSync(credPath, 'utf8');
      const profiles = this.parseIniContent(content);

      for (const [profileName, config] of Object.entries(profiles)) {
        if (config.access_key_id && config.access_key_secret) {
          sources.push({
            name: `凭证文件：${profileName}`,
            accessKeyId: config.access_key_id,
            accessKeySecret: config.access_key_secret,
            regionId: config.region_id || 'cn-hangzhou',
            source: 'credentials-file',
            profile: profileName,
            priority: 5
          });
        }
      }
    } catch (error) {
      // 文件解析失败，静默忽略
      console.warn(`[CredentialManager] 读取凭证文件失败：${error.message}`);
    }

    return sources;
  }

  /**
   * 解析 INI 格式内容
   */
  parseIniContent(content) {
    const result = {};
    let currentSection = 'default';

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 跳过空行和注释
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
        continue;
      }

      // 检查段落标记 [section]
      const sectionMatch = trimmed.match(/^\[(.+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        result[currentSection] = {};
        continue;
      }

      // 解析 key=value
      const kvMatch = trimmed.match(/^([^=]+)=(.*)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim();
        const value = kvMatch[2].trim();
        result[currentSection][key] = value;
      }
    }

    return result;
  }

  /**
   * 选择凭证
   * @param {Array} sources 凭证列表
   * @param {Object} options 选项
   * @returns {Promise<Object>} 选中的凭证
   */
  async selectCredential(sources, options = {}) {
    const { autoSelect = true, requireConfirmation = false } = options;

    if (sources.length === 0) {
      throw new Error(
        '未找到任何阿里云凭证。\n\n' +
        '请通过以下方式之一配置：\n' +
        '1. 在 OpenClaw 环境变量中设置 ALIBABA_CLOUD_ACCESS_KEY_ID 和 ALIBABA_CLOUD_ACCESS_KEY_SECRET\n' +
        '2. 配置 aliyun-cli: aliyun configure\n' +
        '3. 创建凭证文件：~/.alibabacloud/credentials\n' +
        '4. 直接在调用时传入 accessKeyId 和 accessKeySecret'
      );
    }

    // 自动选择最高优先级
    if (autoSelect) {
      const selected = sources[0];
      return {
        selected,
        allSources: sources,
        message: `自动选择凭证：${selected.name} (${selected.profile})`
      };
    }

    // 需要用户确认（多个凭证时）
    if (requireConfirmation && sources.length > 1) {
      // 返回凭证列表，让调用方展示给用户
      return {
        selected: null,
        allSources: sources,
        requiresUserSelection: true,
        message: `发现 ${sources.length} 套阿里云凭证，请选择使用哪一套`
      };
    }

    // 只有一个，直接用
    return {
      selected: sources[0],
      allSources: sources,
      message: `使用凭证：${sources[0].name} (${sources[0].profile})`
    };
  }

  /**
   * 格式化凭证列表（用于展示给用户）
   */
  formatCredentialList(sources) {
    if (sources.length === 0) {
      return '未找到任何凭证';
    }

    const lines = sources.map((cred, index) => {
      const maskId = cred.accessKeyId.replace(/^(.{6}).*(.{4})$/, '$1****$2');
      const current = cred.isCurrent ? '【当前】' : '';
      return `${index + 1}. ${cred.name} ${current}\n` +
             `   AccessKey: ${maskId}\n` +
             `   来源：${cred.source}\n` +
             `   地域：${cred.regionId}`;
    });

    return lines.join('\n\n');
  }
}

module.exports = CredentialManager;
