#!/usr/bin/env python3
"""
PolarDB-X Ops - 诊断能力列表脚本
"""

import json

# PolarDB-X支持的诊断能力（分布式数据库特性）
CAPABILITIES = {
    "sql_analysis": [
        "sql_slowlog_summary"
    ],
    "storage_analysis": [
        "storage_analyze"
    ],
    "monitoring": [
        "important_performance_metrics_summary",
        "query_the_instances_that_need_to_be_optimized"
    ],
    "security": [
        "security_describe_abnormal_events",
        "security_baseline_change_analysis", 
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
    """输出PolarDB-X支持的诊断能力列表"""
    print("PolarDB-X-Ops 支持的诊断能力:")
    print("=" * 50)
    
    for category, capabilities in CAPABILITIES.items():
        print(f"\n{category.replace('_', ' ').title()}:")
        for cap in capabilities:
            print(f"  - {cap}")
    
    print(f"\n总计: {sum(len(caps) for caps in CAPABILITIES.values())} 项诊断能力")
    print("\n注意: PolarDB-X作为分布式数据库，不支持CPU实时诊断、SQL优化、HA分析等单机MySQL功能")

if __name__ == "__main__":
    main()