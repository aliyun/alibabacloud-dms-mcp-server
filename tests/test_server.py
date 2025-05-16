import asyncio

import pytest
import os
from unittest.mock import AsyncMock, MagicMock, patch

# Import the functions and classes to be tested
from alibabacloud_dms_mcp_server.server import (
    create_client,
    add_instance,
    get_instance,
    search_database,
    get_database,
    list_tables,
    get_meta_table_detail_info,
    execute_script,
    nl2sql,
    ToolRegistry,
    lifespan,
    InstanceInfo,
    InstanceDetail,
    DatabaseInfo,
    DatabaseDetail,
    TableDetail,
    ExecuteScriptResult,
    ResultSet,
    SqlResult,
    MyBaseModel
)
from mcp.server.fastmcp import FastMCP
from alibabacloud_dms_enterprise20181101 import models as dms_models
from alibabacloud_tea_openapi import models as open_api_models


# --- Fixtures ---

@pytest.fixture
def mock_dms_client():
    """Fixture to mock the DMS client."""
    with patch('alibabacloud_dms_mcp_server.server.create_client') as mock_create_client:
        client_instance = MagicMock()
        # Mock specific client methods as needed for tests
        client_instance.simply_add_instance = MagicMock()
        client_instance.get_instance = MagicMock()
        client_instance.search_database = MagicMock()
        client_instance.get_database = MagicMock()
        client_instance.list_tables = MagicMock()
        client_instance.get_meta_table_detail_info = MagicMock()
        client_instance.execute_script = MagicMock()
        client_instance.generate_sql_from_nl = MagicMock()
        mock_create_client.return_value = client_instance
        yield client_instance


@pytest.fixture
def mcp_app():
    """Fixture to create a FastMCP app instance."""
    app = FastMCP("TestApp")

    # Mock app.state if necessary for ToolRegistry tests
    class AppState:
        pass

    app.state = AppState()
    app.state.default_database_id = None
    return app


# --- Helper Functions for Mock Responses ---

def create_mock_openapi_response(body_data: dict, status_code: int = 200):
    """Creates a mock OpenAPI response object."""
    response = MagicMock()
    response.status_code = status_code
    response.body = MagicMock()
    response.body.to_map = MagicMock(return_value=body_data)
    return response


# --- Tests for Core Logic Functions ---

@pytest.mark.asyncio
async def test_add_instance_success(mock_dms_client):
    mock_response_body = {
        "instance_id": "dms-instance-123",
        "host": "test-host.com",
        "port": "3306"
    }
    mock_dms_client.simply_add_instance.return_value = create_mock_openapi_response(mock_response_body)

    result = await add_instance(
        db_user="test_user",
        db_password="test_password",
        host="test-host.com",
        port="3306"
    )
    assert isinstance(result, InstanceInfo)
    assert result.instance_id == "dms-instance-123"
    assert result.host == "test-host.com"
    mock_dms_client.simply_add_instance.assert_called_once()
    call_args = mock_dms_client.simply_add_instance.call_args[0][0]
    assert call_args.database_user == "test_user"
    assert call_args.host == "test-host.com"


@pytest.mark.asyncio
async def test_add_instance_missing_user_raises_error():
    with pytest.raises(ValueError, match="db_user must be a non-empty string"):
        await add_instance(db_user="", db_password="password")


@pytest.mark.asyncio
async def test_get_instance_success(mock_dms_client):
    mock_response_body = {
        "Instance": {
            "InstanceId": "rm-123",
            "State": "NORMAL",
            "InstanceType": "MySQL",
            "InstanceAlias": "My Test DB"
        }
    }
    mock_dms_client.get_instance.return_value = create_mock_openapi_response(mock_response_body)

    result = await get_instance(host="test-host.com", port="3306")
    assert isinstance(result, InstanceDetail)
    assert result.InstanceId == "rm-123"
    assert result.InstanceType == "MySQL"


