from alibabacloud_dms_enterprise20181101.client import Client as dms_enterprise20181101Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_dms_enterprise20181101 import models as dms_enterprise_20181101_models
from mcp.server import FastMCP
from typing import Dict, Any, Optional, List
import os
import logging

mcp = FastMCP("dms-mcp-server")


def create_client() -> dms_enterprise20181101Client:
    """
    初始化账号Client
    @return: Client
    @throws Exception
    """
    config = open_api_models.Config(
        access_key_id=os.getenv('ALIBABA_CLOUD_ACCESS_KEY_ID', ""),
        access_key_secret=os.getenv('ALIBABA_CLOUD_ACCESS_KEY_SECRET', ""),
        security_token=os.getenv('ALIBABA_CLOUD_SECURITY_TOKEN')
    )
    config.endpoint = f'dms-enterprise.cn-beijing.aliyuncs.com'
    config.user_agent = "dms-mcp"

    return dms_enterprise20181101Client(config)


@mcp.tool(name="addInstance",
          description="""
          Add an instance to DMS. If the instance already exists, it will return the existing instance information.
          Parameters:
            db_user (str): The username used to connect to the database.
            db_password (str): The password used to connect to the database.
            instance_resource_id (str, optional): The resource id of the instance, typically assigned by the cloud provider.
            host (str, optional): The hostname of the database instance.
            port (str, optional): The connection port number.
            region (str, optional): The region where the instance is located (e.g., "cn-hangzhou").
            Returns:
                Dict[str, Any]: A dictionary containing instance details with these keys:
                    - instance_id: Unique instance identifier in DMS.
                    - host: The hostname of the database instance.
                    - port: The connection port number.
            """)
async def addInstance(db_user: str,
                      db_password: str,
                      instance_resource_id: Optional[str] = None,
                      host: Optional[str] = None,
                      port: Optional[str] = None,
                      region: Optional[str] = None) -> Dict[str, Any]:
    if not db_user or not isinstance(db_user, str):
        logging.error("Invalid db_user parameter: %s", db_user)
        return "db_user must be a non-empty string"

    if not db_password or not isinstance(db_password, str):
        logging.error("Invalid db_password parameter: %s", db_password)
        return "db_password must be a non-empty string"

    client = create_client()
    add_instance_request = dms_enterprise_20181101_models.SimplyAddInstanceRequest(
        database_user=db_user,
        database_password=db_password)

    if host:
        add_instance_request.host = host
    if port:
        add_instance_request.port = port
    if instance_resource_id:
        add_instance_request.instance_id = instance_resource_id
    if region:
        add_instance_request.region = region
    try:
        response = client.simply_add_instance(add_instance_request)
        if not response or not response.body:
            logging.warning("Empty response received from DMS service")
            return {}
        data = response.body.to_map()
        return data
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="getInstance",
          description="""
          Retrieve detailed instance information from DMS.     
          Parameters:
            host (str): The hostname of the database instance.
            port (str): The connection port number.
            sid (Optional[str]): Required for Oracle like databases. Defaults to None.
            Returns:
                Dict[str, Any]: A dictionary containing instance details with these keys:
                    - InstanceId: Unique instance identifier in DMS
                    - State: Current operational status
                    - InstanceType: Database Engine type
                    - InstanceAlias: Instance alias in DMS
            """)
async def getInstance(host: str,
                      port: str,
                      sid: Optional[str] = None) -> Dict[str, Any]:
    """
          Retrieve detailed instance information from DMS.
          Parameters:
            host (str): The hostname or IP address of the database instance
            port (str): Connection port number (valid range: 1-65535)
            sid (Optional[str]): Required for Oracle like databases. Defaults to None.
          Returns:
            Dict[str, Any]: A dictionary containing instance details with these keys:
                - InstanceId: Unique instance identifier in DMS
                - State: Current operational status
                - InstanceType: Database Engine type
                - InstanceAlias: Instance alias in DMS
    """
    if not host or not isinstance(host, str):
        logging.error("Invalid host parameter: %s", host)
        return "Host must be a non-empty string"

    if sid is not None and not isinstance(sid, str):
        logging.error("Invalid sid parameter: %s", sid)
        return "Sid must be a string or None"

    client = create_client()
    get_instance_request = dms_enterprise_20181101_models.GetInstanceRequest(
        host=host,
        port=port)

    if sid:
        get_instance_request.sid = sid
    try:
        response = client.get_instance(get_instance_request)
        if not response or not response.body:
            logging.warning("Empty response received from DMS service")
            return {}
        data = response.body.to_map()
        instance = data.get('Instance', {})
        return instance
    except Exception as error:
        logging.error(error)
        raise error


