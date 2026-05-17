import json

with open('matches_latest.json') as f:
    matches = json.load(f)

v10_hash = 'a04023e58550ea41ec8804fabd6ac90b804c16a5dce7975d0110bcffe5551c6d'
v10_matches = [m for m in matches if m.get('defenderCodeHash') == v10_hash or m.get('challengerCodeHash') == v10_hash]

print('=== V10 MATCH DETAILS ===')
for m in v10_matches:
    is_winner = m.get('winnerTankId') == 737
    opp = m.get('challengerTankName', m.get('defenderTankName', 'Unknown'))
    if opp == '陆奕丞':
        opp = m.get('defenderTankName', m.get('challengerTankName', 'Unknown'))
    reason = m.get('resultReason', 'unknown')
    map_name = m.get('mapId', 'unknown')
    created = m.get('createdAt', '')
    result = 'WIN' if is_winner else 'LOSS'
    print(f'{created} | {map_name} | vs {opp} | {result} | {reason}')

print('\n=== OVERALL 50 MATCH STATS ===')
all_wins = sum(1 for m in matches if m.get('winnerTankId') == 737)
all_losses = len(matches) - all_wins
print(f'Total: {all_wins}W/{all_losses}L ({all_wins/len(matches)*100:.1f}%)')

opp_stats = {}
for m in matches:
    is_winner = m.get('winnerTankId') == 737
    opp = m.get('challengerTankName', m.get('opponentTankName', 'Unknown'))
    if opp not in opp_stats:
        opp_stats[opp] = {'w': 0, 'l': 0}
    if is_winner:
        opp_stats[opp]['w'] += 1
    else:
        opp_stats[opp]['l'] += 1

print('\n--- By Opponent (all versions) ---')
for opp, rec in sorted(opp_stats.items(), key=lambda x: -(x[1]['w']+x[1]['l'])):
    total = rec['w'] + rec['l']
    wr = rec['w']/total*100 if total > 0 else 0
    print(f'  {opp}: {rec["w"]}W/{rec["l"]}L ({wr:.0f}%) [{total} games]')

loss_reasons = {}
for m in matches:
    if m.get('winnerTankId') != 737:
        r = m.get('resultReason', 'unknown')
        loss_reasons[r] = loss_reasons.get(r, 0) + 1
print('\n--- Loss Reasons ---')
for r, c in loss_reasons.items():
    print(f'  {r}: {c}')
