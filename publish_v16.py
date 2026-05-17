import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

with open('tank_v16.js', 'r', encoding='utf-8') as f:
    code = f.read()

payload = json.dumps({
    'code': code,
    'notes': 'V16: 在v15基础上修复8个高风险隐患 - 1)me.tank.position增加长度检查 2)enemy.bullet增加对象类型验证 3)game.star增加数组类型验证 4)enemy.status增加null检查(typeof null===object陷阱) 5)predictEnemyPosSteps增加NaN检查 6)score比较增加NaN过滤 7)getBulletDir增加direction字符串类型检查 8)safeTurn增加dir字符串类型验证',
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
        with open('publish_v16.json', 'w') as f:
            json.dump(data, f, indent=2)
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code)
    try:
        print('Response:', e.read().decode('utf-8'))
    except:
        print('No response body')
except Exception as e:
    print('Error:', e)