# @mcp.tool(name="syncInstanceMeta",
#           description="Sync instance meta", )
# async def syncInstanceMeta(InstanceId: str, IgnoreTable: bool = False) -> Dict[str, Any]:
#     client = create_client()
#     sync_instance_meta_request = dms_enterprise_20181101_models.SyncInstanceMetaRequest(
#         instance_id=InstanceId)
#     if IgnoreTable:
#         sync_instance_meta_request.ignore_table = IgnoreTable
#     try:
#         data = client.sync_instance_meta(sync_instance_meta_request)
#         return data.body.to_map()
#     except Exception as error:
#         print(error)
#         raise error


@mcp.tool(name="searchDatabase",
          description="""
            Search databases in DMS based on schemaName.
            This tool allows searching for database instances in the DMS
    using a provided search key(schemaName). It supports pagination to handle large result sets efficiently.
            Parameters:
                search_key (str): schemaName.
                page_number (int, optional): The page number to retrieve (starting from 1). Defaults to 1.
                page_size (int, optional): Number of results per page, up to a maximum of 1000. Defaults to 200.
            Returns:
                List[Dict[str, Any]]: A list of dictionaries, each representing a matched database with fields such as:
                    - DatabaseId: Unique database identifier in DMS
                    - Host: Hostname or IP address of the database instance
                    - Port: Connection port number
                    - SchemaName: Name of the database schema
                    - DbType: Database Engine type      
          """, )
async def searchDatabase(search_key: str, page_number: int = 1, page_size: int = 200) -> List[Dict[str, Any]]:
    if not search_key:
        logging.error("Invalid searchKey parameter: %s", search_key)
        return "searchKey must be a non-empty string"

    client = create_client()
    search_database_request = dms_enterprise_20181101_models.SearchDatabaseRequest(
        search_key=search_key, page_number=page_number, page_size=page_size)

    try:
        response = client.search_database(search_database_request)
        if not response or not response.body:
            logging.warning("Empty response received from DMS service")
            return []
        data = response.body.to_map()
        search_db_list = data.get('SearchDatabaseList', {})
        db_list = search_db_list.get('SearchDatabase', [])
        return db_list
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="getDatabase",
          description="""
          Retrieve detailed information about a specific database from DMS.
          This tool fetches metadata for a database instance in the DMS
    based on connection parameters and schema name. Supports Oracle-specific SID specification.
    If you don't know host port, please use searchDatabase tool instead.
          Parameters:
            host (str): Hostname or IP address of the database instance.
            port (str): Connection port number (valid range: 1-65535).
            schema_name (str): Name of the database schema.
            sid (Optional[str], optional): Required for Oracle like databases. Defaults to None.
         Returns:
            Dict[str, Any]: A dictionary containing database metadata with the following keys:
                - DatabaseId: Unique database identifier in DMS
                - SchemaName: Name of the database schema
                - DbType: Database Engine type    
                - InstanceAlias: Instance alias in DMS
                - InstanceId: Instance identifier in DMS
                - State: Current operational status
          """)
async def getDatabase(host: str, port: str, schema_name: str, sid: Optional[str] = None) -> Dict[str, Any]:
    if not isinstance(host, str) or not host.strip():
        logging.error("Invalid host parameter: %s", host)
        raise ValueError("Host must be a non-empty string")

    if not isinstance(schema_name, str) or not schema_name.strip():
        logging.error("Invalid schema_name parameter: %s", schema_name)
        raise ValueError("Schema name must be a non-empty string")

    client = create_client()
    get_database_request = dms_enterprise_20181101_models.GetDatabaseRequest(
        host=host,
        port=port,
        schema_name=schema_name)
    if sid:
        get_database_request.sid = sid
    try:
        response = client.get_database(get_database_request)
        if not response or not response.body:
            logging.warning("Empty response received from DMS service")
            return []
        data = response.body.to_map()
        database = data.get('Database', {})
        return database
    except Exception as error:
        logging.error(error)
        raise error


