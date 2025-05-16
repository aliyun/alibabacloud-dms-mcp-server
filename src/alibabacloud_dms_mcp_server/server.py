import os
import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from typing import Dict, Any, Optional, List, Union
from urllib.parse import urlparse

from pydantic import Field, BaseModel, ConfigDict
from mcp.server.fastmcp import FastMCP

from alibabacloud_dms_enterprise20181101.client import Client as dms_enterprise20181101Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_dms_enterprise20181101 import models as dms_enterprise_20181101_models

# --- Global Logger ---
logger = logging.getLogger(__name__)


# --- Pydantic Models ---
class MyBaseModel(BaseModel):
    model_config = ConfigDict(json_dumps_params={'ensure_ascii': False})


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
    ColumnNames: List[str] = Field(description="Ordered list of column names")
    RowCount: int = Field(description="Number of rows returned")
    Rows: List[Dict[str, Any]] = Field(description="List of rows, where each row is a dictionary of column_name: value")
    MarkdownTable: Optional[str] = Field(default=None, description="Data formatted as a Markdown table string")
    Success: bool = Field(description="Whether this result set was successfully retrieved")


class ExecuteScriptResult(MyBaseModel):
    RequestId: str = Field(description="Unique request identifier")
    Results: List[ResultSet] = Field(description="List of result sets from executed script")
    Success: bool = Field(description="Overall operation success status")

    def __str__(self) -> str:
        if self.Success and self.Results:
            first_result = self.Results[0]
            if first_result.Success and first_result.MarkdownTable:
                return first_result.MarkdownTable
            elif not first_result.Success:
                return "The first result set was not successful."
            else:
                return "Result data is not available in Markdown format."
        elif not self.Success:
            return "Script execution failed."
        else:
            return "Script executed successfully, but no results were returned."


class SqlResult(MyBaseModel):
    sql: Optional[str] = Field(description="The generated SQL query")


# --- Aliyun Client Creation ---
def create_client() -> dms_enterprise20181101Client:
    config = open_api_models.Config(
        access_key_id=os.getenv('ALIBABA_CLOUD_ACCESS_KEY_ID', ""),
        access_key_secret=os.getenv('ALIBABA_CLOUD_ACCESS_KEY_SECRET', ""),
        security_token=os.getenv('ALIBABA_CLOUD_SECURITY_TOKEN')
    )
    config.endpoint = f'dms-enterprise.cn-hangzhou.aliyuncs.com'
    config.user_agent = "dms-mcp"
    return dms_enterprise20181101Client(config)


async def add_instance(
        db_user: str = Field(description="The username used to connect to the database"),
        db_password: str = Field(description="The password used to connect to the database"),
        instance_resource_id: Optional[str] = Field(default=None, description="The resource id of the instance"),
        host: Optional[str] = Field(default=None, description="The hostname of the database instance"),
        port: Optional[str] = Field(default=None, description="The connection port number"),
        region: Optional[str] = Field(default=None, description="The region (e.g., 'cn-hangzhou')")
) -> InstanceInfo:
    if not db_user or not isinstance(db_user, str):
        raise ValueError("db_user must be a non-empty string")
    if not db_password or not isinstance(db_password, str):
        raise ValueError("db_password must be a non-empty string")
    client = create_client()
    req = dms_enterprise_20181101_models.SimplyAddInstanceRequest(database_user=db_user, database_password=db_password)
    if host: req.host = host
    if port: req.port = port
    if instance_resource_id: req.instance_id = instance_resource_id
    if region: req.region = region
    try:
        resp = client.simply_add_instance(req)
        return InstanceInfo(**resp.body.to_map()) if resp and resp.body else InstanceInfo()
    except Exception as e:
        logger.error(f"Error in add_instance: {e}")
        raise


