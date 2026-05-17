import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

with open('tank_v15.js', 'r', encoding='utf-8') as f:
    code = f.read()

payload = json.dumps({
    'code': code,
    'notes': 'V15: 修复坐标维度混淆(x对应列W,y对应行H)，全局变量封装到闭包避免多实例污染，增强所有函数参数验证和空值检查(hasClearShot/manhattan/willBeInLineOfFire等)，增强bullet.position访问检查，修复getEscapeDir参数传递，使用值比较替代引用比较',
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
        with open('publish_v15.json', 'w') as f:
            json.dump(data, f, indent=2)
except urllib.error.HTTPError as e:
    print('HTTP Error:', e.code)
    try:
        print('Response:', e.read().decode('utf-8'))
    except:
        print('No response body')
except Exception as e:
    print('Error:', e)
