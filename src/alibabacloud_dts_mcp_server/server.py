import json
import logging
import os
import sys
import random
import string
from datetime import datetime
from typing import Dict, Any, List
from pydantic import Field

from alibabacloud_dts20200101 import models as dts_20200101_models
from alibabacloud_dts20200101.client import Client as DtsClient
from alibabacloud_tea_openapi.models import Config
from alibabacloud_tea_util import models as util_models

from mcp.server.fastmcp import FastMCP

logger = logging.getLogger(__name__)

mcp = FastMCP(
    name="dts-mcp-server"
)

g_db_list = '''{
    "dtstest": {
        "name": "dtstest",
        "all": false,
        "Table": {
            "table1": {
                "name": "table1",
                "all": true
            }
        }
    }
}
'''

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


@mcp.tool(name="configureDtsJob",
          description="Configure a dts job.",
          annotations={"title": "配置DTS任务", "readOnlyHint": False, "destructiveHint": False})
async def configure_dts_job(
        region_id: str = Field(description="The region id of the dts job (e.g., 'cn-hangzhou')"),
        job_type: str = Field(description="The type of job (synchronization job: SYNC, migration job: MIGRATION, data check job: CHECK)"),
        source_endpoint_region: str = Field(description="The source endpoint region ID"),
        source_endpoint_instance_type: str = Field(description="The source endpoint instance type (RDS, ECS, EXPRESS, CEN, DG)"),
        source_endpoint_engine_name: str = Field(description="The source endpoint engine name (MySQL, PostgreSQL, SQLServer)"),
        source_endpoint_instance_id: str = Field(description="The source endpoint instance ID (e.g., 'rm-xxx')"),
        source_endpoint_user_name: str = Field(description="The source endpoint user name"),
        source_endpoint_password: str = Field(description="The source endpoint password"),
        destination_endpoint_region: str = Field(description="The destination endpoint region ID"),
        destination_endpoint_instance_type: str = Field(description="The destination endpoint instance type (RDS, ECS, EXPRESS, CEN, DG)"),
        destination_endpoint_engine_name: str = Field(description="The destination endpoint engine name (MySQL, PostgreSQL, SQLServer)"),
        destination_endpoint_instance_id: str = Field(description="The destination endpoint instance ID (e.g., 'rm-xxx')"),
        destination_endpoint_user_name: str = Field(description="The destination endpoint user name"),
        destination_endpoint_password: str = Field(description="The destination endpoint password"),
        db_list: Dict[str, Any] = Field(description='The database objects in JSON format, example 1: migration dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":true}}; example 2: migration one table task01 in dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true}}}}; example 3: migration two tables task01 and task02 in dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true},"task02":{"name":"task02","all":true}}}}')
) -> Dict[str, Any]:
    '''Configure a dts job.

    Args:
        region_id: Region ID.
        job_type: The type of job (synchronization job: SYNC, migration job: MIGRATION, data check job: CHECK).
        source_endpoint_region: The source endpoint region ID.
        source_endpoint_instance_type: The source endpoint instance type (RDS, ECS, EXPRESS, CEN, DG)
        source_endpoint_engine_name: The source endpoint engine name (MySQL, PostgreSQL, SQLServer)
        source_endpoint_instance_id: The source endpoint instance ID (e.g., "rm-xxx").
        source_endpoint_user_name: The source endpoint user name.
        source_endpoint_password: The source endpoint password.
        destination_endpoint_region: The destination endpoint region ID.
        destination_endpoint_instance_type: The destination endpoint instance type (RDS, ECS, EXPRESS, CEN, DG)
        destination_endpoint_engine_name: The destination endpoint engine name (MySQL, PostgreSQL, SQLServer)
        destination_endpoint_instance_id: The destination endpoint instance ID (e.g., "rm-xxx").
        destination_endpoint_user_name: The destination endpoint user name.
        destination_endpoint_password: The destination endpoint password.
        db_list: The database objects in JSON format, example 1: migration dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":true}}; example 2: migration one table task01 in dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true}}}}; example 3: migration two tables task01 and task02 in dtstest database, db_list should like {"dtstest":{"name":"dtstest","all":false,"Table":{"task01":{"name":"task01","all":true},"task02":{"name":"task02","all":true}}}}.

    Returns:
        Dict[str, Any]: Response containing the configured job details.
    '''
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
            max_du=16,
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

@mcp.tool(name="startDtsJob",
          description="Start a dts job.",
          annotations={"title": "启动DTS任务", "readOnlyHint": False, "destructiveHint": False})
async def start_dts_job(
        region_id: str = Field(description="The region id of the dts job (e.g., 'cn-hangzhou')"),
        dts_job_id: str = Field(description="The job id of the dts job")
) -> Dict[str, Any]:
    """Start a dts job.

    Args:
        region_id: Region ID.
        dts_job_id: the dts job id.

    Returns:
        Dict[str, Any]: Response containing the start result details.
    """
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

@mcp.tool(name="getDtsJob",
          description="Get a dts job detail information.",
          annotations={"title": "查询DTS任务详细信息", "readOnlyHint": True})
async def describe_dts_job_detail(
        region_id: str = Field(description="The region id of the dts job (e.g., 'cn-hangzhou')"),
        dts_job_id: str = Field(description="The job id of the dts job")
) -> Dict[str, Any]:
    """Get dts job detail information.

    Args:
        region_id: Region ID.
        dts_job_id: the dts job id.

    Returns:
        Dict[str, Any]: Response containing the dts job detail information.
    """
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


def main():
    mcp.run(transport=os.getenv('SERVER_TRANSPORT', 'stdio'))


if __name__ == '__main__':
    # Initialize and run the server
    main()

