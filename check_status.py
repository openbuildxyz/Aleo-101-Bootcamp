import json
import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

API_KEY = 'agtk_02f8766a36396bf65e8ddb3da25ad8d48e02'
BASE = 'https://agentank.ai/api'

def api(path):
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

# Get tank status
tank = api('/agent/tank')
print('=== TANK STATUS ===')
print(f"Version: {tank.get('codeVersion')}")
print(f"ELO: {tank.get('elo')}")
print(f"Wins: {tank.get('wins')}")
print(f"Losses: {tank.get('losses')}")
print(f"Rank: {tank.get('rankTier')} {tank.get('rankDivision')}")
print(f"Rank Points: {tank.get('rankPoints')}")
print(f"Rank Score: {tank.get('rankScore')}")

# Get recent matches
resp = api('/agent/tank/matches?limit=50')
matches = resp.get('matches', [])
print(f"\n=== RECENT {len(matches)} MATCHES ===")

wins = 0
losses = 0
opponents = {}
maps = {}
win_reasons = {}
loss_reasons = {}

for m in matches:
    is_winner = m.get('winnerTankId') == 737
    if is_winner:
        wins += 1
    else:
        losses += 1

    opp = m.get('challengerTankName', m.get('opponentTankName', 'Unknown'))
    if opp not in opponents:
        opponents[opp] = {'w': 0, 'l': 0}
    if is_winner:
        opponents[opp]['w'] += 1
    else:
        opponents[opp]['l'] += 1

    map_name = m.get('mapId', 'Unknown')
    if map_name not in maps:
        maps[map_name] = {'w': 0, 'l': 0}
    if is_winner:
        maps[map_name]['w'] += 1
    else:
        maps[map_name]['l'] += 1

    reason = m.get('resultReason', 'unknown')
    if is_winner:
        win_reasons[reason] = win_reasons.get(reason, 0) + 1
    else:
        loss_reasons[reason] = loss_reasons.get(reason, 0) + 1

print(f"Wins: {wins}, Losses: {losses}, WinRate: {wins/(wins+losses)*100:.1f}%")

print("\n--- By Opponent ---")
for opp, rec in sorted(opponents.items(), key=lambda x: -(x[1]['w']+x[1]['l'])):
    total = rec['w'] + rec['l']
    wr = rec['w']/total*100 if total > 0 else 0
    print(f"  {opp}: {rec['w']}W/{rec['l']}L ({wr:.0f}%) [{total} games]")

print("\n--- By Map ---")
for map_name, rec in sorted(maps.items(), key=lambda x: -(x[1]['w']+x[1]['l'])):
    total = rec['w'] + rec['l']
    wr = rec['w']/total*100 if total > 0 else 0
    print(f"  {map_name}: {rec['w']}W/{rec['l']}L ({wr:.0f}%) [{total} games]")

print("\n--- Win Reasons ---")
for reason, count in win_reasons.items():
    print(f"  {reason}: {count}")

print("\n--- Loss Reasons ---")
for reason, count in loss_reasons.items():
    print(f"  {reason}: {count}")

# Check v9 code hash in matches
v9_hash = '8a3de3a66a337727601c9878691c077b003b107dbbea9bf8dc1cf7538c0ba85a'
v8_hash = 'ac225aee43d8e35b973966d7a592e5d2f2c327f0ccf1d555c38a5464e5203dda'
v9_matches = [m for m in matches if m.get('defenderCodeHash') == v9_hash or m.get('challengerCodeHash') == v9_hash]
v8_matches = [m for m in matches if m.get('defenderCodeHash') == v8_hash or m.get('challengerCodeHash') == v8_hash]
print(f"\n--- Version Detection ---")
print(f"V9 matches in sample: {len(v9_matches)}")
print(f"V8 matches in sample: {len(v8_matches)}")

# Save raw data
with open('matches_latest.json', 'w') as f:
    json.dump(matches, f, indent=2)
print("\nSaved to matches_latest.json")
