import json
from collections import Counter

with open('matches_latest.json', 'r') as f:
    matches = json.load(f)

# v15 hash: 36b92ffccee721959e7d3573615b9a72a40f2e0b2fb012411c4dc5a697eca9cd
# v14 hash: 5fac67a05a06aec83587ed3ac7477baa534d82d68560f2cdc270731a7323d22d
v15_hash = '36b92ffccee721959e7d3573615b9a72a40f2e0b2fb012411c4dc5a697eca9cd'
v14_hash = '5fac67a05a06aec83587ed3ac7477baa534d82d68560f2cdc270731a7323d22d'

tank_id = 737

v15_matches = []
v14_matches = []
other_matches = []

for m in matches:
    c_hash = m.get('challengerCodeHash')
    d_hash = m.get('defenderCodeHash')
    is_challenger = m.get('challengerTankId') == tank_id

    if is_challenger:
        my_hash = c_hash
    else:
        my_hash = d_hash

    if my_hash == v15_hash:
        v15_matches.append(m)
    elif my_hash == v14_hash:
        v14_matches.append(m)
    else:
        other_matches.append(m)

def analyze(match_list, label):
    total = len(match_list)
    if total == 0:
        print(f"\n=== {label}: 0 matches ===")
        return

    wins = sum(1 for m in match_list if m.get('winnerTankId') == tank_id)
    losses = total - wins
    win_rate = wins / total * 100

    my_crashes = sum(1 for m in match_list
        if (m.get('challengerTankId') == tank_id and m.get('resultReason') == 'crashed')
        or (m.get('defenderTankId') == tank_id and m.get('resultReason') == 'crashed'))
    opp_crashes = sum(1 for m in match_list if m.get('resultReason') == 'crashed') - my_crashes

    my_runTime = sum(1 for m in match_list
        if (m.get('challengerTankId') == tank_id and m.get('resultReason') == 'runTime')
        or (m.get('defenderTankId') == tank_id and m.get('resultReason') == 'runTime'))
    opp_runTime = sum(1 for m in match_list if m.get('resultReason') == 'runTime') - my_runTime

    my_star = sum(1 for m in match_list
        if (m.get('challengerTankId') == tank_id and m.get('resultReason') == 'star')
        or (m.get('defenderTankId') == tank_id and m.get('resultReason') == 'star'))
    opp_star = sum(1 for m in match_list if m.get('resultReason') == 'star') - my_star

    print(f"\n=== {label}: {total} matches ===")
    print(f"  Wins: {wins}, Losses: {losses}, WinRate: {win_rate:.1f}%")
    print(f"  My crashes: {my_crashes} ({my_crashes/total*100:.1f}%)")
    print(f"  Opp crashes: {opp_crashes} ({opp_crashes/total*100:.1f}%)")
    print(f"  My runTime: {my_runTime} ({my_runTime/total*100:.1f}%)")
    print(f"  Opp runTime: {opp_runTime} ({opp_runTime/total*100:.1f}%)")
    print(f"  My star wins: {my_star}, Opp star wins: {opp_star}")

    # By map
    maps = Counter(m.get('mapId', 'unknown') for m in match_list)
    print(f"  By map: {dict(maps)}")

    # By opponent
    opps = Counter()
    for m in match_list:
        if m.get('challengerTankId') == tank_id:
            opps[m.get('defenderTankName', 'Unknown')] += 1
        else:
            opps[m.get('challengerTankName', 'Unknown')] += 1
    print(f"  Top opponents: {opps.most_common(5)}")

    # Timeline (by createdAt)
    times = sorted(m.get('createdAt', '') for m in match_list)
    if times:
        print(f"  Time range: {times[0]} to {times[-1]}")

analyze(v15_matches, "V15")
analyze(v14_matches, "V14")
analyze(other_matches, "OTHER/UNKNOWN")

print(f"\n=== SUMMARY ===")
print(f"V15 matches: {len(v15_matches)}")
print(f"V14 matches: {len(v14_matches)}")
print(f"Other matches: {len(other_matches)}")
