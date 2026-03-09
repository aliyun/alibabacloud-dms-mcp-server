#!/usr/bin/env python3
"""
Alibaba Cloud DAS Agent Chat API Client.

Environment Variables:
    ALIBABA_CLOUD_ACCESS_KEY_ID: Alibaba Cloud AccessKey ID
    ALIBABA_CLOUD_ACCESS_KEY_SECRET: Alibaba Cloud AccessKey Secret
    ALIBABA_CLOUD_DAS_AGENT_ID: DAS Agent ID (AGENT_ID is also accepted)

Command-line Arguments:
    --question: The question to send to the Agent

Usage:
    uv run call_das_agent.py --question "Please check the performance of instance rm-12345"
"""

import argparse
import hashlib
import hmac
import json
import os
import sys
import uuid
from collections import OrderedDict
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from urllib.parse import quote_plus, urlencode

import pytz
import requests

DEBUG = False
# SHOW_EVENTS has been removed; replaced by instance variable verbose


class SignatureRequest:
    def __init__(
            self,
            http_method: str,
            canonical_uri: str,
            host: str,
            x_acs_action: str,
            x_acs_version: str
    ):
        self.http_method = http_method
        self.canonical_uri = canonical_uri
        self.host = host
        self.x_acs_action = x_acs_action
        self.x_acs_version = x_acs_version
        self.headers = self._init_headers()
        self.query_param = OrderedDict()
        self.body = None

    def _init_headers(self) -> Dict[str, str]:
        current_time = datetime.now(pytz.timezone('Etc/GMT'))
        headers = OrderedDict([
            ('host', self.host),
            ('x-acs-action', self.x_acs_action),
            ('x-acs-version', self.x_acs_version),
            ('x-acs-date', current_time.strftime('%Y-%m-%dT%H:%M:%SZ')),
            ('x-acs-signature-nonce', str(uuid.uuid4())),
            ('x-acs-web-code', 'hdm'),
            ('x-accel-buffering', 'no'),
            ('accept', 'text/event-stream'),
            ('cache-control', 'no-cache'),
            ('connection', 'keep-alive'),
            ('sec-ch-ua', '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"'),
            ('sec-ch-ua-platform', '"macOS"'),
            ('sec-ch-ua-mobile', '?0'),
            ('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36'),
            ('Referer', 'https://hdm.console.aliyun.com/'),
        ])
        return headers

    def sorted_query_params(self) -> None:
        self.query_param = dict(sorted(self.query_param.items()))

    def sorted_headers(self) -> None:
        self.headers = dict(sorted(self.headers.items()))