@pytest.mark.asyncio
async def test_search_database_success(mock_dms_client):
    mock_response_body = {
        "SearchDatabaseList": {
            "SearchDatabase": [
                {"DatabaseId": "db1", "Host": "host1", "Port": "3306", "DbType": "MySQL", "SchemaName": "schema1",
                 "CatalogName": "def"},
                {"DatabaseId": "db2", "Host": "host2", "Port": "5432", "DbType": "PostgreSQL", "SchemaName": "public",
                 "CatalogName": "pg_catalog"}
            ]
        },
        "TotalCount": 2
    }
    mock_dms_client.search_database.return_value = create_mock_openapi_response(mock_response_body)

    results = await search_database(search_key="test_db")
    assert len(results) == 2
    assert isinstance(results[0], DatabaseInfo)
    assert results[0].DatabaseId == "db1"
    assert results[0].SchemaName == "schema1"
    assert results[1].DatabaseId == "db2"
    assert results[1].SchemaName == "pg_catalog.public"


@pytest.mark.asyncio
async def test_get_database_success(mock_dms_client):
    mock_response_body = {
        "Database": {
            "DatabaseId": "db-guid-123",
            "SchemaName": "my_schema",
            "DbType": "MySQL",
            "InstanceId": "inst-id-456"
        }
    }
    mock_dms_client.get_database.return_value = create_mock_openapi_response(mock_response_body)

    result = await get_database(host="test-host.com", port="3306", schema_name="my_schema")
    assert isinstance(result, DatabaseDetail)
    assert result.DatabaseId == "db-guid-123"
    assert result.SchemaName == "my_schema"


@pytest.mark.asyncio
async def test_list_tables_success(mock_dms_client):
    mock_response_body = {
        "TableList": {
            "Table": [{"TableName": "users", "TableGuid": "guid1"}, {"TableName": "products", "TableGuid": "guid2"}]},
        "TotalCount": 2
    }
    mock_dms_client.list_tables.return_value = create_mock_openapi_response(mock_response_body)

    result = await list_tables(database_id="db-guid-123", search_name="user")
    assert "TableList" in result
    assert len(result["TableList"]["Table"]) == 2


@pytest.mark.asyncio
async def test_get_meta_table_detail_info_success(mock_dms_client):
    mock_response_body = {
        "DetailInfo": {
            "ColumnList": [{"ColumnName": "id", "ColumnType": "int"}, {"ColumnName": "name", "ColumnType": "varchar"}],
            "IndexList": [{"IndexName": "PRIMARY", "IndexColumns": ["id"]}]
        }
    }
    mock_dms_client.get_meta_table_detail_info.return_value = create_mock_openapi_response(mock_response_body)

    result = await get_meta_table_detail_info(table_guid="guid.schema.table")
    assert isinstance(result, TableDetail)
    assert len(result.ColumnList) == 2
    assert result.ColumnList[0]['ColumnName'] == "id"
    assert len(result.IndexList) == 1


@pytest.mark.asyncio
async def test_execute_script_success(mock_dms_client):
    mock_response_body = {
        "RequestId": "req-123",
        "Success": True,
        "Results": [
            {
                "Success": True,
                "ColumnNames": ["id", "name"],
                "RowCount": 1,
                "Rows": [{"id": 1, "name": "Alice"}]
            }
        ]
    }
    mock_dms_client.execute_script.return_value = create_mock_openapi_response(mock_response_body)

    result = await execute_script(database_id="db-guid-123", script="SELECT * FROM users")
    assert isinstance(result, ExecuteScriptResult)
    assert result.Success is True
    assert len(result.Results) == 1
    assert result.Results[0].Success is True
    assert result.Results[0].ColumnNames == ["id", "name"]
    assert result.Results[0].MarkdownTable is not None