async def get_instance(
        host: str = Field(description="The hostname of the database instance"),
        port: str = Field(description="The connection port number"),
        sid: Optional[str] = Field(default=None, description="Required for Oracle like databases")
) -> InstanceDetail:
    client = create_client()
    req = dms_enterprise_20181101_models.GetInstanceRequest(host=host, port=port)
    if sid: req.sid = sid
    try:
        resp = client.get_instance(req)
        instance_data = resp.body.to_map().get('Instance', {}) if resp and resp.body else {}
        return InstanceDetail(**instance_data)
    except Exception as e:
        logger.error(f"Error in get_instance: {e}")
        raise


async def search_database(
        search_key: str = Field(description="database name to search for"),
        page_number: int = Field(default=1, description="Page number (starting from 1)"),
        page_size: int = Field(default=200, description="Results per page (max 1000)")
) -> List[DatabaseInfo]:
    client = create_client()
    req = dms_enterprise_20181101_models.SearchDatabaseRequest(search_key=search_key, page_number=page_number,
                                                               page_size=page_size)
    try:
        resp = client.search_database(req)
        if not resp or not resp.body: return []
        db_list_data = resp.body.to_map().get('SearchDatabaseList', {}).get('SearchDatabase', [])
        result = []
        for db in db_list_data:
            db_info_map = {"DatabaseId": db.get("DatabaseId"), "Host": db.get("Host"), "Port": db.get("Port"),
                           "DbType": db.get("DbType")}
            db_info_map["SchemaName"] = f'{db.get("CatalogName", "")}.{db.get("SchemaName", "")}' if db.get(
                "CatalogName") != 'def' else db.get("SchemaName", "")
            result.append(DatabaseInfo(**db_info_map))
        return result
    except Exception as e:
        logger.error(f"Error in search_database: {e}")
        raise


async def get_database(
        host: str = Field(description="Hostname or IP of the database instance"),
        port: str = Field(description="Connection port number"),
        schema_name: str = Field(description="Name of the database schema"),
        sid: Optional[str] = Field(default=None, description="Required for Oracle like databases")
) -> DatabaseDetail:
    client = create_client()
    req = dms_enterprise_20181101_models.GetDatabaseRequest(host=host, port=port, schema_name=schema_name)
    if sid: req.sid = sid
    try:
        resp = client.get_database(req)
        db_data = resp.body.to_map().get('Database', {}) if resp and resp.body else {}
        return DatabaseDetail(**db_data)
    except Exception as e:
        logger.error(f"Error in get_database: {e}")
        raise


async def list_tables(  # Renamed from listTable to follow convention
        database_id: str = Field(description="DMS databaseId"),
        search_name: str = Field(description="Search keyword for table names"),
        page_number: int = Field(default=1, description="Pagination page number"),
        page_size: int = Field(default=200, description="Results per page (max 200)")
) -> Dict[str, Any]:
    client = create_client()
    req = dms_enterprise_20181101_models.ListTablesRequest(database_id=database_id, search_name=search_name,
                                                           page_number=page_number, page_size=page_size,
                                                           return_guid=True)
    try:
        resp = client.list_tables(req)
        return resp.body.to_map() if resp and resp.body else {}
    except Exception as e:
        logger.error(f"Error in list_tables: {e}")
        raise


async def get_meta_table_detail_info(
        table_guid: str = Field(description="Unique table identifier (format: dmsTableId.schemaName.tableName)")
) -> TableDetail:
    client = create_client()
    req = dms_enterprise_20181101_models.GetMetaTableDetailInfoRequest(table_guid=table_guid)
    try:
        resp = client.get_meta_table_detail_info(req)
        detail_info = resp.body.to_map().get('DetailInfo', {}) if resp and resp.body else {}
        return TableDetail(**detail_info)
    except Exception as e:
        logger.error(f"Error in get_meta_table_detail_info: {e}")
        raise


def _format_as_markdown_table(column_names: List[str], rows: List[Dict[str, Any]]) -> str:
    if not column_names or not rows: return ""
    header = "| " + " | ".join(column_names) + " |"
    separator = "| " + " | ".join(["---"] * len(column_names)) + " |"
    table_rows_str = [header, separator]
    for row_data in rows:
        row_values = [str(row_data.get(col, "")) for col in column_names]
        table_rows_str.append("| " + " | ".join(row_values) + " |")
    return "\n".join(table_rows_str)