# @mcp.tool(name="searchTable",
#           description="""
#           Search for database tables in DMS based on tableName.
#           This tool allows searching for database tables in the DMS
#           using a provided search key(tableName).
#           Parameters:
#             searchKey (str): A non-empty string used as the search keyword. Used to match table names.
#           Returns:
#             List[Dict[str, Any]]: A list of dictionaries, each representing a matched table with fields such as:
#                 - DatabaseId: ID of parent database
#                 - TableName: Name of the table
#                 - DbName: Database name
#                 - TableGuid: Unique table identifier
#           """)
# async def searchTable(searchKey: str) -> List[Dict[str, Any]]:
#     if not isinstance(searchKey, str) or not searchKey.strip():
#         logging.error("Invalid searchKey parameter: %s", searchKey)
#         raise ValueError("searchKey must be a non-empty string")
#
#     client = create_client()
#     search_table_request = dms_enterprise_20181101_models.SearchTableRequest(
#         search_key=searchKey, return_guid=True)
#     try:
#         response = client.search_table(search_table_request)
#         if response is None or not hasattr(response, 'body') or response.body is None:
#             logging.warning("Empty or invalid response received from DMS service")
#             return []
#         data = response.body.to_map()
#         table_list = data.get('SearchTableList', {})
#         return table_list
#     except Exception as error:
#         logging.error(error)
#         raise error


@mcp.tool(name="listTable",
          description="""
          Search for database tables in DMS based on databaseId and tableName.
          This tool allows searching for database tables in the DMS if databaseId is known. 
          If you don't known databaseId, you could obtained via getDatabase tool.
          Parameters:
            database_id (str): Required databaseId (obtained via getDatabase tool) to scope the search.
            search_name (str): A non-empty string used as the search keyword. Used to match table names.
            page_number (int, optional): Pagination page number (default: 1).
            page_size (int, optional): Number of results per page (default: 200, max: 200).
          Returns:
            Dict[str, Any] containing:
              TableList (Dict): Container for matching tables with structure:
                Table (List[Dict]): Array of table metadata objects containing:
                  - DatabaseId (int): ID of parent database
                  - TableGuid (str): Unique table identifier, with format: dmsTableId.schemaName.tableName.
                  - TableName (str): Name of table
                  - Description (str): Table description
                  - TableType (str): Type classification (NORMAL/VIEW/etc.)
              TotalCount (int): Total number of matching tables across all pages

          """)
async def listTables(database_id: str, search_name: str, page_number: int = 1, page_size: int = 200) -> Dict[str, Any]:
    client = create_client()
    list_table_request = dms_enterprise_20181101_models.ListTablesRequest(
        search_name=search_name, database_id=database_id, page_number=page_number, page_size=page_size,
        return_guid=True)
    try:
        response = client.list_tables(list_table_request)
        if response is None or not hasattr(response, 'body') or response.body is None:
            logging.warning("Empty or invalid response received from DMS service")
            return []
        data = response.body.to_map()
        return data
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="getTableDetailInfo",
          description="""
            Retrieve detailed metadata information about a specific database table including schema and index details.
          Parameters:
            table_guid (str): Unique table identifier(format: dmsTableId.schemaName.tableName). Obtained via searchTable or listTable tool.
          Returns:
            Dict[str, Any] containing:
                ColumnList: List of column metadata dictionaries with fields:
                    - ColumnName(str): Name of the column
                    - ColumnType (str): Full SQL type declaration (e.g., 'varchar(32)', 'bigint(20)')
                    - AutoIncrement (bool): Whether the column is an auto-increment field
                    - Description (str): Column comment/description text
                    - Nullable (bool): Whether NULL values are allowed
                IndexList: List of index metadata dictionaries with fields:
                    - IndexColumns (List[str]): List of column names included in the index
                    - IndexName (str): Name of the index
                    - IndexType (str): Type of index ('Primary', 'Unique', etc.)
                    - Unique (bool): Whether the index enforces uniqueness
          """)
