import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

API_KEY = 'agtk_02f8766a36396bf65e8ddb3da25ad8d48e02'

req = urllib.request.Request(
    'https://agentank.ai/api/leaderboard?limit=200',
    headers={
        'Authorization': 'Bearer ' + API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'curl/7.68.0'
    }
)
with urllib.request.urlopen(req, context=ctx) as resp:
    data = json.loads(resp.read().decode('utf-8'))

# Save raw
with open('leaderboard_raw.json', 'w') as f:
    json.dump(data, f, indent=2)

my_id = 737

print(f'Total tanks in leaderboard: {len(data)}')

# Find dodo
print('\n--- dodo stats ---')
for t in data:
    name = t.get('name') or t.get('ownerDisplayName') or 'Unknown'
    if 'dodo' in name.lower():
        wr = t.get('wins',0)/(t.get('wins',0)+t.get('losses',1))*100
        print(f"  #{t.get('rank')} {name} (v{t.get('codeVersion')}) - ELO:{t.get('elo')} - W:{t.get('wins')}/L:{t.get('losses')} ({wr:.0f}%)")

# Find my position
print('\n--- My Tank ---')
for t in data:
    if t.get('tankId') == my_id:
        name = t.get('name') or t.get('ownerDisplayName') or 'Unknown'
        wr = t.get('wins',0)/(t.get('wins',0)+t.get('losses',1))*100
        print(f"  #{t.get('rank')} {name} (v{t.get('codeVersion')}) - ELO:{t.get('elo')} - {t.get('rankTier')} {t.get('rankDivision')} - W:{t.get('wins')}/L:{t.get('losses')} ({wr:.0f}%)")
        break

# Find high ELO tanks with many battles
print('\n--- High ELO Tanks (1500+) ---')
for t in data:
    if t.get('elo', 0) >= 1500:
        name = t.get('name') or t.get('ownerDisplayName') or 'Unknown'
        total = t.get('wins',0) + t.get('losses',0)
        wr = t.get('wins',0)/total*100 if total > 0 else 0
        print(f"  #{t.get('rank')} {name} (v{t.get('codeVersion')}) - ELO:{t.get('elo')} - W:{t.get('wins')}/L:{t.get('losses')} ({wr:.0f}%) - {t.get('rankTier')} {t.get('rankDivision')}")

# Find Avoider
print('\n--- Avoider stats ---')
for t in data:
    name = t.get('name') or t.get('ownerDisplayName') or 'Unknown'
    if 'avoid' in name.lower():
        wr = t.get('wins',0)/(t.get('wins',0)+t.get('losses',1))*100
        print(f"  #{t.get('rank')} {name} (v{t.get('codeVersion')}) - ELO:{t.get('elo')} - W:{t.get('wins')}/L:{t.get('losses')} ({wr:.0f}%)")

# Find berlin
print('\n--- berlin stats ---')
for t in data:
    name = t.get('name') or t.get('ownerDisplayName') or 'Unknown'
    if 'berlin' in name.lower():
        wr = t.get('wins',0)/(t.get('wins',0)+t.get('losses',1))*100
        print(f"  #{t.get('rank')} {name} (v{t.get('codeVersion')}) - ELO:{t.get('elo')} - W:{t.get('wins')}/L:{t.get('losses')} ({wr:.0f}%)")