@pytest.mark.asyncio
async def test_execute_script_failure_in_results(mock_dms_client):
    mock_response_body = {
        "RequestId": "req-456",
        "Success": True,  # Overall success can be true even if one script part fails
        "Results": [
            {
                "Success": False,  # Individual result failed
                "ErrorMessage": "Syntax error"
            }
        ]
    }
    mock_dms_client.execute_script.return_value = create_mock_openapi_response(mock_response_body)
    result = await execute_script(database_id="db-guid-123", script="INVALID SQL")
    assert result.Success is True
    assert len(result.Results) == 1
    assert result.Results[0].Success is False
    assert result.Results[0].MarkdownTable is None


@pytest.mark.asyncio
async def test_nl2sql_success(mock_dms_client):
    mock_response_body = {
        "Data": {"Sql": "SELECT id, name FROM users WHERE age > 30"}
    }
    mock_dms_client.generate_sql_from_nl.return_value = create_mock_openapi_response(mock_response_body)

    result = await nl2sql(database_id="db-guid-123", question="show users older than 30")
    assert isinstance(result, SqlResult)
    assert result.sql == "SELECT id, name FROM users WHERE age > 30"


# --- Tests for ToolRegistry ---
@pytest.mark.asyncio
async def test_tool_registry_full_toolset(mcp_app):
    registry = ToolRegistry(mcp=mcp_app)
    registry.register_tools()  # default_database_id is None

    # Check if all expected tools are registered
    expected_tool_names = [
        "addInstance", "getInstance", "searchDatabase", "getDatabase",
        "listTables", "getTableDetailInfo", "executeScript", "generateSql"
    ]
    tools = await mcp_app.list_tools()
    registered_tool_names = [tool.name for tool in tools]
    for name in expected_tool_names:
        assert name in registered_tool_names


@pytest.mark.asyncio
async def test_tool_registry_configured_toolset(mcp_app, mock_dms_client):
    mcp_app.state.default_database_id = "configured_db_id_123"
    registry = ToolRegistry(mcp=mcp_app)
    registry.register_tools()

    expected_tool_names = ["listTables", "getTableDetailInfo", "executeScript", "askDatabase"]
    tools = await mcp_app.list_tools()
    registered_tool_names = [tool.name for tool in tools]
    for name in expected_tool_names:
        assert name in registered_tool_names
        assert name not in ["addInstance", "getInstance", "searchDatabase", "getDatabase",
                            "generateSql"]  # Ensure full set not registered


@pytest.mark.asyncio
async def test_tool_registry_ask_database_configured_success(mcp_app, mock_dms_client):
    mcp_app.state.default_database_id = "configured_db_id_ask"
    registry = ToolRegistry(mcp=mcp_app)
    registry.register_tools()
    tools = await mcp_app.list_tools()
    ask_database_tool = next(tool for tool in tools if tool.name == "askDatabase")

    # Mock nl2sql response
    nl_response_body = {"Data": {"Sql": "SELECT * FROM test_table"}}
    mock_dms_client.generate_sql_from_nl.return_value = create_mock_openapi_response(nl_response_body)

    # Mock execute_script response
    exec_response_body = {
        "RequestId": "req-ask", "Success": True,
        "Results": [{"Success": True, "ColumnNames": ["col1"], "RowCount": 1, "Rows": [{"col1": "val1"}]}]
    }
    mock_dms_client.execute_script.return_value = create_mock_openapi_response(exec_response_body)

    result_str = await mcp_app.call_tool(ask_database_tool.name, arguments={"question":"show me the data"})
    assert "val1" in str(result_str)  # Check if markdown table string contains the value
    mock_dms_client.generate_sql_from_nl.assert_called_once()
    mock_dms_client.execute_script.assert_called_once()
    assert mock_dms_client.execute_script.call_args[0][0].script == "SELECT * FROM test_table"


