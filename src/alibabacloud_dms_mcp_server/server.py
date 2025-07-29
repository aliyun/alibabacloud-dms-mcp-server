import os
import logging
import random
import string
import json
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from typing import Dict, Any, Optional, List, Union
from urllib.parse import urlparse

from pydantic import Field, BaseModel, ConfigDict
from mcp.server.fastmcp import FastMCP

from alibabacloud_dms_enterprise20181101.client import Client as dms_enterprise20181101Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_dms_enterprise20181101 import models as dms_enterprise_20181101_models
from alibabacloud_dts20200101 import models as dts_20200101_models
from alibabacloud_dts20200101.client import Client as DtsClient
from alibabacloud_tea_openapi.models import Config
from alibabacloud_tea_util import models as util_models

# --- Global Logger ---
logger = logging.getLogger(__name__)

g_reserved = '''{
    "targetTableMode": "0",
    "dbListCaseChangeMode": "default",
    "isAnalyzer": false,
    "eventMove": false,
    "tableAnalyze": false,
    "whitelist.dms.online.ddl.enable": false,
    "sqlparser.dms.original.ddl": true,
    "whitelist.ghost.online.ddl.enable": false,
    "sqlparser.ghost.original.ddl": false,
    "privilegeMigration": false,
    "definer": false,
    "privilegeDbList": "[]",
    "maxRetryTime": 43200,
    "retry.blind.seconds": 600,
    "srcSSL": "0",
    "srcMySQLType": "HighAvailability",
    "destSSL": "0",
    "a2aFlag": "2.0",
    "channelInfo": "mcp",
    "autoStartModulesAfterConfig": "none"
}
'''


# --- Pydantic Models ---
class MyBaseModel(BaseModel):
    model_config = ConfigDict(json_dumps_params={'ensure_ascii': False})


class AskDatabaseResult(MyBaseModel):
    executed_sql: str = Field(description="The SQL query that was executed.")
    execution_result: str = Field(description="The result of the SQL query execution.")


class InstanceInfo(MyBaseModel):
    instance_id: Any = Field(description="Unique instance identifier in DMS", default=None)
    host: Any = Field(description="The hostname of the database instance", default=None)
    port: Any = Field(description="The connection port number", default=None)


class InstanceDetail(MyBaseModel):
    InstanceId: Any = Field(description="Unique instance identifier in DMS", default=None)
    State: Any = Field(description="Current operational status", default=None)
    InstanceType: Any = Field(description="Database Engine type", default=None)
    InstanceAlias: Any = Field(description="Instance alias in DMS", default=None)
    EnvType: Any = Field(description="The environment type of the instance (e.g., production, development, etc.)",
                         default=None)
    Host: Any = Field(description="The hostname of the database instance", default=None)
    Port: Any = Field(description="The connection port number", default=None)
    InstanceSource: Any = Field(description="The instance source (e.g., RDS, VPC_IDC, ECS_OWN, PUBLIC_OWN etc.)",
                                default=None)


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
    Message: str = Field(description="Additional message returned")


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
                return first_result.Message
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
        access_key_id=os.getenv('ALIBABA_CLOUD_ACCESS_KEY_ID'),
        access_key_secret=os.getenv('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
        security_token=os.getenv('ALIBABA_CLOUD_SECURITY_TOKEN'),
        read_timeout=60 * 1000  # 设置读取超时时间为60秒
    )
    config.endpoint = f'dms-enterprise.cn-hangzhou.aliyuncs.com'
    config.user_agent = "dms-mcp"
    return dms_enterprise20181101Client(config)


def get_dts_client(region_id: str):
    config = Config(
        access_key_id=os.getenv('ALIBABA_CLOUD_ACCESS_KEY_ID'),
        access_key_secret=os.getenv('ALIBABA_CLOUD_ACCESS_KEY_SECRET'),
        security_token=os.getenv('ALIBABA_CLOUD_SECURITY_TOKEN'),
        region_id=region_id,
        protocol="https",
        connect_timeout=10 * 1000,
        read_timeout=300 * 1000
    )
    client = DtsClient(config)
    return client