class DasAgentChatClient:
    def __init__(self, verbose=True):
        self.access_key_id = os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_ID")
        self.access_key_secret = os.environ.get("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
        # Support both environment variable names
        self.agent_id = os.environ.get("ALIBABA_CLOUD_DAS_AGENT_ID") or os.environ.get("AGENT_ID")
        self.algorithm = "ACS3-HMAC-SHA256"
        self.host = "das.cn-shanghai.aliyuncs.com"
        self.action = "Chat"
        self.version = "2020-01-16"
        
        # Control output verbosity
        self.verbose = verbose
        
        # Dictionary for accumulating streaming tool call data
        self.tool_call_data = {}  # tool_call_id -> {"args": "", "result": "", "name": ""}
        
        # Dictionary for tracking message roles
        self.message_roles = {}  # message_id -> role
        
        # Counter to limit ACTIVITY_DELTA display frequency
        self.activity_delta_count = 0
        
        # Flag to track dot sequence output state
        self.is_dot_sequence_active = False
        
        # Accumulate messages in non-verbose mode
        self.accumulated_text = ""  # Accumulated text message content
        self.accumulated_tool_result = ""  # Accumulated tool call result
        self.last_complete_message = ""  # Last complete message
        self.current_message_id = None  # Current message ID being processed
        self.current_tool_id = None  # Current tool ID being processed

        if not self.access_key_id or not self.access_key_secret:
            raise ValueError("Please set environment variables ALIBABA_CLOUD_ACCESS_KEY_ID and ALIBABA_CLOUD_ACCESS_KEY_SECRET")
        if not self.agent_id:
            raise ValueError("Please set environment variable ALIBABA_CLOUD_DAS_AGENT_ID or AGENT_ID")

    def _percent_encode(self, encoded_str: str) -> str:
        """Percent-encode according to ACS spec."""
        return encoded_str.replace("+", "%20").replace("*", "%2A").replace("%7E", "~")

    def _sha256_hex(self, s: bytes) -> str:
        return hashlib.sha256(s).hexdigest()

    def _get_authorization(self, request: SignatureRequest) -> None:
        """Generate authorization signature (based on documentation logic, adapted for Chat API)"""
        try:
            new_query_param = OrderedDict()
            self._process_object(new_query_param, '', request.query_param)
            request.query_param = new_query_param
            request.sorted_query_params()

            canonical_query_string = "&".join(
                f"{self._percent_encode(quote_plus(k))}={self._percent_encode(quote_plus(str(v)))}"
                for k, v in request.query_param.items()
            )

            hashed_request_payload = self._sha256_hex(request.body or b'')
            request.headers['x-acs-content-sha256'] = hashed_request_payload
            request.sorted_headers()

            filtered_headers = OrderedDict()
            for k, v in request.headers.items():
                if k.lower().startswith("x-acs-") or k.lower() in ["host", "content-type"]:
                    filtered_headers[k.lower()] = v

            canonical_headers = "\n".join(f"{k}:{v}" for k, v in filtered_headers.items()) + "\n"
            signed_headers = ";".join(filtered_headers.keys())

            canonical_request = (
                f"{request.http_method}\n{request.canonical_uri}\n{canonical_query_string}\n"
                f"{canonical_headers}\n{signed_headers}\n{hashed_request_payload}"
            )

            hashed_canonical_request = self._sha256_hex(canonical_request.encode("utf-8"))
            string_to_sign = f"{self.algorithm}\n{hashed_canonical_request}"

            # Calculate signature
            signature = hmac.new(
                self.access_key_secret.encode("utf-8"),
                string_to_sign.encode("utf-8"),
                hashlib.sha256
            ).hexdigest().lower()

            authorization = f'{self.algorithm} Credential={self.access_key_id},SignedHeaders={signed_headers},Signature={signature}'
            request.headers["Authorization"] = authorization

        except Exception as e:
            print(f"Authorization failed: {e}")
            raise

    def _process_object(self, result_map: Dict[str, str], key: str, value: Any) -> None:
        """Recursively process objects, flattening nested structures (for query parameters)"""
        if value is None:
            return

        if isinstance(value, (list, tuple)):
                self._process_object(result_map, f"{key}.{i + 1}", item)
        elif isinstance(value, dict):
            for sub_key, sub_value in value.items():
                self._process_object(result_map, f"{key}.{sub_key}", sub_value)
        else:
            key = key.lstrip(".")
            result_map[key] = value.decode("utf-8") if isinstance(value, bytes) else str(value)

    def _form_data_to_string(self, form_data: Dict[str, Any]) -> str:
        """Convert form data to URL-encoded string (for request body)"""
        tile_map = OrderedDict()
        self._process_object(tile_map, "", form_data)
        return urlencode(tile_map)

    def chat(self, message: str, session_id: str = None) -> None:
        """Send a message and receive streaming response"""
        # Reset state
        self.message_roles.clear()
        self.activity_delta_count = 0
        self.is_dot_sequence_active = False
        # Reset accumulated variables in non-verbose mode
        if not self.verbose:
            self.accumulated_text = ""
            self.accumulated_tool_result = ""
            self.last_complete_message = ""
            self.current_message_id = None
        
        request = SignatureRequest("POST", "/", self.host, self.action, self.version)

        # Build Message JSON (using compact format, no spaces)
        message_json = {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": message
                }
            ]
        }

        # Build form data (reference: curl invocation)
        form_data = OrderedDict()
        form_data["Format"] = "JSON"
        form_data["SourceIp"] = "127.0.0.1"  # Default IP, can be modified as needed
        form_data["SecureTransport"] = "true"
        # Use compact JSON format, no spaces
        form_data["Message"] = json.dumps(message_json, ensure_ascii=False, separators=(',', ':'))
        form_data["SourceTlsVersion"] = "TLSv1.2"
        form_data["UserId"] = "1000"  # Default user ID, can be modified as needed
        form_data["AcceptLanguage"] = "zh-CN"
        form_data["AgentId"] = self.agent_id
        # Use provided session_id, or generate a new one
        if session_id is None:
            session_id = str(uuid.uuid4())
        form_data["SessionId"] = session_id

        # Manually build URL-encoded string to ensure correct encoding
        from urllib.parse import quote
        body_parts = []
        for key, value in form_data.items():
            # URL-encode the value using quote's safe parameter
            encoded_value = quote(str(value), safe='')
            body_parts.append(f"{key}={encoded_value}")
        request.body = "&".join(body_parts).encode('utf-8')
        request.headers["content-type"] = "application/x-www-form-urlencoded"

        self._get_authorization(request)
        self._call_api(request)

    def _call_api(self, request: SignatureRequest) -> None:
        """Call the API and handle streaming response"""
        """Call the API and handle streaming response"""

        url = f"https://{request.host}{request.canonical_uri}"
        if request.query_param:
            url += "?" + urlencode(request.query_param, doseq=True, safe="*")

        headers = dict(request.headers)
        data = request.body

        # Add debug information
        if DEBUG:
            print(f"DEBUG: URL: {url}")
            print(f"DEBUG: Headers: {json.dumps(headers, indent=2, ensure_ascii=False)}")
            if data:
                print(f"DEBUG: Body: {data.decode('utf-8')}")

        try:
            response = requests.request(
                method=request.http_method,
                url=url,
                headers=headers,
                data=data,
                stream=True,
                timeout=300
            )

            # Check response status
            if DEBUG:
                print(f"DEBUG: Response status code: {response.status_code}")
                print(f"DEBUG: Response headers: {dict(response.headers)}")
                
            if response.status_code != 200:
                print(f"HTTP error: {response.status_code}")
                print(f"Response content: {response.text}")
                return

            for line in response.iter_lines(decode_unicode=True):
                if line:
                    if DEBUG:
                        # Display raw SSE line in DEBUG mode
                        print(f"DEBUG: Raw SSE line: {repr(line)}")
                    self._process_sse_line(line)

            print()  # Newline

        except requests.exceptions.Timeout:
            print("Request timed out")
        except requests.exceptions.ConnectionError:
            print("Connection failed")
        except requests.exceptions.HTTPError as e:
            print(f"HTTP error: {e}")
            if hasattr(e.response, 'text'):
                print(f"Error details: {e.response.text}")
        except Exception as e:
            print(f"Unknown error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            # Ensure dot sequence ends
            self._end_dot_sequence_if_active()
            # In non-verbose mode, output the last complete message
            if not self.verbose and self.last_complete_message:
                print(self.last_complete_message)

    def _end_dot_sequence_if_active(self) -> None:
        """If a dot sequence is being output, end it (print newline)"""
        """If a dot sequence is being output, end it (print newline)"""

        if self.is_dot_sequence_active:
            print()  # Print newline to end dot sequence
            self.is_dot_sequence_active = False

    def _process_sse_line(self, line: str) -> None:
        """Process SSE data stream"""
        """Process SSE data stream"""

        if line.startswith('data:'):
            data_content = line[5:]

            if data_content == '[DONE]':
                return

            try:
                json_data = json.loads(data_content)
                event_type = json_data.get('Type')
                
                if DEBUG:
                    print(f"DEBUG: Event type: {event_type}, Data: {json.dumps(json_data, ensure_ascii=False)}")
                
                # Text message content - only display assistant replies
                if event_type == 'TEXT_MESSAGE_CONTENT':
                    delta = json_data.get('Delta', '')
                    message_id = json_data.get('MessageId')
                    
                    # Check message role, only display assistant replies
                    if delta and message_id:
                        role = self.message_roles.get(message_id, '')
                        if role == 'assistant':
                            if self.verbose:
                                self._end_dot_sequence_if_active()
                                print(delta, end='', flush=True)
                            else:
                                # In non-verbose mode, accumulate to current message
                                if message_id == self.current_message_id:
                                    self.accumulated_text += delta
                        # Do not display user messages
                    elif delta and not message_id:
                        # If no MessageId, display by default (may be legacy format)
                        if self.verbose:
                            self._end_dot_sequence_if_active()
                            print(delta, end='', flush=True)
                        else:
                            # In non-verbose mode, accumulate to general text
                            self.accumulated_text += delta
                
                # Tool call start
                elif event_type == 'TOOL_CALL_START':
                    tool_id = json_data.get('ToolCallId')
                    
                    # Try to get tool name from multiple fields
                    tool_name = json_data.get('Name') or json_data.get('tool_name') or json_data.get('ToolCallName') or 'unknown_tool'
                    
                    # Record all fields for debugging
                    if DEBUG:
                        print(f"DEBUG TOOL_CALL_START full data: {json.dumps(json_data, ensure_ascii=False)}")
                        print(f"DEBUG available fields: {list(json_data.keys())}")
                        print(f"DEBUG extracted tool name: {tool_name}")
                    
                    # Initialize tool call data
                    self.tool_call_data[tool_id] = {
                        'name': tool_name,
                        'args': '',
                        'result': '',
                        'args_complete': False,
                        'result_complete': False
                    }
                    
                    # In non-verbose mode, record current tool ID and reset accumulated result
                    if not self.verbose:
                        self.current_tool_id = tool_id
                        self.accumulated_tool_result = ""
                    
                    if self.verbose:
                        self._end_dot_sequence_if_active()
                        print(f"\nCalling tool [{tool_name}]...")
                
                # Tool call arguments (streaming)
                elif event_type == 'TOOL_CALL_ARGS':
                    tool_id = json_data.get('ToolCallId')
                    delta = json_data.get('Delta', '')
                    
                    if tool_id in self.tool_call_data:
                        # Accumulate Delta field, preserve newlines (may affect JSON structure)
                        self.tool_call_data[tool_id]['args'] += delta
                    
                    if self.verbose and DEBUG:
                        print(f"DEBUG TOOL_CALL_ARGS: Tool ID: {tool_id[:8] if tool_id else 'N/A'}, Delta length: {len(delta)}, Content: {repr(delta)}")
                
                # Tool call result (streaming or direct)
                elif event_type == 'TOOL_CALL_RESULT':
                    tool_id = json_data.get('ToolCallId')
                    delta = json_data.get('Delta', '')
                    direct_result = json_data.get('Result')
                    content = json_data.get('Content', '')
                    
                    # Determine result content
                    result_content = ''
                    if delta:
                        result_content = delta
                        result_source = 'Delta'
                    elif direct_result is not None:
                        result_content = json.dumps(direct_result, ensure_ascii=False)
                        result_source = 'Result'
                    elif content:
                        result_content = content
                        result_source = 'Content'
                    
                    # Accumulate into tool data
                    if tool_id and tool_id in self.tool_call_data:
                        self.tool_call_data[tool_id]['result'] += result_content
                        if result_source in ['Result', 'Content']:
                            self.tool_call_data[tool_id]['result_complete'] = True
                    
                    # In non-verbose mode, accumulate to current tool result
                    if not self.verbose and result_content and tool_id == self.current_tool_id:
                        self.accumulated_tool_result += result_content
                    
                    # Display result (if verbose is True)
                    if self.verbose and result_content:
                        # If Content field, display immediately
                        if result_source == 'Content':
                            # Display tool result summary
                            tool_name = 'das_api'  # Default to das_api, since all DAS Agent tools are das_api
                            if tool_id and tool_id in self.tool_call_data:
                                tool_name = self.tool_call_data[tool_id]['name']
                                if DEBUG:
                                    print(f"DEBUG TOOL_CALL_RESULT: Found tool data, name: {tool_name}")
                            elif DEBUG:
                                print(f"DEBUG TOOL_CALL_RESULT: Tool ID {tool_id} not in tool_call_data, using default name das_api")
                                print(f"DEBUG TOOL_CALL_RESULT: Current stored tool IDs: {list(self.tool_call_data.keys())}")
                            
                            self._end_dot_sequence_if_active()
                            print(f"\n[Result]")
                            # Display result preview
                            if len(result_content) > 500:
                                preview = result_content[:500] + "..."
                                print(f"{preview}")
                            else:
                                print(f"{result_content}")
                    
                    if DEBUG:
                        if result_content:
                            content_preview = result_content[:100] + "..." if len(result_content) > 100 else result_content
                            print(f"DEBUG TOOL_CALL_RESULT: Tool ID: {tool_id[:8] if tool_id else 'N/A'}, Source: {result_source}, Preview: {repr(content_preview)}")
                
                # Tool call chunk (another form of streaming tool call)
                elif event_type == 'TOOL_CALL_CHUNK':
                    tool_id = json_data.get('ToolCallId')
                    chunk = json_data.get('Chunk', '')
                    
                    if tool_id in self.tool_call_data:
                        # Add chunk data to result
                        self.tool_call_data[tool_id]['result'] += str(chunk)
                    
                    if self.verbose and DEBUG:
                        print(f"DEBUG TOOL_CALL_CHUNK: Tool ID: {tool_id[:8] if tool_id else 'N/A'}, Chunk length: {len(str(chunk))}")
                
                # Tool call end
                elif event_type == 'TOOL_CALL_END':
                    tool_id = json_data.get('ToolCallId')
                    
                    # Check for direct Result field (non-streaming)
                    direct_result = json_data.get('Result')
                    
                    if DEBUG:
                        print(f"DEBUG TOOL_CALL_END: Tool ID: {tool_id}, Direct result: {direct_result is not None}")
                        if tool_id in self.tool_call_data:
                            print(f"DEBUG TOOL_CALL_END: Accumulated data: {self.tool_call_data[tool_id]}")
                    
                    # In non-verbose mode, save accumulated tool result
                    if not self.verbose and tool_id == self.current_tool_id:
                        # If direct result exists, prefer it
                        if direct_result is not None:
                            self.last_complete_message = json.dumps(direct_result, ensure_ascii=False)
                        elif self.accumulated_tool_result:
                            self.last_complete_message = self.accumulated_tool_result
                        # Reset current tool ID
                        self.current_tool_id = None
                        self.accumulated_tool_result = ""
                    
                    if tool_id in self.tool_call_data:
                        # Clean up data, display nothing
                        del self.tool_call_data[tool_id]
                    # Do not display TOOL_CALL_END event
                
                # Text message start/end (do not display)
                elif event_type == 'TEXT_MESSAGE_START':
                    # Record message role
                    message_id = json_data.get('MessageId')
                    role = json_data.get('Role', '')
                    if message_id and role:
                        self.message_roles[message_id] = role
                        # In non-verbose mode, if assistant message, start accumulating text
                        if not self.verbose and role == 'assistant':
                            self.current_message_id = message_id
                            self.accumulated_text = ""
                elif event_type == 'TEXT_MESSAGE_END':
                    # Clean up message role (optional)
                    message_id = json_data.get('MessageId')
                    if message_id and message_id in self.message_roles:
                        role = self.message_roles[message_id]
                        # In non-verbose mode, if assistant message, save accumulated text
                        if not self.verbose and role == 'assistant' and message_id == self.current_message_id:
                            self.last_complete_message = self.accumulated_text
                            # Reset current message ID
                            self.current_message_id = None
                        del self.message_roles[message_id]
                
                # Run start/end (do not display)
                elif event_type in ['RUN_STARTED', 'RUN_FINISHED']:
                    pass  # Do not display run start/end events
                
                # Activity delta (display waiting state)
                elif event_type == 'ACTIVITY_DELTA':
                    activity_type = json_data.get('ActivityType', '')
                    # Non-verbose mode: output dot sequence for all activity deltas
                    # Verbose mode: only output dot sequence for waiting_for_agent_thinking
                    if (not self.verbose) or activity_type == 'waiting_for_agent_thinking':
                        # Output a dot to indicate loading
                        print(".", end="", flush=True)
                        self.is_dot_sequence_active = True
                        self.activity_delta_count += 1
                
                # Custom event - check for errors
                elif event_type == 'CUSTOM':
                    event_name = json_data.get('Name', '')
                    value = json_data.get('Value', {})
                    if event_name == 'error' and isinstance(value, dict):
                        error_code = value.get('Code', 'unknown')
                        error_msg = value.get('Message', 'Unknown error')
                        print(f"\n[错误 {error_code}] {error_msg}", file=sys.stderr)
                    # Silently ignore other custom events
                
                # Other event types (do not display)
                elif self.verbose and event_type:
                    pass  # Do not display other event types
                
                # Compatibility: handle Answer field (legacy format)
                elif 'Answer' in json_data:
                    answer = json_data['Answer']
                    if self.verbose:
                        print(answer, end='', flush=True)
                    else:
                        # In non-verbose mode, accumulate to text
                        self.accumulated_text += answer
                        self.last_complete_message = self.accumulated_text
                    
            except json.JSONDecodeError:
                if self.verbose:
                    print(f"\n[JSON parse error] Raw data: {data_content[:100]}...")


def main():
    parser = argparse.ArgumentParser(description="Call Alibaba Cloud DAS Agent Chat API")
    parser.add_argument("--question", required=True, help="The question to send to the Agent")
    parser.add_argument("--session", help="Session ID for maintaining conversation context. If not provided, a new session ID will be generated")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output mode, display all SSE events")
    args = parser.parse_args()

    try:
        client = DasAgentChatClient(verbose=args.verbose)
        client.chat(args.question, session_id=args.session)
    except ValueError as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Runtime error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()