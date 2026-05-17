import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

with open('tank_v12.js', 'r', encoding='utf-8') as f:
    code = f.read()

payload = json.dumps({
    'code': code,
    'notes': 'V12: 修复BFS队列限制逻辑(while+head指针)、dodgeBullet null检查、star数组越界检查、isArenaMap边界检查、shouldUseCloak冷却逻辑、fallback myDir安全检查',
    'submittedBy': 'Kimi'
}, ensure_ascii=False)

req = urllib.request.Request(
    'https://agentank.ai/api/agent/tank/code',
    data=payload.encode('utf-8'),
    headers={
        'Authorization': 'Bearer agtk_02f8766a36396bf65e8ddb3da25ad8d48e02',
        'Content-Type': 'application/json',
        'User-Agent': 'curl/7.68.0',
        'Accept': 'application/json'
    },
    method='POST'
)

try:
    with urllib.request.urlopen(req, context=ctx) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print('SUCCESS')
        print('Version:', data.get('version',{}).get('version'))
        print('Hash:', data.get('version',{}).get('codeHash'))
        with open('publish_v12.json', 'w') as f:
            json.dump(data, f, indent=2)
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code)
    try:
        print('Response:', e.read().decode('utf-8'))
    except:
        print('No response body')
except Exception as e:
    print('Error:', e)
