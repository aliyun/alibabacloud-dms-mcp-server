
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

---

### NL2SQL Related

#### nl2sql: Convert natural language questions into executable SQL queries.

- **question** (string, required): Natural language question to convert into SQL.
- **database_id** (integer, required): DMS database ID (obtained via getDatabase).
- **knowledge** (string, optional): Additional context or database knowledge to assist SQL generation.

#### askDatabase: Retrieve database execution results directly using natural language questions  
- **question** (string, required): The natural language question to be converted into SQL.  
- **knowledge** (string, optional): Additional context or database knowledge used to assist in SQL generation.

---
### Data Migration Related

#### configureDtsJob: Configure a DTS data migration task that migrates data from one RDS-MySQL instance to another RDS-MySQL instance.
- **region_id** (string, required): The region where the instance is located (e.g., Hangzhou `"cn-hangzhou"`, Beijing `"cn-beijing"`).
- **job_type** (string, required): The type of DTS job (e.g., synchronization job `"SYNC"`, migration job `"MIGRATION"`).
- **source_endpoint_region** (string, required): The region where the source database is located (e.g., Hangzhou `"cn-hangzhou"`, Beijing `"cn-beijing"`).
- **source_endpoint_instance_type** (string, required): The type of source database instance (e.g., `"RDS"`).
- **source_endpoint_engine_name** (string, required): The engine type of the source database (e.g., `"MySQL"`).
- **source_endpoint_instance_id** (string, required): The ID of the source database instance (e.g., `"rm-xxx"`).
- **source_endpoint_user_name** (string, required): The username for connecting to the source database.
- **source_endpoint_password** (string, required): The password for connecting to the source database.
- **destination_endpoint_region** (string, required): The region where the destination database is located (e.g., Hangzhou `"cn-hangzhou"`, Beijing `"cn-beijing"`).
- **destination_endpoint_instance_type** (string, required): The type of destination database instance (e.g., `"RDS"`).
- **destination_endpoint_engine_name** (string, required): The engine type of the destination database (e.g., `"MySQL"`).
- **destination_endpoint_instance_id** (string, required): The ID of the destination database instance (e.g., `"rm-xxx"`).
- **destination_endpoint_user_name** (string, required): The username for connecting to the destination database.
- **destination_endpoint_password** (string, required): The password for connecting to the destination database.
- **db_list** (string, required): The migration object in JSON string format:
  Example 1: Migrate the `dtstest` database, and set `db_list` to `{"dtstest":{"name":"dtstest","all":true}}`;
  Example 2: Migrate the `task01` table under the `dtstest` database, and set `db_list` to `{"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true}}}}`;
  Example 3: Migrate the `task01` and `task02` tables under the `dtstest` database, and set `db_list` to `{"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true},"task02":{"name":"task02","all":true}}}}`.

#### startDtsJob: Start a DTS migration task.
- **region_id** (string, required): The region where the instance is located (e.g., Hangzhou `"cn-hangzhou"`, Beijing `"cn-beijing"`).
- **dts_job_id** (string, required): The DTS job ID.

#### getDtsJob: Get detailed information about a DTS migration task.
- **region_id** (string, required): The region where the instance is located (e.g., Hangzhou `"cn-hangzhou"`, Beijing `"cn-beijing"`).
- **dts_job_id** (string, required): The DTS job ID.
