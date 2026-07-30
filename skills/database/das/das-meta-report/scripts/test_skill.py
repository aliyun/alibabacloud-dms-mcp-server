#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test script for das-business-impact-report skill
"""

import os
import sys

def test_skill_structure():
    """Test that the skill structure is correct"""
    # Use current directory as skill directory
    skill_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Check required files
    required_files = [
        "SKILL.md",
        "scripts/get_das_business_impact_report.py",
        "references/business_impact_templates.md"
    ]
    
    for file in required_files:
        if not os.path.exists(os.path.join(skill_dir, file)):
            print(f"❌ Missing required file: {file}")
            return False
    
    print("✅ All required files exist")
    return True

if __name__ == "__main__":
    success = test_skill_structure()
    sys.exit(0 if success else 1)