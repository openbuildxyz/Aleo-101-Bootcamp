import json
import urllib.request
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

API_KEY = 'agtk_02f8766a36396bf65e8ddb3da25ad8d48e02'
BASE = 'https://agentank.ai/api'

def api(path, data=None):
    if data:
        req = urllib.request.Request(
            BASE + path,
            data=json.dumps(data).encode('utf-8'),
            headers={
                'Authorization': 'Bearer ' + API_KEY,
                'Content-Type': 'application/json',
                'User-Agent': 'curl/7.68.0',
                'Accept': 'application/json'
            },
            method='POST'
        )
    else:
        req = urllib.request.Request(
            BASE + path,
            headers={
                'Authorization': 'Bearer ' + API_KEY,
                'Accept': 'application/json',
                'User-Agent': 'curl/7.68.0'
            }
        )
    with urllib.request.urlopen(req, context=ctx) as resp:
        return json.loads(resp.read().decode('utf-8'))

# Read v10 code
with open('tank_v10.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Test against training bots
bots = [
    ('nova-scout', 'Nova Scout'),
    ('azure-hunter', 'Azure Hunter'),
    ('crimson-bastion', 'Crimson Bastion')
]

maps = ['classic', 'arena', 'random']

results = []

print('=== V10 SIMULATION TESTS ===\n')

for bot_id, bot_name in bots:
    for map_id in maps:
        print(f'Testing vs {bot_name} on {map_id}...', end=' ')
        try:
            resp = api('/agent/tank/simulate', {
                'code': code,
                'opponent': bot_id,
                'map': map_id
            })
            winner = resp.get('winner')
            reason = resp.get('endReason', 'unknown')
            is_win = winner == 'challenger'
            results.append({
                'bot': bot_name,
                'map': map_id,
                'win': is_win,
                'reason': reason,
                'winner': winner
            })
            status = 'WIN' if is_win else 'LOSS'
            print(f'{status} ({reason})')
            time.sleep(0.5)
        except Exception as e:
            print(f'ERROR: {e}')
            results.append({
                'bot': bot_name,
                'map': map_id,
                'win': False,
                'reason': 'error',
                'error': str(e)
            })

# Summary
wins = sum(1 for r in results if r['win'])
total = len(results)
print(f'\n=== RESULTS: {wins}/{total} wins ({wins/total*100:.0f}%) ===')

for map_id in maps:
    map_results = [r for r in results if r['map'] == map_id]
    map_wins = sum(1 for r in map_results if r['win'])
    print(f'\n{map_id}: {map_wins}/{len(map_results)} wins')
    for r in map_results:
        status = 'WIN' if r['win'] else 'LOSS'
        print(f'  {status} vs {r["bot"]} ({r["reason"]})')

# Save results
with open('sim_v10_results.json', 'w') as f:
    json.dump(results, f, indent=2)