async def add_instance(
        db_user: str = Field(description="The username used to connect to the database"),
        db_password: str = Field(description="The password used to connect to the database"),
        instance_resource_id: Optional[str] = Field(default=None, description="Aliyun instance resource ID"),
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
    if host:
        req.host = host
    if port:
        req.port = port
    if instance_resource_id:
        req.instance_id = instance_resource_id
    if region:
        req.region = region
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


async def list_instance(
        search_key: Optional[str] = Field(default=None, description="Optional search key (e.g., instance host, instance alias, etc.)"),
        db_type: Optional[str] = Field(default=None, description="Optional instanceType, or called dbType (e.g., mysql, polardb, oracle, "
                                                                 "postgresql, sqlserver, polardb-pg, etc.)"),
        env_type: Optional[str] = Field(default=None, description="Optional instance environment type (e.g., product, dev, test, etc. )")
) -> List[InstanceDetail]:
    client = create_client()
    req = dms_enterprise_20181101_models.ListInstancesRequest()
    if search_key:
        req.search_key = search_key
    if db_type:
        req.db_type = db_type
    if env_type:
        req.env_type = env_type
    try:
        resp = client.list_instances(req)

        instance_data = resp.body.to_map()
        if "InstanceList" not in instance_data:
            return []
        instance_list = instance_data["InstanceList"]
        # 检查是否有 Instance 键
        if "Instance" not in instance_list:
            return []
        instances = instance_list["Instance"]
        # 检查是否为空
        if not isinstance(instances, list) or not instances:
            return []
        return [InstanceDetail(**item) for item in instances]
    except Exception as e:
        logger.error(f"Error in list_instance: {e}")
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
    if sid:
        req.sid = sid
    try:
        resp = client.get_database(req)
        db_data = resp.body.to_map().get('Database', {}) if resp and resp.body else {}
        return DatabaseDetail(**db_data)
    except Exception as e:
        logger.error(f"Error in get_database: {e}")
        raise


async def list_tables(  # Renamed from listTable to follow convention
        database_id: str = Field(description="DMS databaseId"),
        search_name: Optional[str] = Field(default=None, description="Optional: Search keyword for table names"),
        page_number: int = Field(default=1, description="Pagination page number"),
        page_size: int = Field(default=200, description="Results per page (max 200)")
) -> Dict[str, Any]:
    if not search_name:
        search_name = "%"
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
        table_guid: str = Field(
            description="Unique table identifier (format: dmsTableId.schemaName.tableName),Example: IDB_1567890.mySchema.myTable")
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
    if not column_names: return ""
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
                                  MarkdownTable=markdown_table, Success=True, Message=''))
                else:
                    processed_results.append(
                        ResultSet(ColumnNames=[], RowCount=0, Rows=[], MarkdownTable=None, Success=False,
                                  Message=res_item.get('Message')))
        return ExecuteScriptResult(RequestId=data.get('RequestId', ""), Results=processed_results,
                                   Success=data.get('Success', False))
    except Exception as e:
        logger.error(f"Error in execute_script: {e}")
        if "The instance is not in secure hosting mode" in str(e):
            return "当前实例尚未开启安全托管功能。您可以通过DMS控制台免费开启「安全托管模式」。请注意，该操作需要管理员或DBA身份权限。"


async def create_data_change_order(
        database_id: str = Field(description="DMS databaseId"),
        script: str = Field(description="SQL script to execute"),
        logic: bool = Field(default=False, description="Whether to use logical execution mode")
) -> Dict[str, Any]:

    client = create_client()
    req = dms_enterprise_20181101_models.CreateDataCorrectOrderRequest()
    req.comment = "Data correct order submitted by MCP"

    param = dms_enterprise_20181101_models.CreateDataCorrectOrderRequestParam()
    param.estimate_affect_rows = 1
    param.sql_type = "TEXT"
    param.exec_sql = script
    param.classify = "MCP"

    db_list = dms_enterprise_20181101_models.CreateDataCorrectOrderRequestParamDbItemList()
    db_list.db_id = database_id
    db_list.logic = logic

    db_items = [db_list]
    param.db_item_list = db_items

    req.param = param
    try:
        resp = client.create_data_correct_order(req)
        return resp.body
    except Exception as e:
        logger.error(f"Error in create_data_change_order: {e}")
        raise


