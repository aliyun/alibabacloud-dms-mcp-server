#!/usr/bin/env python3
"""
Query PolarDB MySQL instances using DAS Agent
"""

import os
import sys

# Add the das-agent scripts directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'das-agent', 'scripts'))

try:
    from das_agent import call_das_agent_sse
    
    def query_polardb_mysql_instances():
        """Query all PolarDB MySQL instances"""
        query = "请列出我账号下的所有PolarDB MySQL实例"
        result = call_das_agent_sse(query, stream=False)
        return result["answer"]
    
    if __name__ == "__main__":
        try:
            answer = query_polardb_mysql_instances()
            print(answer)
        except Exception as e:
            print(f"❌ 查询失败: {e}", file=sys.stderr)
            sys.exit(1)
            
except ImportError:
    print("❌ 无法导入 das_agent 模块", file=sys.stderr)
    print("请确保 das-agent 技能已正确安装", file=sys.stderr)
    sys.exit(1)