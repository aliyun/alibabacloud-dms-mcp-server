/**
 * RDS 数据库操作 Skill - 参数验证工具
 * 
 * 用于验证 API 参数的合法性和完整性
 */

/**
 * 验证密码复杂度
 * @param {string} password - 密码
 * @returns {object} - {valid: boolean, message: string}
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, message: '密码不能为空' };
  }
  
  if (password.length < 8 || password.length > 32) {
    return { valid: false, message: '密码长度必须在 8-32 位之间' };
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=]/.test(password);
  
  const count = [hasUpper, hasLower, hasDigit, hasSpecial].filter(v => v).length;
  if (count < 3) {
    return { 
      valid: false, 
      message: '密码必须包含大写字母、小写字母、数字、特殊字符中的至少三种' 
    };
  }
  
  return { valid: true, message: '密码符合要求' };
}

/**
 * 验证账号名称
 * @param {string} accountName - 账号名称
 * @returns {object} - {valid: boolean, message: string}
 */
function validateAccountName(accountName) {
  if (!accountName) {
    return { valid: false, message: '账号名称不能为空' };
  }
  
  if (accountName.length < 2 || accountName.length > 64) {
    return { valid: false, message: '账号名称长度必须在 2-64 位之间' };
  }
  
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(accountName)) {
    return { valid: false, message: '账号名称必须以字母开头，只能包含字母、数字和下划线' };
  }
  
  return { valid: true, message: '账号名称符合要求' };
}

/**
 * 验证数据库名称
 * @param {string} dbName - 数据库名称
 * @returns {object} - {valid: boolean, message: string}
 */
function validateDatabaseName(dbName) {
  if (!dbName) {
    return { valid: false, message: '数据库名称不能为空' };
  }
  
  if (dbName.length < 1 || dbName.length > 64) {
    return { valid: false, message: '数据库名称长度必须在 1-64 位之间' };
  }
  
  return { valid: true, message: '数据库名称符合要求' };
}

/**
 * 验证字符集
 * @param {string} charset - 字符集
 * @returns {object} - {valid: boolean, message: string}
 */
function validateCharset(charset) {
  const validCharsets = ['utf8', 'utf8mb4', 'gbk', 'gb18030', 'latin1', 'ascii', 'big5'];
  
  if (!charset) {
    return { 
      valid: false, 
      message: '字符集不能为空，可选值：' + validCharsets.join(', ') 
    };
  }
  
  if (!validCharsets.includes(charset.toLowerCase())) {
    return { 
      valid: false, 
      message: `无效的字符集 '${charset}'，可选值：${validCharsets.join(', ')}` 
    };
  }
  
  return { valid: true, message: '字符集有效' };
}

/**
 * 验证账号类型
 * @param {string} accountType - 账号类型
 * @returns {object} - {valid: boolean, message: string}
 */
function validateAccountType(accountType) {
  const validTypes = ['Normal', 'Super'];
  
  if (!accountType) {
    return { 
      valid: false, 
      message: '账号类型不能为空，可选值：' + validTypes.join(', ') 
    };
  }
  
  if (!validTypes.includes(accountType)) {
    return { 
      valid: false, 
      message: `无效的账号类型 '${accountType}'，可选值：${validTypes.join(', ')}` 
    };
  }
  
  return { valid: true, message: '账号类型有效' };
}

/**
 * 验证 IP 地址或 CIDR
 * @param {string} ip - IP 地址或 CIDR
 * @returns {object} - {valid: boolean, message: string}
 */
function validateSecurityIp(ip) {
  if (!ip) {
    return { valid: false, message: 'IP 地址不能为空' };
  }
  
  // 检查是否为 0.0.0.0/0
  if (ip === '0.0.0.0/0') {
    return { 
      valid: true, 
      message: 'IP 有效，但 0.0.0.0/0 允许所有 IP 访问，仅用于测试！',
      warning: true
    };
  }
  
  // 简单的 IP 格式验证
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  if (!ipRegex.test(ip)) {
    return { valid: false, message: `无效的 IP 地址格式 '${ip}'` };
  }
  
  return { valid: true, message: 'IP 地址有效' };
}

/**
 * 验证实例规格
 * @param {string} engine - 引擎类型
 * @param {string} spec - 实例规格
 * @returns {object} - {valid: boolean, message: string}
 */
function validateInstanceSpec(engine, spec) {
  if (!engine) {
    return { valid: false, message: '引擎类型不能为空' };
  }
  
  if (!spec) {
    return { valid: false, message: '实例规格不能为空' };
  }
  
  // 简单的规格格式验证
  if (!/^[a-z]+\.[a-z0-9_]+\.\d+[c]$/.test(spec.toLowerCase())) {
    return { 
      valid: false, 
      message: `实例规格格式可能不正确 '${spec}'，示例：mysql.n2.medium.2c` 
    };
  }
  
  return { valid: true, message: '实例规格有效' };
}

/**
 * 验证付费类型
 * @param {string} payType - 付费类型
 * @returns {object} - {valid: boolean, message: string}
 */
function validatePayType(payType) {
  const validTypes = ['Postpaid', 'Prepaid'];
  
  if (!payType) {
    return { 
      valid: false, 
      message: '付费类型不能为空，可选值：' + validTypes.join(', ') 
    };
  }
  
  if (!validTypes.includes(payType)) {
    return { 
      valid: false, 
      message: `无效的付费类型 '${payType}'，可选值：${validTypes.join(', ')}` 
    };
  }
  
  return { valid: true, message: '付费类型有效' };
}

module.exports = {
  validatePassword,
  validateAccountName,
  validateDatabaseName,
  validateCharset,
  validateAccountType,
  validateSecurityIp,
  validateInstanceSpec,
  validatePayType
};
