#!/usr/bin/env python3
"""PreToolUse hook: keeps Read, Edit and Write off the built promptbook.html."""
import json, os, sys
d = json.load(sys.stdin)
path = (d.get('tool_input') or {}).get('file_path') or ''
root = os.environ.get('CLAUDE_PROJECT_DIR') or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if os.path.abspath(path) == os.path.join(os.path.abspath(root), 'promptbook.html'):
    print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': 'deny',
        'permissionDecisionReason': 'promptbook.html is built output (285 KB, base64 fonts). Read and edit src/ instead; scripts/check.sh rebuilds it.'}}))