async def get_order_base_info(
        order_id: str = Field(description="DMS order ID")
) -> Dict[str, Any]:

    client = create_client()
    req = dms_enterprise_20181101_models.GetOrderBaseInfoRequest()
    req.order_id = order_id
    try:
        resp = client.get_order_base_info(req)
        return resp.body
    except Exception as e:
        logger.error(f"Error in get_order_base_info: {e}")
        raise


async def submit_order_approval(
        order_id: str = Field(description="DMS order ID")
) -> Dict[str, Any]:

    client = create_client()
    req = dms_enterprise_20181101_models.SubmitOrderApprovalRequest()
    req.order_id = order_id
    try:
        resp = client.submit_order_approval(req)
        return resp.body
    except Exception as e:
        logger.error(f"Error in submit_order_approval: {e}")
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


async def configureDtsJob(
        region_id: str = Field(description="The region id of the dts job (e.g., 'cn-hangzhou')"),
        job_type: str = Field(
            description="The type of job (synchronization job: SYNC, migration job: MIGRATION, data check job: CHECK)"),
        source_endpoint_region: str = Field(description="The source endpoint region ID"),
        source_endpoint_instance_type: str = Field(
            description="The source endpoint instance type (RDS, ECS, EXPRESS, CEN, DG)"),
        source_endpoint_engine_name: str = Field(
            description="The source endpoint engine name (MySQL, PostgreSQL, SQLServer)"),
        source_endpoint_instance_id: str = Field(description="The source endpoint instance ID (e.g., 'rm-xxx')"),
        source_endpoint_user_name: str = Field(description="The source endpoint user name"),
        source_endpoint_password: str = Field(description="The source endpoint password"),
        destination_endpoint_region: str = Field(description="The destination endpoint region ID"),
        destination_endpoint_instance_type: str = Field(
            description="The destination endpoint instance type (RDS, ECS, EXPRESS, CEN, DG)"),
        destination_endpoint_engine_name: str = Field(
            description="The destination endpoint engine name (MySQL, PostgreSQL, SQLServer)"),
        destination_endpoint_instance_id: str = Field(
            description="The destination endpoint instance ID (e.g., 'rm-xxx')"),
        destination_endpoint_user_name: str = Field(description="The destination endpoint user name"),
        destination_endpoint_password: str = Field(description="The destination endpoint password"),
        db_list: Dict[str, Any] = Field(
            description='The database objects in JSON format, example 1: migration dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":true}}; example 2: migration one table task01 in dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true}}}}; example 3: migration two tables task01 and task02 in dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true},"task02":{"name":"task02","all":true}}}}')
) -> Dict[str, Any]:
    try:
        db_list_str = json.dumps(db_list, separators=(',', ':'))
        logger.info(f"Configure dts job with db_list: {db_list_str}")

        # init dts client
        client = get_dts_client(region_id)
        runtime = util_models.RuntimeOptions()

        # create dts instance
        create_dts_instance_request = dts_20200101_models.CreateDtsInstanceRequest(
            region_id=region_id,
            type=job_type,
            source_region=source_endpoint_region,
            destination_region=destination_endpoint_region,
            source_endpoint_engine_name=source_endpoint_engine_name,
            destination_endpoint_engine_name=destination_endpoint_engine_name,
            pay_type='PostPaid',
            quantity=1,
            min_du=1,
            max_du=4,
            instance_class='micro'
        )

        create_dts_instance_response = client.create_dts_instance_with_options(create_dts_instance_request, runtime)
        logger.info(f"Create dts instance response: {create_dts_instance_response.body.to_map()}")
        dts_job_id = create_dts_instance_response.body.to_map()['JobId']

        # configure dts job
        ran_job_name = 'dtsmcp-' + ''.join(random.sample(string.ascii_letters + string.digits, 6))
        custom_reserved = json.loads(g_reserved)
        dts_mcp_channel = os.getenv('DTS_MCP_CHANNEL')
        if dts_mcp_channel and len(dts_mcp_channel) > 0:
            logger.info(f"Configure dts job with custom dts mcp channel: {dts_mcp_channel}")
            custom_reserved['channelInfo'] = dts_mcp_channel
        custom_reserved_str = json.dumps(custom_reserved, separators=(',', ':'))
        logger.info(f"Configure dts job with reserved: {custom_reserved_str}")
        configure_dts_job_request = dts_20200101_models.ConfigureDtsJobRequest(
            region_id=region_id,
            dts_job_name=ran_job_name,
            source_endpoint_instance_type=source_endpoint_instance_type,
            source_endpoint_engine_name=source_endpoint_engine_name,
            source_endpoint_instance_id=source_endpoint_instance_id,
            source_endpoint_region=source_endpoint_region,
            source_endpoint_user_name=source_endpoint_user_name,
            source_endpoint_password=source_endpoint_password,
            destination_endpoint_instance_type=destination_endpoint_instance_type,
            destination_endpoint_instance_id=destination_endpoint_instance_id,
            destination_endpoint_engine_name=destination_endpoint_engine_name,
            destination_endpoint_region=destination_endpoint_region,
            destination_endpoint_user_name=destination_endpoint_user_name,
            destination_endpoint_password=destination_endpoint_password,
            structure_initialization=True,
            data_initialization=True,
            data_synchronization=False,
            job_type=job_type,
            db_list=db_list_str,
            reserve=custom_reserved_str
        )

        if dts_job_id and len(dts_job_id) > 0:
            configure_dts_job_request.dts_job_id = dts_job_id

        configure_dts_job_response = client.configure_dts_job_with_options(configure_dts_job_request, runtime)
        logger.info(f"Configure dts job response: {configure_dts_job_response.body.to_map()}")
        return configure_dts_job_response.body.to_map()
    except Exception as e:
        logger.error(f"Error occurred while configure dts job: {str(e)}")
        raise e


