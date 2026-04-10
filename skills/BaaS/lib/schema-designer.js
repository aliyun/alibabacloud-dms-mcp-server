/**
 * Schema 设计器
 * 
 * 职责：
 * 1. 支持三种输入方式：自然语言、ER图、反向工程
 * 2. 生成标准化的表结构、索引、分区策略
 * 3. 输出可执行的 DDL
 */

class SchemaDesigner {
  constructor(config = {}) {
    this.config = config;
  }

  /**
   * 设计 Schema
   * @param {Object} requirements 需求
   * @param {Object} architecture 架构设计
   * @returns {Object} Schema 设计
   */
  async design(requirements, architecture) {
    const { entities } = requirements;
    const { productSelection } = architecture;
    
    // 为每个实体生成表结构
    const tables = [];
    
    for (const entity of entities) {
      const table = this.designTable(entity, productSelection.products.oltp?.type || 'rds');
      tables.push(table);
    }
    
    // 生成关系表（多对多关系）
    const relationTables = this.designRelationTables(entities);
    tables.push(...relationTables);
    
    // 生成 DDL
    const ddl = this.generateDDL(tables, productSelection.products.oltp?.type || 'rds');
    
    return {
      tables,
      ddl,
      summary: {
        tableCount: tables.length,
        entityCount: entities.length,
        relationCount: relationTables.length
      }
    };
  }

