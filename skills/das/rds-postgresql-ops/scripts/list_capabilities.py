#!/usr/bin/env python3
"""
RDS PostgreSQL Ops - 诊断能力列表脚本
"""

import json

# RDS PostgreSQL支持的所有诊断能力
CAPABILITIES = {
    "sql_optimization": [
        "mysql_query_optimization_advisor",
        "sql_slowlog_summary",
        "show_create_table"
    ],
    "storage_analysis": [
        "storage_analyze"
    ],
    "monitoring": [
        "monitoring_indicator_query_tool",
        "important_performance_metrics_summary",
        "query_the_instances_that_need_to_be_optimized"
    ],
    "security": [
        "security_describe_abnormal_events",
        "security_latest_baseline_analysis",
        "security_sensitive_scan_lookup",
        "describe_global_security_risk_histogram",
        "describe_security_risk_histogram",
        "describe_sql_security_alert_stats"
    ],
    "instance_management": [
        "list_instances",
        "instance_topology_query_tool",
        "get_instance_config"
    ]
}

def main():
    """输出RDS PostgreSQL支持的诊断能力列表"""
    print("RDS PostgreSQL-Ops 支持的诊断能力:")
    print("=" * 50)
    
    for category, capabilities in CAPABILITIES.items():
        print(f"\n{category.replace('_', ' ').title()}:")
        for cap in capabilities:
            print(f"  - {cap}")
    
    print(f"\n总计: {sum(len(caps) for caps in CAPABILITIES.values())} 项诊断能力")

if __name__ == "__main__":
    main()