async def startDtsJob(
        region_id: str = Field(description="The region id of the dts job (e.g., 'cn-hangzhou')"),
        dts_job_id: str = Field(description="The job id of the dts job")
) -> Dict[str, Any]:
    try:
        client = get_dts_client(region_id)
        request = dts_20200101_models.StartDtsJobRequest(
            region_id=region_id,
            dts_job_id=dts_job_id
        )
        runtime = util_models.RuntimeOptions()
        response = client.start_dts_job_with_options(request, runtime)
        return response.body.to_map()
    except Exception as e:
        logger.error(f"Error occurred while start dts job: {str(e)}")
        raise e


async def getDtsJob(
        region_id: str = Field(description="The region id of the dts job (e.g., 'cn-hangzhou')"),
        dts_job_id: str = Field(description="The job id of the dts job")
) -> Dict[str, Any]:
    try:
        client = get_dts_client(region_id)
        request = dts_20200101_models.DescribeDtsJobDetailRequest(
            region_id=region_id,
            dts_job_id=dts_job_id
        )
        runtime = util_models.RuntimeOptions()
        response = client.describe_dts_job_detail_with_options(request, runtime)
        return response.body.to_map()
    except Exception as e:
        logger.error(f"Error occurred while describe dts job detail: {str(e)}")
        raise e


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
                search_name: Optional[str] = Field(default=None,
                                                   description="Optional: A string used as the search keyword to match table names."),
                page_number: int = Field(description="Pagination page number", default=1),
                page_size: int = Field(description="Number of results per page", default=200)
        ) -> Dict[str, Any]:
            if not search_name:
                search_name = "%"
            return await list_tables(database_id=self.default_database_id, search_name=search_name,
                                     page_number=page_number, page_size=page_size)

        self.mcp.tool(name="getTableDetailInfo",
                      description="Retrieve detailed metadata information about a specific database table including "
                                  "schema and index details. If you don't know the table_guid parameter, retrieve it using listTables.",
                      annotations={"title": "Get Table Details", "readOnlyHint": True})(get_meta_table_detail_info)

        @self.mcp.tool(name="executeScript",
                       description="Executes an SQL script against the pre-configured database.",
                       annotations={"title": "Execute SQL (Pre-configured DB)", "readOnlyHint": False,
                                    "destructiveHint": True})
        async def execute_script_configured(
                script: str = Field(description="SQL script to execute")
        ) -> str:
            result_obj = await execute_script(database_id=self.default_database_id, script=script, logic=False)
            return str(result_obj)

        @self.mcp.tool(name="createDataChangeOrder",
                       description="Execute SQL changes through a data change order, and a corresponding order ID will be returned. "
                                   "Prefer using the executeScript tool for SQL execution; "
                                   "only use this tool when explicitly instructed to perform the operation via a order.",
                       annotations={"title": "在DMS中创建数据变更工单", "readOnlyHint": False, "destructiveHint": True})
        async def create_data_change_order_configured(
                script: str = Field(description="SQL script to execute")
        ) -> str:
            result_obj = await create_data_change_order(database_id=self.default_database_id, script=script, logic=False)
            return str(result_obj)

        self.mcp.tool(name="getOrderInfo", description="Retrieve order information from DMS using the order ID.",
                      annotations={"title": "获取DMS工单详情", "readOnlyHint": True})(get_order_base_info)

        self.mcp.tool(name="submitOrderApproval", description="Submit the order for approval in DMS using the order ID.",
                      annotations={"title": "提交工单审批", "readOnlyHint": False})(submit_order_approval)

        @self.mcp.tool(name="askDatabase",
                       description="Ask a question in natural language to the pre-configured database and get results directly.",
                       annotations={"title": "Ask Pre-configured Database", "readOnlyHint": True})
        async def ask_database_configured(
                question: str = Field(
                    description="Your question in natural language about the pre-configured database."),
                knowledge: Optional[str] = Field(default=None,
                                                 description="Optional: Additional context to help formulate the SQL query.")
        ) -> AskDatabaseResult:
            sql_result_obj = await nl2sql(database_id=self.default_database_id, question=question,
                                          knowledge=knowledge)
            generated_sql = ""
            if not sql_result_obj or not sql_result_obj.sql:
                logger.warning(f"Failed to generate SQL for question: {question} on preconfigured DB.")
                return AskDatabaseResult(executed_sql=generated_sql,
                                         execution_result="Error: Could not generate an SQL query from your question.")

            generated_sql = sql_result_obj.sql
            logger.info(f"Generated SQL for pre-configured DB: {generated_sql}")
            try:
                execution_result_obj = await execute_script(database_id=self.default_database_id, script=generated_sql,
                                                            logic=False)
                return AskDatabaseResult(executed_sql=generated_sql, execution_result=str(execution_result_obj))
            except Exception as e:
                logger.error(f"Error executing SQL for pre-configured DB: {e}")
                return AskDatabaseResult(executed_sql=generated_sql,
                                         execution_result=f"Error: An issue occurred while executing the query: {str(e)}")

        self.mcp.tool(name="configureDtsJob", description="Configure a dts job.",
                      annotations={"title": "配置DTS任务", "readOnlyHint": False, "destructiveHint": True})(
            configureDtsJob)
        self.mcp.tool(name="startDtsJob", description="Start a dts job.",
                      annotations={"title": "启动DTS任务", "readOnlyHint": False, "destructiveHint": True})(startDtsJob)
        self.mcp.tool(name="getDtsJob", description="Get a dts job detail information.",
                      annotations={"title": "查询DTS任务详细信息", "readOnlyHint": True})(getDtsJob)

    def _register_full_toolset(self):
        self.mcp.tool(name="addInstance",
                      description="Add an instance to DMS. The username and password are required. "
                                  "Only Aliyun instances are supported. "
                                  "Either instance_resource_id or host and port must be provided. "
                                  "The region is optional, but it's recommended to include it."
                                  "If the instance already exists, it will return the existing instance information.",
                      annotations={"title": "添加或获取DMS实例", "readOnlyHint": False, "destructiveHint": False})(
            add_instance)
        self.mcp.tool(name="listInstances", description="Search for instances from DMS.",
                      annotations={"title": "搜索DMS实例列表", "readOnlyHint": True})(list_instance)
        self.mcp.tool(name="getInstance", description="Retrieve detailed instance information from DMS using the host and port.",
                      annotations={"title": "获取DMS实例详情", "readOnlyHint": True})(get_instance)
        self.mcp.tool(name="searchDatabase", description="Search databases in DMS by name.",
                      annotations={"title": "搜索DMS数据库", "readOnlyHint": True})(search_database)
        self.mcp.tool(name="getDatabase",
                      description="Obtain detailed information about a specific database in DMS when the host and port are provided.",
                      annotations={"title": "获取DMS数据库详情", "readOnlyHint": True})(get_database)
        self.mcp.tool(name="listTables",
                      description="Search for tables by databaseId and (optional) table name. "
                                  "If you don't know the databaseId, first use getDatabase or searchDatabase to retrieve it."
                                  "(1)If you have the exact host, port, and database name, use getDatabase."
                                  "(2)If you only know the database name, use searchDatabase."
                                  "(3)If you don't know any information, ask the user to provide the necessary details."
                                  "Note: searchDatabase may return multiple databases. In this case, let the user choose which one to use.",
                      annotations={"title": "列出DMS表", "readOnlyHint": True})(list_tables)
        self.mcp.tool(name="getTableDetailInfo",
                      description="Retrieve detailed metadata information about a specific database table including "
                                  "schema and index details. If you don't know the table_guid parameter, retrieve it using listTables.",
                      annotations={"title": "获取DMS表详细信息", "readOnlyHint": True})(get_meta_table_detail_info)

        @self.mcp.tool(name="executeScript",
                       description="Execute SQL script against a database in DMS and return structured results."
                                   "If you don't know the databaseId, first use getDatabase or searchDatabase to retrieve it."
                                   "(1)If you have the exact host, port, and database name, use getDatabase."
                                   "(2)If you only know the database name, use searchDatabase."
                                   "(3)If you don't know any information, ask the user to provide the necessary details."
                                   "Note: searchDatabase may return multiple databases. In this case, let the user choose which one to use.",
                       annotations={"title": "在DMS中执行SQL脚本", "readOnlyHint": False, "destructiveHint": True})
        async def execute_script_full_wrapper(
                database_id: str = Field(description="Required DMS databaseId. Obtained via getDatabase tool"),
                script: str = Field(description="SQL script to execute"),
                logic: bool = Field(description="Whether to use logical execution mode", default=False)
        ) -> str:  # Return string representation
            result_obj = await execute_script(database_id=database_id, script=script, logic=logic)
            return str(result_obj)

        @self.mcp.tool(name="createDataChangeOrder",
                       description="Execute SQL changes through a data change order, and a corresponding order ID will be returned. "
                                   "Prefer using the executeScript tool for SQL execution; only use this tool when explicitly instructed to perform the operation via a order."
                                   "If you don't know the databaseId, first use getDatabase or searchDatabase to retrieve it."
                                   "(1)If you have the exact host, port, and database name, use getDatabase."
                                   "(2)If you only know the database name, use searchDatabase."
                                   "(3)If you don't know any information, ask the user to provide the necessary details."
                                   "Note: searchDatabase may return multiple databases. In this case, let the user choose which one to use.",
                       annotations={"title": "在DMS中创建数据变更工单", "readOnlyHint": False, "destructiveHint": True})
        async def create_data_change_order_wrapper(
                database_id: str = Field(description="Required DMS databaseId. Obtained via getDatabase tool"),
                script: str = Field(description="SQL script to execute"),
                logic: bool = Field(description="Whether to use logical execution mode", default=False)
        ) -> str:  # Return string representation
            result_obj = await create_data_change_order(database_id=database_id, script=script, logic=logic)
            return str(result_obj)

        self.mcp.tool(name="getOrderInfo", description="Retrieve order information from DMS using the order ID.",
                      annotations={"title": "获取DMS工单详情", "readOnlyHint": True})(get_order_base_info)

        self.mcp.tool(name="submitOrderApproval", description="Submit the order for approval in DMS using the order ID.",
                      annotations={"title": "提交工单审批", "readOnlyHint": False})(submit_order_approval)

        self.mcp.tool(name="generateSql", description="Generate SELECT-type SQL queries from natural language input.",
                      annotations={"title": "自然语言转SQL (DMS)", "readOnlyHint": True})(nl2sql)

        self.mcp.tool(name="configureDtsJob", description="Configure a dts job.",
                      annotations={"title": "配置DTS任务", "readOnlyHint": False, "destructiveHint": True})(
            configureDtsJob)
        self.mcp.tool(name="startDtsJob", description="Start a dts job.",
                      annotations={"title": "启动DTS任务", "readOnlyHint": False, "destructiveHint": True})(startDtsJob)
        self.mcp.tool(name="getDtsJob", description="Get a dts job detail information.",
                      annotations={"title": "查询DTS任务详细信息", "readOnlyHint": True})(getDtsJob)


