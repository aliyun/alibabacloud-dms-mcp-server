# DAS Agent API Reference

## Environment Variables

| Variable Name | Required | Description |
|---------------|----------|-------------|
| `ALIBABA_CLOUD_ACCESS_KEY_ID` | Yes | Alibaba Cloud AccessKey ID |
| `ALIBABA_CLOUD_ACCESS_KEY_SECRET` | Yes | Alibaba Cloud AccessKey Secret |
| `ALIBABA_CLOUD_DAS_AGENT_ID` | Yes | DAS Agent ID |
| `AGENT_ID` | No | Alias for `ALIBABA_CLOUD_DAS_AGENT_ID` |

## API Invocation

### Endpoint

- URL: `https://das.cn-shanghai.aliyuncs.com/`
- Method: POST
- Action: `Chat`

### Request Body Format

```python
{
    "Format": "JSON",
    "SourceIp": "127.0.0.1",
    "SecureTransport": "true",
    "Message": json.dumps({
        "id": "uuid",
        "role": "user",
        "content": [{"type": "text", "text": "User question"}]
    }),
    "SourceTlsVersion": "TLSv1.2",
    "UserId": "1000",
    "AcceptLanguage": "zh-CN",
    "AgentId": "agent_id",
    "SessionId": "session_id"  # Optional, for session persistence
}
```

### Signature Algorithm

Uses the ACS3-HMAC-SHA256 signature algorithm:

1. Build Canonical Request
2. Calculate StringToSign
3. Generate Signature

For details, see [Alibaba Cloud API Signature Documentation](https://help.aliyun.com/document_detail/185337.htm)

## SSE Event Types

| Event Type | Description |
|------------|-------------|
| `TEXT_MESSAGE_START` | Message start, includes MessageId and Role |
| `TEXT_MESSAGE_CONTENT` | Text content, includes Delta field |
| `TEXT_MESSAGE_END` | Message end |
| `TOOL_CALL_START` | Tool call start |
| `TOOL_CALL_ARGS` | Tool call arguments (streaming) |
| `TOOL_CALL_RESULT` | Tool call result |
| `TOOL_CALL_END` | Tool call end |
| `ACTIVITY_DELTA` | Activity status, such as waiting for thinking |

## Output Modes

- **Default Mode**: Concise output, displays only final results
- **Verbose Mode** (`-v`): Displays all SSE events and tool calls
