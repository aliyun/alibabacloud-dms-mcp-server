#!/usr/bin/env python3
"""
Self-Hosted MongoDB Ops - 诊断能力列表脚本
"""

import json

# 自建MongoDB支持的诊断能力（受限功能）
CAPABILITIES = {
    "storage_analysis": [
        "storage_analyze"
    ],
    "security": [
        "security_describe_abnormal_events",
        "security_latest_baseline_analysis",
        "security_sensitive_scan_lookup"
    ],
    "instance_management": [
        "list_instances"
    ]
}

def main():
    """输出自建MongoDB支持的诊断能力列表"""
    print("Self-Hosted MongoDB-Ops 支持的诊断能力:")
    print("=" * 50)
    
    for category, capabilities in CAPABILITIES.items():
        print(f"\n{category.replace('_', ' ').title()}:")
        for cap in capabilities:
            print(f"  - {cap}")
    
    print(f"\n总计: {sum(len(caps) for caps in CAPABILITIES.values())} 项诊断能力")
    print("\n注意: 自建/他云MongoDB仅支持基础功能，不支持慢日志分析等高级功能")

if __name__ == "__main__":
    main()