async def execute_script(
        database_id: str = Field(description="DMS databaseId"),
        script: str = Field(description="SQL script to execute"),
        logic: bool = Field(default=False, description="Whether to use logical execution mode")
) -> ExecuteScriptResult:  # Return the object, __str__ will be used by wrapper if needed
    client = create_client()
    req = dms_enterprise_20181101_models.ExecuteScriptRequest(db_id=database_id, script=script, logic=logic)
    try:
        resp = client.execute_script(req)
        if not resp or not resp.body:
            return ExecuteScriptResult(RequestId="", Results=[], Success=False)
        data = resp.body.to_map()
        processed_results = []
        if data.get('Success') and data.get('Results'):
            for res_item in data.get('Results', []):
                if res_item.get('Success'):
                    column_names = res_item.get('ColumnNames', [])
                    rows_data = res_item.get('Rows', [])
                    markdown_table = _format_as_markdown_table(column_names, rows_data)
                    processed_results.append(
                        ResultSet(ColumnNames=column_names, RowCount=res_item.get('RowCount', 0), Rows=rows_data,
                                  MarkdownTable=markdown_table, Success=True))
                else:
                    processed_results.append(
                        ResultSet(ColumnNames=[], RowCount=0, Rows=[], MarkdownTable=None, Success=False))
        return ExecuteScriptResult(RequestId=data.get('RequestId', ""), Results=processed_results,
                                   Success=data.get('Success', False))
    except Exception as e:
        logger.error(f"Error in execute_script: {e}")
        raise


async def nl2sql(
        database_id: str = Field(description="DMS databaseId"),
        question: str = Field(description="Natural language question"),
        knowledge: Optional[str] = Field(default=None, description="Additional context")
) -> SqlResult:
    client = create_client()
    req = dms_enterprise_20181101_models.GenerateSqlFromNLRequest(db_id=database_id, question=question)
    if knowledge: req.knowledge = knowledge
    try:
        resp = client.generate_sql_from_nl(req)
        if not resp or not resp.body: return SqlResult(sql=None)
        data = resp.body.to_map()
        sql_content = data.get('Data', {}).get('Sql') if data else None
        return SqlResult(sql=sql_content)
    except Exception as e:
        logger.error(f"Error in nl2sql_explicit_db: {e}")
        raise


