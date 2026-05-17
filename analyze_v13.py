import json

with open('matches_latest.json') as f:
    matches = json.load(f)

v13_hash = 'b662419521414c197bfa344c36d7e61d3bdb7cf3a24afe9292c551e2fc6261a0'
v12_hash = '349923f8fddf7851f7f4d383e0c7ad12cb31c99ce0570ae1d21d97e0987392ff'

v13_matches = []
v12_matches = []
other_matches = []

for m in matches:
    d_hash = m.get('defenderCodeHash', '')
    c_hash = m.get('challengerCodeHash', '')
    is_v13 = d_hash == v13_hash or c_hash == v13_hash
    is_v12 = d_hash == v12_hash or c_hash == v12_hash
    
    if is_v13:
        v13_matches.append(m)
    elif is_v12:
        v12_matches.append(m)
    else:
        other_matches.append(m)

print('=== VERSION ANALYSIS ===')
print('Total matches in sample:', len(matches))
print('v13 matches:', len(v13_matches))
print('v12 matches:', len(v12_matches))
print('Other matches:', len(other_matches))

if v13_matches:
    print('\n=== V13 DETAIL ===')
    wins = sum(1 for m in v13_matches if m.get('winnerTankId') == 737)
    losses = len(v13_matches) - wins
    crashes = sum(1 for m in v13_matches if m.get('resultReason') == 'crashed')
    errors = sum(1 for m in v13_matches if m.get('resultReason') == 'error')
    runtimes = sum(1 for m in v13_matches if m.get('resultReason') == 'runTime')
    stars = sum(1 for m in v13_matches if m.get('resultReason') == 'star')
    print('Record: %dW/%dL (%.0f%%)' % (wins, losses, wins/len(v13_matches)*100))
    print('crash=%d, error=%d, runTime=%d, star=%d' % (crashes, errors, runtimes, stars))
    print('\nRecent v13 matches:')
    for m in v13_matches[:20]:
        is_winner = m.get('winnerTankId') == 737
        opp = m.get('challengerTankName') or m.get('defenderTankName')
        created = m.get('createdAt', '')[:19]
        reason = m.get('resultReason')
        status = 'WIN' if is_winner else 'LOSS'
        print('  %s vs %s: %s (%s)' % (created, opp, status, reason))

if v12_matches:
    print('\n=== V12 DETAIL ===')
    wins = sum(1 for m in v12_matches if m.get('winnerTankId') == 737)
    losses = len(v12_matches) - wins
    crashes = sum(1 for m in v12_matches if m.get('resultReason') == 'crashed')
    errors = sum(1 for m in v12_matches if m.get('resultReason') == 'error')
    runtimes = sum(1 for m in v12_matches if m.get('resultReason') == 'runTime')
    print('Record: %dW/%dL, crash=%d, error=%d, runTime=%d' % (wins, losses, crashes, errors, runtimes))
