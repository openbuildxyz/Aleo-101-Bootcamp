import json

with open('matches_latest.json') as f:
    matches = json.load(f)

v12_hash = '349923f8fddf7851f7f4d383e0c7ad12cb31c99ce0570ae1d21d97e0987392ff'
v12_matches = []
for m in matches:
    if m.get('defenderCodeHash') == v12_hash or m.get('challengerCodeHash') == v12_hash:
        v12_matches.append(m)

print(f'v12 matches in sample: {len(v12_matches)} / {len(matches)}')
for m in v12_matches:
    is_winner = m.get('winnerTankId') == 737
    opp = m.get('challengerTankName') or m.get('defenderTankName')
    created = m.get('createdAt', '')[:19]
    reason = m.get('resultReason')
    print(f"  {created} vs {opp}: {'WIN' if is_winner else 'LOSS'} ({reason})")

if v12_matches:
    wins = sum(1 for m in v12_matches if m.get('winnerTankId') == 737)
    losses = len(v12_matches) - wins
    crashes = sum(1 for m in v12_matches if m.get('resultReason') == 'crashed')
    errors = sum(1 for m in v12_matches if m.get('resultReason') == 'error')
    runtimes = sum(1 for m in v12_matches if m.get('resultReason') == 'runTime')
    print(f"\nv12 summary: {wins}W/{losses}L, crash={crashes}, error={errors}, runTime={runtimes}")