async def getMetaTableDetailInfo(table_guid: str) -> Dict[str, Any]:
    if not isinstance(table_guid, str) or not table_guid.strip():
        logging.error("Invalid tableGuid parameter: %s", table_guid)
        raise ValueError("tableGuid must be a non-empty string")

    client = create_client()
    get_table_request = dms_enterprise_20181101_models.GetMetaTableDetailInfoRequest(
        table_guid=table_guid)
    try:
        response = client.get_meta_table_detail_info(get_table_request)
        if response is None or not hasattr(response, 'body') or response.body is None:
            logging.warning("Empty or invalid response received from DMS service")
            return []
        data = response.body.to_map()
        detail_info = data.get('DetailInfo', {})
        return detail_info
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="executeScript",
          description="""
             Execute SQL script against a database in DMS and return structured results.
          Parameters:
            database_id (str): Required DMS databaseId. Obtained via getDatabase tool.
            script (str): SQL script to execute.
          Returns:
            Dict[str, Any] containing:
                - RequestId (str): Unique request identifier
                - Results (List[Dict]): List of result sets from executed script:
                    Each result set contains:
                        - ColumnNames (List[str]): Ordered list of column names
                        - RowCount (int): Number of rows returned
                        - Rows (List[Dict[str, str]]): List of rows with column name -> value mapping
                        - Success (bool): Whether this result set was successfully retrieved
            - Success (bool): Overall operation success status    

          """)
async def executeScript(database_id: str, script: str, logic: bool = False) -> Dict[str, Any]:
    if not isinstance(script, str) or not script.strip():
        error_msg = "Script parameter must be a non-empty string"
        logging.error(error_msg)
        raise ValueError(error_msg)

    client = create_client()
    execute_script_request = dms_enterprise_20181101_models.ExecuteScriptRequest(
        db_id=database_id, script=script, logic=logic)
    try:
        response = client.execute_script(execute_script_request)
        if response is None or not hasattr(response, 'body') or response.body is None:
            logging.warning("Empty or invalid response received from DMS service")
            return []
        data = response.body.to_map()
        return data
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="nl2sql",
          description="""Generate SQL from natural language questions about database data.

          This tool converts natural language questions into SQL queries that can be executed against a database.
          If you don't have the database_id, use the searchDatabase tool first to identify the correct database.
          The sql generated could be executed via DMS executeScript tool provided in this server if necessary.

          Parameters:
            question (str): Natural language question about the database that needs to be converted to SQL.
            database_id (int): DMS databaseId. If not provided, searchDatabase will be used first.
            knowledge (Optional[str]): Additional context or database knowledge to improve SQL generation.

          Returns:
            Dict[str, Any]: A dictionary containing:
              - Sql (str): The generated SQL query based on the natural language question
          """)
async def nl2sql(database_id: str, question: str, knowledge: Optional[str] = None) -> Dict[str, Any]:
    if not isinstance(question, str) or not question.strip():
        error_msg = "Question parameter must be a non-empty string"
        logging.error(error_msg)
        raise ValueError(error_msg)

    client = create_client()
    generate_sql_from_nl_request = dms_enterprise_20181101_models.GenerateSqlFromNLRequest(
        db_id=database_id, question=question)
    if knowledge:
        generate_sql_from_nl_request.knowledge = knowledge
    try:
        response = client.generate_sql_from_nl(generate_sql_from_nl_request)
        if response is None or not hasattr(response, 'body') or response.body is None:
            logging.warning("Empty or invalid response received from DMS service")
            return []
        data = response.body.to_map()
        if data:
            sql = data.get('Data', {}).get('Sql')
        return sql
    except Exception as error:
        logging.error(error)
        raise error


def main():
    mcp.run(transport=os.getenv('SERVER_TRANSPORT', 'stdio'))


if __name__ == '__main__':
    # Initialize and run the server
    main()