  /**
   * 设计单个表
   */
  designTable(entity, dbType) {
    const tableName = this.toSnakeCase(entity.name);
    const columns = [];
    const indexes = [];
    
    // 根据实体类型推断字段
    const entityFields = this.getEntityFields(entity.name);
    
    // 主键
    columns.push({
      name: `${tableName}_id`,
      type: 'BIGINT',
      nullable: false,
      autoIncrement: true,
      comment: '主键ID'
    });
    
    // 实体特定字段
    for (const field of entityFields) {
      columns.push({
        name: field.name,
        type: field.type,
        nullable: field.nullable !== false,
        default: field.default,
        comment: field.comment
      });
      
      // 为常用查询字段添加索引
      if (field.indexed) {
        indexes.push({
          name: `idx_${field.name}`,
          columns: [field.name],
          type: 'BTREE'
        });
      }
    }
    
    // 通用字段
    columns.push(
      { name: 'created_at', type: 'DATETIME', nullable: false, default: 'CURRENT_TIMESTAMP', comment: '创建时间' },
      { name: 'updated_at', type: 'DATETIME', nullable: false, default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', comment: '更新时间' },
      { name: 'is_deleted', type: 'TINYINT', nullable: false, default: 0, comment: '软删除标记' }
    );
    
    // 主键索引
    indexes.unshift({
      name: 'PRIMARY',
      columns: [`${tableName}_id`],
      type: 'PRIMARY',
      isPrimary: true
    });
    
    // 创建时间索引（常用于排序）
    indexes.push({
      name: 'idx_created_at',
      columns: ['created_at'],
      type: 'BTREE'
    });
    
    return {
      name: tableName,
      comment: `${entity.name}表`,
      engine: dbType === 'polardb' ? 'InnoDB' : 'InnoDB',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      columns,
      indexes,
      primaryKey: `${tableName}_id`
    };
  }

  /**
   * 获取实体字段定义
   */
  getEntityFields(entityName) {
    const name = entityName.toLowerCase();
    
    const fieldDefinitions = {
      user: [
        { name: 'username', type: 'VARCHAR(64)', nullable: false, indexed: true, comment: '用户名' },
        { name: 'email', type: 'VARCHAR(128)', nullable: true, indexed: true, comment: '邮箱' },
        { name: 'phone', type: 'VARCHAR(20)', nullable: true, indexed: true, comment: '手机号' },
        { name: 'password_hash', type: 'VARCHAR(256)', nullable: false, comment: '密码哈希' },
        { name: 'nickname', type: 'VARCHAR(64)', nullable: true, comment: '昵称' },
        { name: 'avatar_url', type: 'VARCHAR(512)', nullable: true, comment: '头像URL' },
        { name: 'status', type: 'TINYINT', nullable: false, default: 1, indexed: true, comment: '状态：1正常 0禁用' }
      ],
      product: [
        { name: 'product_name', type: 'VARCHAR(256)', nullable: false, indexed: true, comment: '商品名称' },
        { name: 'category_id', type: 'BIGINT', nullable: false, indexed: true, comment: '分类ID' },
        { name: 'price', type: 'DECIMAL(10,2)', nullable: false, comment: '价格' },
        { name: 'stock', type: 'INT', nullable: false, default: 0, comment: '库存' },
        { name: 'description', type: 'TEXT', nullable: true, comment: '商品描述' },
        { name: 'main_image', type: 'VARCHAR(512)', nullable: true, comment: '主图URL' },
        { name: 'status', type: 'TINYINT', nullable: false, default: 1, indexed: true, comment: '状态：1上架 0下架' }
      ],
      order: [
        { name: 'order_no', type: 'VARCHAR(64)', nullable: false, indexed: true, comment: '订单编号' },
        { name: 'user_id', type: 'BIGINT', nullable: false, indexed: true, comment: '用户ID' },
        { name: 'total_amount', type: 'DECIMAL(10,2)', nullable: false, comment: '订单总金额' },
        { name: 'status', type: 'TINYINT', nullable: false, default: 0, indexed: true, comment: '订单状态' },
        { name: 'pay_status', type: 'TINYINT', nullable: false, default: 0, indexed: true, comment: '支付状态' },
        { name: 'pay_time', type: 'DATETIME', nullable: true, indexed: true, comment: '支付时间' },
        { name: 'remark', type: 'VARCHAR(512)', nullable: true, comment: '订单备注' }
      ],
      category: [
        { name: 'category_name', type: 'VARCHAR(128)', nullable: false, comment: '分类名称' },
        { name: 'parent_id', type: 'BIGINT', nullable: false, default: 0, indexed: true, comment: '父分类ID' },
        { name: 'level', type: 'TINYINT', nullable: false, default: 1, comment: '层级' },
        { name: 'sort_order', type: 'INT', nullable: false, default: 0, comment: '排序' },
        { name: 'icon_url', type: 'VARCHAR(512)', nullable: true, comment: '图标URL' }
      ],
      payment: [
        { name: 'payment_no', type: 'VARCHAR(64)', nullable: false, indexed: true, comment: '支付流水号' },
        { name: 'order_id', type: 'BIGINT', nullable: false, indexed: true, comment: '订单ID' },
        { name: 'user_id', type: 'BIGINT', nullable: false, indexed: true, comment: '用户ID' },
        { name: 'amount', type: 'DECIMAL(10,2)', nullable: false, comment: '支付金额' },
        { name: 'payment_method', type: 'VARCHAR(32)', nullable: false, comment: '支付方式' },
        { name: 'third_party_no', type: 'VARCHAR(128)', nullable: true, comment: '第三方支付流水号' },
        { name: 'status', type: 'TINYINT', nullable: false, default: 0, indexed: true, comment: '支付状态' }
      ],
      inventory: [
        { name: 'product_id', type: 'BIGINT', nullable: false, indexed: true, comment: '商品ID' },
        { name: 'quantity', type: 'INT', nullable: false, default: 0, comment: '库存数量' },
        { name: 'locked_quantity', type: 'INT', nullable: false, default: 0, comment: '锁定库存' },
        { name: 'version', type: 'INT', nullable: false, default: 0, comment: '乐观锁版本号' }
      ],
      comment: [
        { name: 'user_id', type: 'BIGINT', nullable: false, indexed: true, comment: '用户ID' },
        { name: 'product_id', type: 'BIGINT', nullable: false, indexed: true, comment: '商品ID' },
        { name: 'order_id', type: 'BIGINT', nullable: false, indexed: true, comment: '订单ID' },
        { name: 'rating', type: 'TINYINT', nullable: false, comment: '评分' },
        { name: 'content', type: 'TEXT', nullable: true, comment: '评论内容' },
        { name: 'images', type: 'JSON', nullable: true, comment: '评论图片' }
      ],
      logistics: [
        { name: 'order_id', type: 'BIGINT', nullable: false, indexed: true, comment: '订单ID' },
        { name: 'tracking_no', type: 'VARCHAR(64)', nullable: true, indexed: true, comment: '物流单号' },
        { name: 'carrier', type: 'VARCHAR(64)', nullable: true, comment: '物流公司' },
        { name: 'status', type: 'TINYINT', nullable: false, default: 0, comment: '物流状态' },
        { name: 'shipped_at', type: 'DATETIME', nullable: true, comment: '发货时间' },
        { name: 'delivered_at', type: 'DATETIME', nullable: true, comment: '签收时间' }
      ]
    };
    
    return fieldDefinitions[name] || this.generateGenericFields(name);
  }

  /**
   * 生成通用字段
   */
  generateGenericFields(entityName) {
    return [
      { name: 'name', type: 'VARCHAR(128)', nullable: false, indexed: true, comment: '名称' },
      { name: 'description', type: 'VARCHAR(512)', nullable: true, comment: '描述' },
      { name: 'status', type: 'TINYINT', nullable: false, default: 1, indexed: true, comment: '状态' },
      { name: 'sort_order', type: 'INT', nullable: false, default: 0, comment: '排序' }
    ];
  }

  /**
   * 设计关系表
   */
  designRelationTables(entities) {
    const relationTables = [];
    
    // 检测多对多关系并创建关联表
    const entityNames = entities.map(e => e.name.toLowerCase());
    
    // 订单-商品 多对多
    if (entityNames.includes('order') && entityNames.includes('product')) {
      relationTables.push({
        name: 'order_item',
        comment: '订单明细表',
        engine: 'InnoDB',
        charset: 'utf8mb4',
        columns: [
          { name: 'order_item_id', type: 'BIGINT', nullable: false, autoIncrement: true, comment: '主键ID' },
          { name: 'order_id', type: 'BIGINT', nullable: false, indexed: true, comment: '订单ID' },
          { name: 'product_id', type: 'BIGINT', nullable: false, indexed: true, comment: '商品ID' },
          { name: 'product_name', type: 'VARCHAR(256)', nullable: false, comment: '商品名称（快照）' },
          { name: 'price', type: 'DECIMAL(10,2)', nullable: false, comment: '单价' },
          { name: 'quantity', type: 'INT', nullable: false, comment: '数量' },
          { name: 'subtotal', type: 'DECIMAL(10,2)', nullable: false, comment: '小计金额' },
          { name: 'created_at', type: 'DATETIME', nullable: false, default: 'CURRENT_TIMESTAMP', comment: '创建时间' }
        ],
        indexes: [
          { name: 'PRIMARY', columns: ['order_item_id'], type: 'PRIMARY', isPrimary: true },
          { name: 'idx_order_id', columns: ['order_id'], type: 'BTREE' },
          { name: 'idx_product_id', columns: ['product_id'], type: 'BTREE' }
        ],
        primaryKey: 'order_item_id'
      });
    }
    
    // 用户-角色 多对多
    if (entityNames.includes('user') && entityNames.includes('role')) {
      relationTables.push({
        name: 'user_role',
        comment: '用户角色关联表',
        engine: 'InnoDB',
        charset: 'utf8mb4',
        columns: [
          { name: 'user_id', type: 'BIGINT', nullable: false, comment: '用户ID' },
          { name: 'role_id', type: 'BIGINT', nullable: false, comment: '角色ID' },
          { name: 'created_at', type: 'DATETIME', nullable: false, default: 'CURRENT_TIMESTAMP', comment: '创建时间' }
        ],
        indexes: [
          { name: 'PRIMARY', columns: ['user_id', 'role_id'], type: 'PRIMARY', isPrimary: true },
          { name: 'idx_role_id', columns: ['role_id'], type: 'BTREE' }
        ],
        primaryKey: 'user_id,role_id'
      });
    }
    
    return relationTables;
  }

  /**
   * 生成 DDL
   */
  generateDDL(tables, dbType) {
    const ddlStatements = [];
    
    for (const table of tables) {
      let ddl = `CREATE TABLE IF NOT EXISTS \`${table.name}\` (`;
      
      // 字段
      const columnDefs = table.columns.map(col => {
        let def = `\n  \`${col.name}\` ${col.type}`;
        
        if (col.autoIncrement) {
          def += ' AUTO_INCREMENT';
        }
        
        if (!col.nullable) {
          def += ' NOT NULL';
        }
        
        if (col.default !== undefined) {
          def += ` DEFAULT ${col.default}`;
        }
        
        if (col.comment) {
          def += ` COMMENT '${col.comment}'`;
        }
        
        return def;
      });
      
      ddl += columnDefs.join(',');
      
      // 主键
      const primaryKey = table.indexes.find(idx => idx.isPrimary);
      if (primaryKey) {
        ddl += `,\n  PRIMARY KEY (\`${primaryKey.columns.join('`, `')}\`)`;
      }
      
      ddl += '\n)';
      
      // 表属性
      ddl += ` ENGINE=${table.engine}`;
      ddl += ` DEFAULT CHARSET=${table.charset}`;
      ddl += ` COLLATE=${table.collate}`;
      ddl += ` COMMENT='${table.comment}'`;
      ddl += ';';
      
      ddlStatements.push(ddl);
      
      // 索引（非主键）
      for (const index of table.indexes) {
        if (index.isPrimary) continue;
        
        let indexDDL = `CREATE ${index.type === 'UNIQUE' ? 'UNIQUE ' : ''}INDEX \`${index.name}\` `;
        indexDDL += `ON \`${table.name}\` (\`${index.columns.join('`, `')}\`);`;
        ddlStatements.push(indexDDL);
      }
    }
    
    return ddlStatements.join('\n\n');
  }

  /**
   * 从ER图解析（简化实现）
   * @param {string} erDiagramText ER图文本（Mermaid格式或简化格式）
   * @returns {Array} 实体列表
   */
  parseERDiagram(erDiagramText) {
    const entities = [];
    
    // 简单的正则匹配提取实体
    const entityRegex = /(\w+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = entityRegex.exec(erDiagramText)) !== null) {
      const entityName = match[1];
      const fieldsText = match[2];
      
      const fields = [];
      const fieldLines = fieldsText.split('\n').filter(line => line.trim());
      
      for (const line of fieldLines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          fields.push({
            name: parts[0],
            type: parts[1],
            isPrimary: line.includes('PK'),
            isForeign: line.includes('FK')
          });
        }
      }
      
      entities.push({
        name: entityName,
        fields,
        source: 'er_diagram'
      });
    }
    
    return entities;
  }

  /**
   * 反向工程 - 从现有数据库解析Schema
   * @param {Object} connectionInfo 连接信息
   * @returns {Promise<Array>} 表结构列表
   */
  async reverseEngineer(connectionInfo) {
    // 这里需要实际连接数据库查询 information_schema
    // 简化实现，返回示例结构
    console.log('反向工程：连接数据库并分析Schema...');
    
    return {
      message: '反向工程需要实际数据库连接',
      note: '请使用运维中心模块的 analyzeMySQL 方法获取详细Schema信息',
      connectionInfo: {
        host: connectionInfo.host,
        database: connectionInfo.database
      }
    };
  }

  /**
   * 工具函数：驼峰转下划线
   */
  toSnakeCase(str) {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}

module.exports = SchemaDesigner;
