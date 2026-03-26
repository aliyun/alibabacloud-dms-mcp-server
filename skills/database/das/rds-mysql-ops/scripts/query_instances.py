#!/usr/bin/env python3
"""
RDS MySQL Ops - Query Instances using DAS Agent
"""

import sys
import os

# Add the das-agent scripts to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'das-agent', 'scripts'))

from das_agent import list_database_instances

def main():
    """Query RDS MySQL instances"""
    try:
        # Get credentials from environment
        ak = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID")
        sk = os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
        
        if not ak or not sk:
            print("Error: Please set ALIBABA_CLOUD_ACCESS_KEY_ID and ALIBABA_CLOUD_ACCESS_KEY_SECRET environment variables")
            sys.exit(1)
            
        # Query all instances (filter for MySQL later if needed)
        result = list_database_instances(ak, sk)
        
        if result and "answer" in result:
            print(result["answer"])
        else:
            print("No instances found or query failed")
            
    except Exception as e:
        print(f"Error querying instances: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()