@pytest.mark.asyncio
async def test_tool_registry_ask_database_nl_fails(mcp_app, mock_dms_client):
    mcp_app.state.default_database_id = "configured_db_id_ask_fail_nl"
    registry = ToolRegistry(mcp=mcp_app)
    registry.register_tools()
    tools = await mcp_app.list_tools()
    ask_database_tool = next(tool for tool in tools if tool.name == "askDatabase")

    # Mock nl2sql to return no SQL
    mock_dms_client.generate_sql_from_nl.return_value = create_mock_openapi_response({"Data": {"Sql": None}})

    result_str = await mcp_app.call_tool(ask_database_tool.name, arguments={"question": "bad question"})
    assert "Error: Could not generate an SQL query" in str(result_str)
    mock_dms_client.generate_sql_from_nl.assert_called_once()
    mock_dms_client.execute_script.assert_not_called()


@pytest.mark.asyncio
async def test_tool_registry_ask_database_exec_fails(mcp_app, mock_dms_client):
    mcp_app.state.default_database_id = "configured_db_id_ask_fail_exec"
    registry = ToolRegistry(mcp=mcp_app)
    registry.register_tools()
    tools = await mcp_app.list_tools()
    ask_database_tool = next(tool for tool in tools if tool.name == "askDatabase")

    mock_dms_client.generate_sql_from_nl.return_value = create_mock_openapi_response({"Data": {"Sql": "SELECT 1"}})
    # Mock execute_script to raise an exception
    mock_dms_client.execute_script.side_effect = Exception("DB execution error")

    result_str = await mcp_app.call_tool(ask_database_tool.name, arguments={"question": "show me the data"})
    assert "Error: An issue occurred while executing the query: DB execution error" in str(result_str)
    mock_dms_client.generate_sql_from_nl.assert_called_once()
    mock_dms_client.execute_script.assert_called_once()


# --- Tests for Lifespan ---

@pytest.mark.asyncio
async def test_lifespan_with_connection_string(mcp_app, mock_dms_client):
    # 模拟 get_instance 的成功响应
    instance_response = {
        "Instance": {
            "InstanceId": "rm-test123",
            "State": "NORMAL",
            "InstanceType": "MySQL"
        }
    }
    mock_dms_client.get_instance.return_value = create_mock_openapi_response(instance_response)
    
    # 模拟 get_database 的成功响应，包含DatabaseId
    db_response = {
        "Database": {
            "DatabaseId": "db-test-123",
            "SchemaName": "test_db",
            "DbType": "MySQL"
        }
    }
    mock_dms_client.get_database.return_value = create_mock_openapi_response(db_response)
    
    # 使用 CONNECTION_STRING 替代原来的 DATABASE_ID
    with patch.dict(os.environ, {"CONNECTION_STRING": "test_db@localhost:3306"}):
        with patch('alibabacloud_dms_mcp_server.server.ToolRegistry.register_tools') as mock_register:
            async with lifespan(mcp_app):
                assert hasattr(mcp_app.state, 'default_database_id')
                assert mcp_app.state.default_database_id == "db-test-123"
                mock_register.assert_called_once()
            assert not hasattr(mcp_app.state, 'default_database_id')  # 检查清理


@pytest.mark.asyncio
async def test_lifespan_without_connection_string(mcp_app):
    # 确保环境变量为空
    with patch.dict(os.environ, {"CONNECTION_STRING": ""}):
        with patch('alibabacloud_dms_mcp_server.server.ToolRegistry.register_tools') as mock_register:
            async with lifespan(mcp_app):
                assert hasattr(mcp_app.state, 'default_database_id')
                assert mcp_app.state.default_database_id is None
                mock_register.assert_called_once()
            assert not hasattr(mcp_app.state, 'default_database_id')


