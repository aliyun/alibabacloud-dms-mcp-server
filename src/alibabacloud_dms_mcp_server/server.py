from pydantic import Field, BaseModel, ConfigDict
from typing import Dict, Any, Optional, List, Union
from alibabacloud_dms_enterprise20181101.client import Client as dms_enterprise20181101Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_dms_enterprise20181101 import models as dms_enterprise_20181101_models
from mcp.server import FastMCP
import os
import logging


# 定义共享配置的Pydantic基础模型
class MyBaseModel(BaseModel):
    # 在 Pydantic 模型转换为 JSON 时，保留非 ASCII 字符（如中文、emoji）
    model_config = ConfigDict(json_dumps_params={'ensure_ascii': False})


# 定义Pydantic模型
class InstanceInfo(MyBaseModel):
    instance_id: Any = Field(description="Unique instance identifier in DMS", default=None)
    host: Any = Field(description="The hostname of the database instance", default=None)
    port: Any = Field(description="The connection port number", default=None)


class InstanceDetail(MyBaseModel):
    InstanceId: Any = Field(description="Unique instance identifier in DMS", default=None)
    State: Any = Field(description="Current operational status", default=None)
    InstanceType: Any = Field(description="Database Engine type", default=None)
    InstanceAlias: Any = Field(description="Instance alias in DMS", default=None)


class DatabaseInfo(MyBaseModel):
    DatabaseId: Any = Field(description="Unique database identifier in DMS")
    Host: Any = Field(description="Hostname or IP address of the database instance")
    Port: Any = Field(description="Connection port number")
    DbType: Any = Field(description="Database Engine type")
    SchemaName: Any = Field(description="Name of the database schema")


class DatabaseDetail(MyBaseModel):
    DatabaseId: Any = Field(description="Unique database identifier in DMS", default=None)
    SchemaName: Any = Field(description="Name of the database schema", default=None)
    DbType: Any = Field(description="Database Engine type", default=None)
    InstanceAlias: Any = Field(description="Instance alias in DMS", default=None)
    InstanceId: Any = Field(description="Instance identifier in DMS", default=None)
    State: Any = Field(description="Current operational status", default=None)


class Column(MyBaseModel):
    ColumnName: Any = Field(description="Name of the column")
    ColumnType: Any = Field(description="Full SQL type declaration (e.g., 'varchar(32)', 'bigint(20)')")
    AutoIncrement: Any = Field(description="Whether the column is an auto-increment field")
    Description: Any = Field(description="Column comment/description text")
    Nullable: Any = Field(description="Whether NULL values are allowed")


class Index(MyBaseModel):
    IndexColumns: Any = Field(description="List of column names included in the index")
    IndexName: Any = Field(description="Name of the index")
    IndexType: Any = Field(description="Type of index ('Primary', 'Unique', etc.)")
    Unique: Any = Field(description="Whether the index enforces uniqueness")


class TableDetail(MyBaseModel):
    ColumnList: Any = Field(description="List of column metadata", default=None)
    IndexList: Any = Field(description="List of index metadata", default=None)


class ResultSet(MyBaseModel):
    ColumnNames: Any = Field(description="Ordered list of column names")
    RowCount: Any = Field(description="Number of rows returned")
    Rows: Any = Field(description="List of rows with column name -> value mapping")
    Success: Any = Field(description="Whether this result set was successfully retrieved")


class ExecuteScriptResult(MyBaseModel):
    RequestId: Any = Field(description="Unique request identifier")
    Results: Any = Field(description="List of result sets from executed script")
    Success: Any = Field(description="Overall operation success status")


class SqlResult(MyBaseModel):
    sql: Any = Field(description="The generated SQL query based on the natural language question")


mcp = FastMCP("dms-mcp-server")


