#!/usr/bin/env python3
"""
RDS MySQL Ops - 使用 DAS Agent 查询 RDS MySQL 实例
"""

import sys
import os

# 添加 das-agent 到 Python 路径
sys.path.insert(0, '/home/admin/.openclaw/workspace/skills/das-agent/scripts')

try:
    from das_agent import call_das_agent_sse
    
    def query_rds_mysql_instances():
        """查询所有 RDS MySQL 实例"""
        query = "请列出我账号下的所有 RDS MySQL 实例"
        result = call_das_agent_sse(query, stream=False)
        return result["answer"]
    
    def analyze_rds_mysql_instance(instance_id):
        """分析特定 RDS MySQL 实例"""
        query = f"请分析 RDS MySQL 实例 {instance_id} 的详细信息，包括HA状态、性能指标等"
        result = call_das_agent_sse(query, stream=False)
        return result["answer"]
    
    if __name__ == "__main__":
        if len(sys.argv) > 1 and sys.argv[1] == "list":
            print(query_rds_mysql_instances())
        elif len(sys.argv) > 1 and sys.argv[1] == "analyze" and len(sys.argv) > 2:
            print(analyze_rds_mysql_instance(sys.argv[2]))
        else:
            print("Usage:")
            print("  python query_rds_mysql.py list")
            print("  python query_rds_mysql.py analyze <instance_id>")

except ImportError as e:
    print(f"Error importing das_agent: {e}")
    print("Please ensure das-agent skill is properly installed.")