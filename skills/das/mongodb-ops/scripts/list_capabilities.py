#!/usr/bin/env python3
"""
MongoDB Ops - 诊断能力列表脚本
"""

import json

# MongoDB支持的诊断能力
CAPABILITIES = {
    "sql_analysis": [
        "mongodb_slowlog_summary"
    ],
    "storage_analysis": [
        "storage_analyze"
    ],
    "monitoring": [
        "important_performance_metrics_summary",
        "query_the_instances_that_need_to_be_optimized"
    ],
    "instance_management": [
        "list_instances",
        "instance_topology_query_tool",
        "get_instance_config"
    ]
}

def main():
    """输出MongoDB支持的诊断能力列表"""
    print("MongoDB-Ops 支持的诊断能力:")
    print("=" * 50)
    
    for category, capabilities in CAPABILITIES.items():
        print(f"\n{category.replace('_', ' ').title()}:")
        for cap in capabilities:
            print(f"  - {cap}")
    
    print(f"\n总计: {sum(len(caps) for caps in CAPABILITIES.values())} 项诊断能力")

if __name__ == "__main__":
    main()