def create_client() -> dms_enterprise20181101Client:
    """
    初始化阿里云 DMS 账号Client
    
    使用环境变量中的访问凭证创建一个DMS服务的客户端实例。
    支持通过AK/SK或STS方式进行认证。
    
    Returns:
        dms_enterprise20181101Client: 已配置的DMS客户端实例
        
    Raises:
        Exception: 如果客户端初始化失败
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
          description="Add an instance to DMS. If the instance already exists, it will return the existing instance information.")
async def addInstance(
        db_user: str = Field(description="The username used to connect to the database"),
        db_password: str = Field(description="The password used to connect to the database"),
        instance_resource_id: Optional[str] = Field(
            description="The resource id of the instance, typically assigned by the cloud provider", default=None),
        host: Optional[str] = Field(description="The hostname of the database instance", default=None),
        port: Optional[str] = Field(description="The connection port number", default=None),
        region: Optional[str] = Field(description="The region where the instance is located (e.g., 'cn-hangzhou')",
                                      default=None)
) -> InstanceInfo:
    """Add an instance to DMS or get existing instance information"""
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
        return InstanceInfo(**data)
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="getInstance",
          description="Retrieve detailed instance information from DMS.")
async def getInstance(
        host: str = Field(description="The hostname of the database instance"),
        port: str = Field(description="The connection port number"),
        sid: Optional[str] = Field(description="Required for Oracle like databases", default=None)
) -> InstanceDetail:
    """Retrieve detailed instance information from DMS"""
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
        return InstanceDetail(**instance)
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="searchDatabase",
          description="Search databases in DMS based on schemaName. This tool allows searching for database instances "
                      "in the DMS using a provided search key(schemaName). It supports pagination to handle large "
                      "result sets efficiently.")
async def searchDatabase(
        search_key: str = Field(description="Schema name to search for"),
        page_number: int = Field(description="The page number to retrieve (starting from 1)", default=1),
        page_size: int = Field(description="Number of results per page, up to a maximum of 1000", default=200)
) -> List[DatabaseInfo]:
    """Search databases in DMS based on schema name"""
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
        result_list = []
        for db in db_list:
            db_info = {
                "DatabaseId": db.get("DatabaseId", ""),
                "Host": db.get("Host", ""),
                "Port": db.get("Port", ""),
                "DbType": db.get("DbType", ""),
            }
            if db.get("CatalogName") != 'def':
                db_info["SchemaName"] = f'{db.get("CatalogName", "")}.{db.get("SchemaName", "")}'
            else:
                db_info["SchemaName"] = db.get("SchemaName", "")
            result_list.append(DatabaseInfo(**db_info))
        return result_list
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="getDatabase",
          description="Retrieve detailed information about a specific database from DMS. This tool fetches metadata for a database instance in the DMS "
                      "based on connection parameters and schema name. Supports Oracle-specific SID specification. "
                      "If you don't know host port, please use searchDatabase tool instead.")
async def getDatabase(
        host: str = Field(description="Hostname or IP address of the database instance"),
        port: str = Field(description="Connection port number (valid range: 1-65535)"),
        schema_name: str = Field(description="Name of the database schema"),
        sid: Optional[str] = Field(description="Required for Oracle like databases", default=None)
) -> DatabaseDetail:
    """Retrieve detailed information about a specific database from DMS"""
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
        return DatabaseDetail(**database)
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="listTable",
          description="Search for database tables in DMS based on databaseId and tableName. This tool allows searching for database tables in the DMS "
                      "if databaseId is known. If you don't known databaseId, you could obtained via getDatabase tool.")
async def listTables(
        database_id: str = Field(description="Required databaseId (obtained via getDatabase tool) to scope the search"),
        search_name: str = Field(
            description="A non-empty string used as the search keyword. Used to match table names"),
        page_number: int = Field(description="Pagination page number", default=1),
        page_size: int = Field(description="Number of results per page (default: 200, max: 200)", default=200)
) -> Dict[str, Any]:
    """Search for database tables in DMS if databaseId is known"""
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
          description="Retrieve detailed metadata information about a specific database table including schema and index details.")
async def getMetaTableDetailInfo(
        table_guid: str = Field(
            description="Unique table identifier(format: dmsTableId.schemaName.tableName). Obtained via searchTable or listTable tool")
) -> TableDetail:
    """Retrieve detailed metadata information about a specific database table"""
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
        return TableDetail(**detail_info)
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="executeScript",
          description="Execute SQL script against a database in DMS and return structured results.")
async def executeScript(
        database_id: str = Field(description="Required DMS databaseId. Obtained via getDatabase tool"),
        script: str = Field(description="SQL script to execute"),
        logic: bool = Field(description="Whether to use logical execution mode", default=False)
) -> ExecuteScriptResult:
    """Execute SQL script against a database in DMS and return structured results"""
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
        return ExecuteScriptResult(**data)
    except Exception as error:
        logging.error(error)
        raise error


@mcp.tool(name="nl2sql",
          description="Generate SELECT-type SQL queries from natural language input to answer arbitrary database "
                      "query requests. The tool can automatically determine the relevant database tables from user "
                      "questions and generate corresponding SQL statements for data retrieval.If you don't have the "
                      "database_id, use the searchDatabase tool first to identify the"
                      "correct database. The sql generated could be executed via DMS executeScript tool provided in "
                      "this server if necessary.")
async def nl2sql(
        database_id: str = Field(description="DMS databaseId. If not provided, searchDatabase will be used first"),
        question: str = Field(
            description="Natural language question about the database that needs to be converted to SQL"),
        knowledge: Optional[str] = Field(
            description="Additional context or database knowledge to improve SQL generation", default=None)
) -> SqlResult:
    """Generate SQL from natural language questions about database data"""
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
        return SqlResult(sql=sql)
    except Exception as error:
        logging.error(error)
        raise error


def main():
    mcp.run(transport=os.getenv('SERVER_TRANSPORT', 'stdio'))


if __name__ == '__main__':
    # Initialize and run the server
    main()
