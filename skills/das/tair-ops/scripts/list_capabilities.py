#!/usr/bin/env python3
"""
Tair Ops - 诊断能力列表脚本
"""

import json

# Tair/Redis支持的诊断能力
CAPABILITIES = {
    "performance_diagnosis": [
        "redis_cpu_diagnose_history_time",
        "redis_latency_log_summary",
        "tair_history_large_key_query_and_analysis"
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
    """输出Tair支持的诊断能力列表"""
    print("Tair-Ops 支持的诊断能力:")
    print("=" * 50)
    
    for category, capabilities in CAPABILITIES.items():
        print(f"\n{category.replace('_', ' ').title()}:")
        for cap in capabilities:
            print(f"  - {cap}")
    
    print(f"\n总计: {sum(len(caps) for caps in CAPABILITIES.values())} 项诊断能力")
    print("\n注意: Tair专注于Redis兼容的时延洞察、大Key分析和CPU诊断等专属功能")

if __name__ == "__main__":
    main()