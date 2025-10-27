
### Metadata Related

#### addInstance: Add an instance to DMS. If the instance already exists, return the existing instance information.

- **db_user** (string, required): Username for connecting to the database.
- **db_password** (string, required): Password for connecting to the database.
- **instance_resource_id** (string, optional): Resource ID of the instance, typically assigned by the cloud service provider.
- **host** (string, optional): Connection address of the instance.
- **port** (string, optional): Connection port number of the instance.
- **region** (string, optional): Region where the instance is located (e.g., "cn-hangzhou").

#### listInstances：Search for instances from DMS.    

- **search_key** (string, optional): Search key (e.g., instance host, instance alias, etc.)
- **db_type** (string, optional): InstanceType, or called dbType (e.g., mysql, polardb, oracle, postgresql, sqlserver, polardb-pg, etc.)
- **env_type** (string, optional):  Instance EnvType (e.g., product, dev, test, etc.)

#### getInstance: Retrieve instance details from DMS based on host and port information.

- **host** (string, required): Connection address of the instance.
- **port** (string, required): Connection port number of the instance.
- **sid** (string, optional): Required for Oracle-like databases, defaults to None.

#### searchDatabase: Search for databases in DMS based on schemaName.

- **search_key** (string, required): schemaName.
- **page_number** (integer, optional): Page number to retrieve (starting from 1), default is 1.
- **page_size** (integer, optional): Number of results per page (maximum 1000), default is 200.

#### getDatabase: Retrieve detailed information about a specific database from DMS.

- **host** (string, required): Connection address of the instance.
- **port** (string, required): Connection port number of the instance.
- **schema_name** (string, required): Database name.
- **sid** (string, optional): Required for Oracle-like databases, defaults to None.

#### listTable: Search for data tables in DMS based on databaseId and tableName.

- **database_id** (string, required): Database ID to limit the search scope (obtained via getDatabase).
- **search_name** (string, optional): String as a search keyword to match table names.
- **page_number** (integer, optional): Pagination page number (default: 1).
- **page_size** (integer, optional): Number of results per page (default: 200, maximum: 200).

#### getTableDetailInfo: Retrieve detailed metadata information for a specific data table, including field and index details.

- **table_guid** (string, required): Unique identifier for the table (format: dmsTableId.schemaName.tableName), obtained via searchTable or listTable.

---

### SQL Execution Related

#### executeScript: Execute an SQL script through DMS and return the results.

- **database_id** (string, required): DMS database ID (obtained via getDatabase).
- **script** (string, required): SQL script content to execute.

#### createDataChangeOrder: Create a data change ticket in DMS.

- **database_id** (string, required): DMS database ID (obtained via getDatabase).
- **script** (string, required): SQL script content to execute.

#### getOrderInfo: Retrieve DMS ticket details.

- **order_id** (string, required):The ticket ID in DMS.

#### submitOrderApproval: Submit a DMS ticket for approval.

- **order_id** (string, required):The ticket ID in DMS.

---

### NL2SQL Related

#### nl2sql: Convert natural language questions into executable SQL queries.

- **question** (string, required): Natural language question to convert into SQL.
- **database_id** (integer, required): DMS database ID (obtained via getDatabase).
- **knowledge** (string, optional): Additional context or database knowledge to assist SQL generation.
- **model** (string, optional): The specified large language model type; currently supports Qwen series models.


#### askDatabase: Retrieve database execution results directly using natural language questions.
- **question** (string, required): The natural language question to be converted into SQL.  
- **knowledge** (string, optional): Additional context or database knowledge used to assist in SQL generation.
- **model** (string, optional): The specified large language model type; currently supports Qwen series models.

---

### SQL Assistant Related

#### fixSql：SQL Repair.

- **database_id** (integer, required):  DMS database ID (obtained via getDatabase).
- **sql** (string, required): The SQL statement to be repaired.
- **error** (string, required): The error message associated with the SQL.
- **question**  (string, optional): Supplementary descriptive information.
- **model** (string, optional): The specified large language model type; currently supports Qwen series models.


#### answerSqlSyntax：SQL Syntax Response.

- **database_id** (integer, required): DMS database ID (obtained via getDatabase).
- **question** (string, required): The question.
- **model** (string, optional): The specified large language model type; currently supports Qwen series models.

#### optimizeSql：SQL Optimization.

- **database_id** (integer, required): DMS database ID, which can be obtained via the getDatabase tool.
- **sql** (string, required): The SQL statement to be optimized.
- **question** question (string, optional): Supplementary descriptive information.
- **model** (string, optional): The specified large language model type; currently supports Qwen series models.
