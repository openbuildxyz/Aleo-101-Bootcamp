import json
from collections import defaultdict, Counter

V14_HASH = '5fac67a05a06aec83587ed3ac7477baa534d82d68560f2cdc270731a7323d22d'

with open(r'c:\Users\21601\Documents\project\Aleo-101-Bootcamp\matches_latest.json', 'r', encoding='utf-8') as f:
    matches = json.load(f)

v14_matches = []
for m in matches:
    if m.get('challengerCodeHash') == V14_HASH or m.get('defenderCodeHash') == V14_HASH:
        v14_matches.append(m)

total = len(v14_matches)
wins = 0
losses = 0
win_reasons = Counter()
loss_reasons = Counter()

defender_wins = 0
defender_losses = 0
challenger_wins = 0
challenger_losses = 0

opponents = defaultdict(lambda: {'wins': 0, 'losses': 0, 'total': 0})

for m in v14_matches:
    is_defender = m.get('defenderCodeHash') == V14_HASH
    is_challenger = m.get('challengerCodeHash') == V14_HASH

    winner_tank_id = m.get('winnerTankId')
    v14_tank_id = m.get('defenderTankId') if is_defender else m.get('challengerTankId')

    v14_won = (winner_tank_id == v14_tank_id)
    reason = m.get('resultReason', 'unknown')

    if v14_won:
        wins += 1
        win_reasons[reason] += 1
    else:
        losses += 1
        loss_reasons[reason] += 1

    if is_defender:
        if v14_won:
            defender_wins += 1
        else:
            defender_losses += 1
    elif is_challenger:
        if v14_won:
            challenger_wins += 1
        else:
            challenger_losses += 1

    if is_defender:
        opp_name = m.get('challengerTankName', 'Unknown')
        opp_id = m.get('challengerTankId', 'unknown')
    else:
        opp_name = m.get('defenderTankName', 'Unknown')
        opp_id = m.get('defenderTankId', 'unknown')

    opp_key = f'{opp_name} (ID:{opp_id})'
    opponents[opp_key]['total'] += 1
    if v14_won:
        opponents[opp_key]['wins'] += 1
    else:
        opponents[opp_key]['losses'] += 1

print('=' * 60)
print('v14版本 (5fac67a...) 对战统计报告')
print('=' * 60)
print(f'1. 总场数: {total}')
print(f'2. 胜场数: {wins} | 负场数: {losses} | 胜率: {wins/total*100:.1f}%')
print()
print('3. 胜利原因分布:')
for reason, count in win_reasons.most_common():
    print(f'   - {reason}: {count}')
print()
print('4. 失败原因分布:')
for reason, count in loss_reasons.most_common():
    print(f'   - {reason}: {count}')
print()
print('5. 作为防守方(defender)战绩:')
print(f'   胜: {defender_wins} | 负: {defender_losses} | 总计: {defender_wins+defender_losses}')
print(f'   胜率: {defender_wins/(defender_wins+defender_losses)*100:.1f}%')
print()
print('   作为挑战方(challenger)战绩:')
print(f'   胜: {challenger_wins} | 负: {challenger_losses} | 总计: {challenger_wins+challenger_losses}')
if challenger_wins + challenger_losses > 0:
    print(f'   胜率: {challenger_wins/(challenger_wins+challenger_losses)*100:.1f}%')
else:
    print('   胜率: N/A (无比赛)')
print()
print('6. 与各个对手的对战记录:')
print('-' * 60)
for opp, stats in sorted(opponents.items(), key=lambda x: -x[1]['total']):
    wr = stats['wins']/stats['total']*100
    print(f'   {opp}')
    print(f"      总场: {stats['total']} | 胜: {stats['wins']} | 负: {stats['losses']} | 胜率: {wr:.1f}%")
    print()