# --- ToolRegistry Class ---
class ToolRegistry:
    def __init__(self, mcp: FastMCP):
        self.mcp = mcp
        self.default_database_id: Optional[str] = getattr(self.mcp.state, 'default_database_id', None)

    def register_tools(self) -> FastMCP:
        if self.default_database_id:
            logger.info(f"DATABASE_ID is set ('{self.default_database_id}'). Registering configured toolset.")
            self._register_configured_db_toolset()
        else:
            logger.info("DATABASE_ID not set. Registering full toolset.")
            self._register_full_toolset()
        return self.mcp

    def _register_configured_db_toolset(self):
        @self.mcp.tool(name="listTables",
                       description="Lists tables in the database. Search by name is supported.",
                       annotations={"title": "List Tables (Pre-configured DB)", "readOnlyHint": True})
        async def list_tables_configured(
                search_name: str = Field(
                    description="A non-empty string used as the search keyword to match table names."),
                page_number: int = Field(description="Pagination page number", default=1),
                page_size: int = Field(description="Number of results per page", default=200)
        ) -> Dict[str, Any]:
            return await list_tables(database_id=self.default_database_id, search_name=search_name,
                                     page_number=page_number, page_size=page_size)

        self.mcp.tool(name="getTableDetailInfo",
                      description="Retrieve detailed metadata information for a specific table using its GUID.",
                      annotations={"title": "Get Table Details", "readOnlyHint": True})(get_meta_table_detail_info)

        @self.mcp.tool(name="executeScript",
                       description="Executes an SQL script against the pre-configured database.",
                       annotations={"title": "Execute SQL (Pre-configured DB)", "readOnlyHint": False,
                                    "destructiveHint": True})
        async def execute_script_configured(
                script: str = Field(description="SQL script to execute"),
                logic: bool = Field(description="Whether to use logical execution mode", default=False)
        ) -> str:
            result_obj = await execute_script(database_id=self.default_database_id, script=script, logic=logic)
            return str(result_obj)

        @self.mcp.tool(name="askDatabase",
                       description="Ask a question in natural language to the pre-configured database and get results directly.",
                       annotations={"title": "Ask Pre-configured Database", "readOnlyHint": True})
        async def ask_database_configured(
                question: str = Field(
                    description="Your question in natural language about the pre-configured database."),
                knowledge: Optional[str] = Field(default=None,
                                                 description="Optional: Additional context to help formulate the SQL query.")
        ) -> str:
            sql_result_obj = await nl2sql(database_id=self.default_database_id, question=question,
                                                      knowledge=knowledge)
            if not sql_result_obj or not sql_result_obj.sql:
                logger.warning(f"Failed to generate SQL for question: {question} on preconfigured DB.")
                return "Error: Could not generate an SQL query from your question."

            generated_sql = sql_result_obj.sql
            logger.info(f"Generated SQL for pre-configured DB: {generated_sql}")
            try:
                execution_result_obj = await execute_script(database_id=self.default_database_id, script=generated_sql,
                                                            logic=False)
                return str(execution_result_obj)
            except Exception as e:
                logger.error(f"Error executing SQL for pre-configured DB: {e}")
                return f"Error: An issue occurred while executing the query: {str(e)}"

    def _register_full_toolset(self):
        self.mcp.tool(name="addInstance",
                      description="Add an instance to DMS. If the instance already exists, it will return the existing instance information.",
                      annotations={"title": "添加或获取DMS实例", "readOnlyHint": False, "destructiveHint": False})(
            add_instance)
        self.mcp.tool(name="getInstance", description="Retrieve detailed instance information from DMS.",
                      annotations={"title": "获取DMS实例详情", "readOnlyHint": True})(get_instance)
        self.mcp.tool(name="searchDatabase", description="Search databases in DMS based on their name.",
                      annotations={"title": "搜索DMS数据库", "readOnlyHint": True})(search_database)
        self.mcp.tool(name="getDatabase",
                      description="Retrieve detailed information about a specific database from DMS.",
                      annotations={"title": "获取DMS数据库详情", "readOnlyHint": True})(get_database)
        self.mcp.tool(name="listTables",
                      description="Search for database tables in DMS based on databaseId and tableName.",
                      annotations={"title": "列出DMS表", "readOnlyHint": True})(list_tables)
        self.mcp.tool(name="getTableDetailInfo",
                      description="Retrieve detailed metadata information about a specific database table including "
                                  "schema and index details.",
                      annotations={"title": "获取DMS表详细信息", "readOnlyHint": True})(get_meta_table_detail_info)

        @self.mcp.tool(name="executeScript",
                       description="Execute SQL script against a database in DMS and return structured results.",
                       annotations={"title": "在DMS中执行SQL脚本", "readOnlyHint": False, "destructiveHint": True})
        async def execute_script_full_wrapper(
                database_id: str = Field(description="Required DMS databaseId. Obtained via getDatabase tool"),
                script: str = Field(description="SQL script to execute"),
                logic: bool = Field(description="Whether to use logical execution mode", default=False)
        ) -> str:  # Return string representation
            result_obj = await execute_script(database_id=database_id, script=script, logic=logic)
            return str(result_obj)

        self.mcp.tool(name="generateSql", description="Generate SELECT-type SQL queries from natural language input.",
                      annotations={"title": "自然语言转SQL (DMS)", "readOnlyHint": True})(nl2sql)