# --- Lifespan Function ---
@asynccontextmanager
async def lifespan(app: FastMCP) -> AsyncGenerator[None, None]:
    logger.info("Initializing DMS MCP Server via lifespan")

    # Ensure app.state exists
    if not hasattr(app, 'state') or app.state is None:
        class AppState: pass

        app.state = AppState()

    app.state.default_database_id = None  # Initialize default_database_id

    dms_connection_string = os.getenv("CONNECTION_STRING")
    if dms_connection_string:
        logger.info(f"CONNECTION_STRING environment variable found: {dms_connection_string}")
        db_host, db_port, db_name_path, catalog_name = None, None, None, None
        try:
            # Expected formats:
            # 1. catalog@host:port:schema  (PG, full)
            # 2. database@host:port      (MySQL, database is schema-like)
            # 3. host:port:schema          (No catalog, with schema)
            # 4. host:port                 (No catalog, no schema)

            parts = dms_connection_string.split('@')

            potential_catalog_or_db_name = None
            main_part = ""

            if len(parts) > 1:  # Contains '@'
                potential_catalog_or_db_name = parts[0]
                main_part = parts[1]
            else:  # No '@'
                main_part = parts[0]

            main_part_components = main_part.split(':')

            if len(main_part_components) == 3:  # host:port:schema
                db_host = main_part_components[0]
                db_port = main_part_components[1]
                db_name_path = main_part_components[2]  # This is schema
                if potential_catalog_or_db_name:  # Format 1: catalog@host:port:schema
                    catalog_name = potential_catalog_or_db_name
                # else Format 3: host:port:schema (catalog_name remains None)

            elif len(main_part_components) == 2:  # host:port
                db_host = main_part_components[0]
                db_port = main_part_components[1]
                if potential_catalog_or_db_name:  # Format 2: database@host:port
                    # Here, potential_catalog_or_db_name is the database/schema
                    db_name_path = potential_catalog_or_db_name
                    # For MySQL-like, catalog is not explicit in this way, so catalog_name remains None or is not used as such.
                # else Format 4: host:port (db_name_path and catalog_name remain None)

            else:
                raise ValueError(
                    f"Invalid format for host:port or host:port:schema part: '{main_part}' in CONNECTION_STRING '{dms_connection_string}'.")

            if not (db_host and db_port):  # This check might be redundant if ValueError above catches it.
                logger.error(
                    f"CONNECTION_STRING '{dms_connection_string}' is incomplete. Missing host or port. Expected formats: catalog@host:port:schema, database@host:port, host:port:schema, host:port")
            else:
                logger.info(f"Verifying instance from CONNECTION_STRING: {db_host}:{db_port}")
                try:
                    instance_details = await get_instance(host=db_host, port=str(db_port), sid=None)
                    if not instance_details or not hasattr(instance_details,
                                                           'InstanceId') or not instance_details.InstanceId:
                        logger.warning(
                            f"Instance {db_host}:{db_port} not found or no valid InstanceId returned by get_instance. Cannot use this CONNECTION_STRING.")
                    else:
                        logger.info(f"Instance {db_host}:{db_port} verified. InstanceId: {instance_details.InstanceId}")

                        if db_name_path or catalog_name:  # We need either a schema or a catalog to search
                            search_term_for_db = catalog_name if catalog_name else db_name_path
                            sid_name = None
                            if catalog_name and db_name_path:
                                sid_name = db_name_path
                                logger.info(
                                    f"Searching for database with catalog '{catalog_name}' and schema '{db_name_path}' associated with instance {db_host}:{db_port}")
                            elif db_name_path:
                                logger.info(
                                    f"Searching for database schema '{db_name_path}' associated with instance {db_host}:{db_port}")
                            elif catalog_name:
                                logger.info(
                                    f"Searching for database catalog '{catalog_name}' associated with instance {db_host}:{db_port}")

                            database = await get_database(host=db_host,
                                                          port=db_port, schema_name=search_term_for_db, sid=sid_name)
                            if not database or database.DatabaseId is None:
                                logger.warning(
                                    f"No database found for {search_term_for_db} at {db_host}:{db_port} after processing CONNECTION_STRING.")
                                database = await get_database(host=db_host, port=db_port,
                                                              schema_name=search_term_for_db, sid=None)
                            found_db_id = None
                            if database:
                                found_db_id = database.DatabaseId

                            if found_db_id:
                                app.state.default_database_id = found_db_id
                                logger.info(
                                    f"Successfully configured default_database_id to {found_db_id} using CONNECTION_STRING.")
                            else:
                                current_search_criteria = f"catalog '{catalog_name}', schema '{db_name_path}'" if catalog_name and db_name_path else f"schema '{db_name_path}'" if db_name_path else f"catalog '{catalog_name}'"
                                logger.warning(
                                    f"Could not find a matching database for {current_search_criteria} at {db_host}:{db_port} after processing CONNECTION_STRING.")
                        else:
                            logger.info(
                                f"Instance {db_host}:{db_port} verified, but no catalog or schema provided in CONNECTION_STRING. No default database_id will be set from this DSN.")

                except Exception as instance_e:
                    logger.error(
                        f"Error during instance verification or database search for CONNECTION_STRING '{dms_connection_string}': {instance_e}")

        except ValueError as ve:
            logger.error(
                f"Invalid CONNECTION_STRING format '{dms_connection_string}': {ve}. Expected formats: catalog@host:port:schema, database@host:port, host:port:schema, or host:port")
        except Exception as e:
            logger.error(f"Error parsing CONNECTION_STRING '{dms_connection_string}': {e}")
    else:
        logger.info("CONNECTION_STRING environment variable not found.")

    if app.state.default_database_id:
        logger.info(f"Final default_database_id to be used (from CONNECTION_STRING): {app.state.default_database_id}")
    else:
        logger.info("No default database ID configured from CONNECTION_STRING. Full toolset will be registered.")

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
    on_duplicate_tools="replace",
    instructions="Database Management Assistant (DMS) is a toolkit designed to assist users in managing and "
                 "interacting with databases."
)


def run_server():
    log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(level=log_level_str, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger.info(f"Starting DMS MCP server with log level {log_level_str}")
    mcp.run(transport=os.getenv('SERVER_TRANSPORT', 'stdio'))


if __name__ == "__main__":
    run_server()
