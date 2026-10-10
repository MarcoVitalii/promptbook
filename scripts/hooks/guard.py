#!/usr/bin/env python3
"""PreToolUse hook: keeps Read, Edit and Write off the built promptbook.html and promptbook-cast.html."""
import json, os, sys
d = json.load(sys.stdin)
path = (d.get('tool_input') or {}).get('file_path') or ''
root = os.environ.get('CLAUDE_PROJECT_DIR') or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if os.path.abspath(path) in [os.path.join(os.path.abspath(root), f) for f in ('promptbook.html', 'promptbook-cast.html')]:
    print(json.dumps({'hookSpecificOutput': {'hookEventName': 'PreToolUse', 'permissionDecision': 'deny',
        'permissionDecisionReason': 'This file is built output. Read and edit src/ instead; scripts/check.sh rebuilds it.'}}))