# --- Lifespan Function ---
@asynccontextmanager
async def lifespan(app: FastMCP) -> AsyncGenerator[None, None]:
    logger.info("Initializing DMS MCP Server via lifespan")

    # Ensure app.state exists
    if not hasattr(app, 'state') or app.state is None:
        class AppState: pass
        app.state = AppState()

    app.state.default_database_id = None  # Initialize default_database_id

    dms_dsn = os.getenv("DataSourceName")
    if dms_dsn:
        logger.info(f"DataSourceName environment variable found: {dms_dsn}")
        try:
            parsed_dsn = urlparse(dms_dsn)
            db_user = parsed_dsn.username
            db_password = parsed_dsn.password
            db_host = parsed_dsn.hostname
            db_port = parsed_dsn.port
            db_name_path = parsed_dsn.path.lstrip('/') if parsed_dsn.path else None

            if not all([db_user, db_password, db_host, db_port, db_name_path]):
                logger.error("DataSourceName is incomplete. Missing one or more parts (username, password, host, port, dbname).")
            else:
                logger.info(f"Attempting to add/verify instance: {db_host}:{db_port}")
                instance_info = await add_instance(
                    db_user=db_user,
                    db_password=db_password,
                    host=db_host,
                    port=str(db_port)
                )
                # We assume add_instance is successful if no exception is raised.
                # The actual InstanceId might not be directly used here if it's just for verification.
                logger.info(f"Instance {db_host}:{db_port} processed by add_instance. Searching for database: {db_name_path}")
                
                databases = await search_database(search_key=db_name_path)
                found_db_id = None
                if databases:
                    for db_info in databases:
                        # search_database returns SchemaName which might include catalog.
                        # We need to ensure the core schema name matches, and host/port also match.
                        # For simplicity, we'll assume db_name_path is the direct schema name for now.
                        # A more robust match might be needed if SchemaName from search_database is complex.
                        if db_info.SchemaName == db_name_path and db_info.Host == db_host and str(db_info.Port) == str(db_port):
                            found_db_id = db_info.DatabaseId
                            logger.info(f"Matching database found: ID {found_db_id} for {db_name_path} at {db_host}:{db_port}")
                            break
                
                if found_db_id:
                    app.state.default_database_id = found_db_id
                    logger.info(f"Successfully configured default_database_id to {found_db_id} using DataSourceName.")
                else:
                    logger.warning(f"Could not find a matching database for {db_name_path} at {db_host}:{db_port} after processing DataSourceName.")

        except ValueError as ve: # Catch errors from add_instance if db_user/db_password are invalid
            logger.error(f"ValueError during DataSourceName processing (e.g. invalid credentials for add_instance): {ve}")
        except Exception as e:
            logger.error(f"Error processing DataSourceName '{dms_dsn}': {e}")
    else:
        logger.info("DataSourceName environment variable not found.")

    # Fallback to DATABASE_ID if not set by DataSourceName
    if app.state.default_database_id is None:
        logger.info("Attempting to use DATABASE_ID as fallback.")
        preconfigured_db_id = os.getenv("DATABASE_ID")
        if preconfigured_db_id:
            app.state.default_database_id = preconfigured_db_id
            logger.info(f"DATABASE_ID found and stored in app.state: {preconfigured_db_id}")
        else:
            # app.state.default_database_id is already None, so just log
            logger.info("DATABASE_ID not found, and no configuration from DataSourceName. No default database configured.")
    
    if app.state.default_database_id:
        logger.info(f"Final default_database_id to be used: {app.state.default_database_id}")
    else:
        logger.info("No default database ID configured after checking DataSourceName and DATABASE_ID.")

    registry = ToolRegistry(mcp=app)
    registry.register_tools()

    yield

    logger.info("Shutting down DMS MCP Server via lifespan")
    if hasattr(app.state, 'default_database_id'):
        delattr(app.state, 'default_database_id')


# --- FastMCP Instance Creation & Server Run ---
mcp = FastMCP(
    "DatabaseManagementAssistant",
    lifespan=lifespan,
    on_duplicate_tools="replace"
)


def run_server():
    log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(level=log_level_str, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger.info(f"Starting DMS MCP server with log level {log_level_str}")
    mcp.run(transport=os.getenv('SERVER_TRANSPORT', 'stdio'))


if __name__ == "__main__":
    run_server()
