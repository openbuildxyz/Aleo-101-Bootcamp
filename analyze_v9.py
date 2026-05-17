import json

with open('matches_latest.json', 'r') as f:
    matches = json.load(f)

v9_hash = '8a3de3a66a337727601c9878691c077b003b107dbbea9bf8dc1cf7538c0ba85a'
v8_hash = 'ac225aee43d8e35b973966d7a592e5d2f2c327f0ccf1d555c38a5464e5203dda'

v9_matches = []
v8_matches = []
for m in matches:
    if m.get('defenderCodeHash') == v9_hash or m.get('challengerCodeHash') == v9_hash:
        v9_matches.append(m)
    elif m.get('defenderCodeHash') == v8_hash or m.get('challengerCodeHash') == v8_hash:
        v8_matches.append(m)

print(f"=== V9 MATCHES: {len(v9_matches)} ===")
v9_wins = 0
v9_losses = 0
v9_opps = {}
v9_maps = {}
v9_loss_reasons = {}
for m in v9_matches:
    is_winner = m.get('winnerTankId') == 737
    if is_winner: v9_wins += 1
    else: v9_losses += 1
    opp = m.get('challengerTankName', 'Unknown')
    if opp not in v9_opps: v9_opps[opp] = {'w':0,'l':0}
    if is_winner: v9_opps[opp]['w'] += 1
    else: v9_opps[opp]['l'] += 1
    map_name = m.get('mapId', 'Unknown')
    if map_name not in v9_maps: v9_maps[map_name] = {'w':0,'l':0}
    if is_winner: v9_maps[map_name]['w'] += 1
    else: v9_maps[map_name]['l'] += 1
    if not is_winner:
        reason = m.get('resultReason', 'unknown')
        v9_loss_reasons[reason] = v9_loss_reasons.get(reason, 0) + 1

print(f"Wins: {v9_wins}, Losses: {v9_losses}, WR: {v9_wins/(v9_wins+v9_losses)*100:.1f}%")
print("\nBy Opponent:")
for opp, rec in sorted(v9_opps.items(), key=lambda x: -(x[1]['w']+x[1]['l'])):
    total = rec['w']+rec['l']
    print(f"  {opp}: {rec['w']}W/{rec['l']}L ({rec['w']/total*100:.0f}%)")
print("\nBy Map:")
for map_name, rec in sorted(v9_maps.items(), key=lambda x: -(x[1]['w']+x[1]['l'])):
    total = rec['w']+rec['l']
    print(f"  {map_name}: {rec['w']}W/{rec['l']}L ({rec['w']/total*100:.0f}%)")
print("\nLoss Reasons:")
for reason, count in v9_loss_reasons.items():
    print(f"  {reason}: {count}")

print(f"\n=== V8 MATCHES: {len(v8_matches)} ===")
v8_wins = 0
v8_losses = 0
v8_opps = {}
for m in v8_matches:
    is_winner = m.get('winnerTankId') == 737
    if is_winner: v8_wins += 1
    else: v8_losses += 1
    opp = m.get('challengerTankName', 'Unknown')
    if opp not in v8_opps: v8_opps[opp] = {'w':0,'l':0}
    if is_winner: v8_opps[opp]['w'] += 1
    else: v8_opps[opp]['l'] += 1

print(f"Wins: {v8_wins}, Losses: {v8_losses}, WR: {v8_wins/(v8_wins+v8_losses)*100:.1f}%")
print("\nBy Opponent:")
for opp, rec in sorted(v8_opps.items(), key=lambda x: -(x[1]['w']+x[1]['l'])):
    total = rec['w']+rec['l']
    print(f"  {opp}: {rec['w']}W/{rec['l']}L ({rec['w']/total*100:.0f}%)")

# Show all v9 match details
print("\n=== V9 MATCH DETAILS ===")
for m in v9_matches:
    is_winner = m.get('winnerTankId') == 737
    opp = m.get('challengerTankName', 'Unknown')
    map_name = m.get('mapId', 'Unknown')
    reason = m.get('resultReason', 'unknown')
    result = "WIN" if is_winner else "LOSS"
    print(f"  {result} vs {opp} on {map_name} ({reason})")
