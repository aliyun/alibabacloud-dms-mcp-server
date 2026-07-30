# RAM Policies

本技能需要的 RAM 权限：

| Product | Action | Description |
|---------|--------|-------------|
| `das` | `GetInstanceGroupInspectReportList` | 获取巡检报告列表 |
| `das` | `GetInstanceGroupInspectReportDetail` | 获取巡检报告详情 |

## 配置方式

1. 登录 [RAM 控制台](https://ram.console.aliyun.com/)
2. 创建或选择 RAM 用户/角色
3. 附加权限策略

## 最小权限策略示例

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "das:GetInstanceGroupInspectReportList",
        "das:GetInstanceGroupInspectReportDetail"
      ],
      "Resource": "*"
    }
  ]
}
```