@pytest.mark.asyncio
async def test_lifespan_with_pg_connection_string(mcp_app, mock_dms_client):
    # 模拟 get_instance 的成功响应
    instance_response = {
        "Instance": {
            "InstanceId": "pg-test123",
            "State": "NORMAL",
            "InstanceType": "PostgreSQL"
        }
    }
    mock_dms_client.get_instance.return_value = create_mock_openapi_response(instance_response)
    
    # 模拟 get_database 的成功响应，包含DatabaseId
    db_response = {
        "Database": {
            "DatabaseId": "pg-db-test-456",
            "SchemaName": "pg_schema",
            "DbType": "PostgreSQL"
        }
    }
    mock_dms_client.get_database.return_value = create_mock_openapi_response(db_response)
    
    # 使用PostgreSQL格式的CONNECTION_STRING (catalog@host:port:schema)
    with patch.dict(os.environ, {"CONNECTION_STRING": "test_db@localhost:5432:pg_schema"}):
        with patch('alibabacloud_dms_mcp_server.server.ToolRegistry.register_tools') as mock_register:
            async with lifespan(mcp_app):
                assert hasattr(mcp_app.state, 'default_database_id')
                assert mcp_app.state.default_database_id == "pg-db-test-456"
                mock_register.assert_called_once()
                
                # 验证调用get_database时使用了正确的参数
                call_args = mock_dms_client.get_database.call_args[0][0]
                assert call_args.host == "localhost"
                assert call_args.port == "5432"
                assert call_args.schema_name == "test_db" # catalog名称用作search_key
                assert call_args.sid == "pg_schema"  # schema名称作为sid参数传递
            
            assert not hasattr(mcp_app.state, 'default_database_id')  # 检查清理


# --- Test ExecuteScriptResult __str__ ---
def test_execute_script_result_str_success_with_markdown():
    result = ExecuteScriptResult(
        RequestId="req1",
        Success=True,
        Results=[
            ResultSet(ColumnNames=["colA"], RowCount=1, Rows=[{"colA": "valA"}], MarkdownTable="## Markdown Table",
                      Success=True)
        ]
    )
    assert str(result) == "## Markdown Table"


def test_execute_script_result_str_success_no_markdown():
    result = ExecuteScriptResult(
        RequestId="req2",
        Success=True,
        Results=[
            ResultSet(ColumnNames=["colB"], RowCount=0, Rows=[], MarkdownTable=None, Success=True)
        ]
    )
    assert str(result) == "Result data is not available in Markdown format."


def test_execute_script_result_str_first_result_not_success():
    result = ExecuteScriptResult(
        RequestId="req3",
        Success=True,  # Overall success
        Results=[
            ResultSet(ColumnNames=[], RowCount=0, Rows=[], MarkdownTable=None, Success=False)  # First result failed
        ]
    )
    assert str(result) == "The first result set was not successful."


def test_execute_script_result_str_overall_failure():
    result = ExecuteScriptResult(
        RequestId="req4",
        Success=False,  # Overall failure
        Results=[]
    )
    assert str(result) == "Script execution failed."


def test_execute_script_result_str_success_no_results():
    result = ExecuteScriptResult(
        RequestId="req5",
        Success=True,
        Results=[]  # No results
    )
    assert str(result) == "Script executed successfully, but no results were returned."


# --- Test _format_as_markdown_table ---
from alibabacloud_dms_mcp_server.server import _format_as_markdown_table


def test_format_as_markdown_table_basic():
    cols = ["ID", "Name"]
    rows = [{"ID": 1, "Name": "Alice"}, {"ID": 2, "Name": "Bob"}]
    expected_md = """| ID | Name |
| --- | --- |
| 1 | Alice |
| 2 | Bob |"""
    assert _format_as_markdown_table(cols, rows) == expected_md


def test_format_as_markdown_table_empty():
    assert _format_as_markdown_table([], []) == ""
    assert _format_as_markdown_table(["ID"], []) == ""
    assert _format_as_markdown_table([], [{"ID": 1}]) == ""


def test_format_as_markdown_table_missing_keys():
    cols = ["ID", "Name", "Age"]
    rows = [{"ID": 1, "Name": "Alice"}, {"ID": 2}]  # Bob is missing Name and Age
    expected_md = """| ID | Name | Age |
| --- | --- | --- |
| 1 | Alice |  |
| 2 |  |  |"""  # Missing values should be empty strings
    assert _format_as_markdown_table(cols, rows) == expected_md
