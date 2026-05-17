import json
from collections import Counter, defaultdict

# v12 code hash
V12_HASH = "349923f8fddf7851f7f4d383e0c7ad12cb31c99ce0570ae1d21d97e0987392ff"

# v11 stats for comparison
V11_STATS = {
    "wins": 21,
    "losses": 29,
    "crash": 29,
    "error": 6,
    "runTime": 5,
    "win_rate": 0.42
}

def main():
    with open("matches_latest.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"JSON文件中总对战记录数: {len(data)}")
    print()
    
    # 取最新50场
    matches = data[:50]
    
    print("=" * 70)
    print("v12 对战数据分析报告")
    print("=" * 70)
    print(f"分析的对战场数: {len(matches)} (最新50场)")
    print()
    
    # 先看看这50场中所有唯一的codeHash
    all_hashes = set()
    hash_names = {}
    for m in matches:
        ch = m.get("challengerCodeHash")
        dh = m.get("defenderCodeHash")
        all_hashes.add(ch)
        all_hashes.add(dh)
        if ch not in hash_names:
            hash_names[ch] = f"{m.get('challengerTankName')} ({m.get('challengerSubmittedBy')})"
        if dh not in hash_names:
            hash_names[dh] = f"{m.get('defenderTankName')} ({m.get('defenderSubmittedBy')})"
    
    print("-" * 70)
    print("所有参与的对战代码哈希 (最新50场中):")
    print("-" * 70)
    for h in sorted(all_hashes):
        marker = " <-- v12" if h == V12_HASH else ""
        print(f"  {h[:16]}... {hash_names.get(h, 'Unknown')}{marker}")
    print()
    
    # 1. 统计v12参与的场数
    v12_matches = []
    for m in matches:
        is_v12 = (m.get("challengerCodeHash") == V12_HASH or 
                  m.get("defenderCodeHash") == V12_HASH)
        if is_v12:
            v12_matches.append(m)
    
    print("-" * 70)
    print("1. v12 参与场数统计")
    print("-" * 70)
    print(f"v12 参与的对战场数: {len(v12_matches)} / {len(matches)}")
    print(f"v12 参与比例: {len(v12_matches)/len(matches)*100:.1f}%")
    print()
    
    # 2. v12胜负情况
    v12_wins = 0
    v12_losses = 0
    v12_crashes = 0
    v12_errors = 0
    v12_runtimes = 0
    
    opponent_stats = defaultdict(lambda: {"wins": 0, "losses": 0, "total": 0})
    result_reasons = Counter()
    
    for m in v12_matches:
        result_reason = m.get("resultReason", "unknown")
        result_reasons[result_reason] += 1
        
        # 判断v12是challenger还是defender
        is_v12_challenger = m.get("challengerCodeHash") == V12_HASH
        is_v12_defender = m.get("defenderCodeHash") == V12_HASH
        
        winner_tank_id = m.get("winnerTankId")
        v12_tank_id = m.get("challengerTankId") if is_v12_challenger else m.get("defenderTankId")
        
        # 对手信息
        if is_v12_challenger:
            opponent_hash = m.get("defenderCodeHash", "unknown")
            opponent_name = m.get("defenderTankName", "Unknown")
            opponent_submitter = m.get("defenderSubmittedBy", "Unknown")
        else:
            opponent_hash = m.get("challengerCodeHash", "unknown")
            opponent_name = m.get("challengerTankName", "Unknown")
            opponent_submitter = m.get("challengerSubmittedBy", "Unknown")
        
        opponent_key = f"{opponent_name} ({opponent_submitter})"
        
        if winner_tank_id == v12_tank_id:
            v12_wins += 1
            opponent_stats[opponent_key]["losses"] += 1  # 对手输
            opponent_stats[opponent_key]["total"] += 1
        else:
            v12_losses += 1
            opponent_stats[opponent_key]["wins"] += 1  # 对手赢
            opponent_stats[opponent_key]["total"] += 1
        
        # 统计crash/error/runTime (v12输掉的情况)
        if result_reason == "crashed":
            if winner_tank_id != v12_tank_id:
                v12_crashes += 1
        elif result_reason == "error":
            if winner_tank_id != v12_tank_id:
                v12_errors += 1
        elif result_reason == "runTime":
            if winner_tank_id != v12_tank_id:
                v12_runtimes += 1
    
    print("-" * 70)
    print("2. v12 胜负情况")
    print("-" * 70)
    print(f"胜场: {v12_wins}")
    print(f"负场: {v12_losses}")
    print(f"胜率: {v12_wins/(v12_wins+v12_losses)*100:.1f}%" if (v12_wins+v12_losses) > 0 else "胜率: N/A")
    print()
    
    print("-" * 70)
    print("3. v12 异常结束统计")
    print("-" * 70)
    print(f"crash (v12输掉且原因crashed): {v12_crashes}")
    print(f"error (v12输掉且原因error): {v12_errors}")
    print(f"runTime (v12输掉且原因runTime): {v12_runtimes}")
    print(f"异常总次数: {v12_crashes + v12_errors + v12_runtimes}")
    print()
    
    # 所有resultReason分布
    print("v12对战中结果原因分布:")
    for reason, count in result_reasons.most_common():
        print(f"  {reason}: {count}")
    print()
    
    print("-" * 70)
    print("4. v12 对手分布和胜率")
    print("-" * 70)
    print(f"{'对手':<35} {'场次':>6} {'v12胜':>8} {'v12负':>8} {'v12胜率':>10}")
    print("-" * 70)
    
    for opponent, stats in sorted(opponent_stats.items(), key=lambda x: -x[1]["total"]):
        win_rate = stats["losses"] / stats["total"] * 100  # v12的胜率
        print(f"{opponent:<35} {stats['total']:>6} {stats['losses']:>8} {stats['wins']:>8} {win_rate:>9.1f}%")
    print()
    
    print("-" * 70)
    print("5. v12 vs v11 对比")
    print("-" * 70)
    v12_total = v12_wins + v12_losses
    v12_win_rate = v12_wins / v12_total * 100 if v12_total > 0 else 0
    
    print(f"{'指标':<25} {'v11':>12} {'v12':>12} {'变化':>12}")
    print("-" * 70)
    print(f"{'胜场':<25} {V11_STATS['wins']:>12} {v12_wins:>12} {v12_wins - V11_STATS['wins']:>+12}")
    print(f"{'负场':<25} {V11_STATS['losses']:>12} {v12_losses:>12} {v12_losses - V11_STATS['losses']:>+12}")
    print(f"{'胜率':<25} {V11_STATS['win_rate']*100:>11.1f}% {v12_win_rate:>11.1f}% {v12_win_rate - V11_STATS['win_rate']*100:>+11.1f}%")
    print(f"{'crash':<25} {V11_STATS['crash']:>12} {v12_crashes:>12} {v12_crashes - V11_STATS['crash']:>+12}")
    print(f"{'error':<25} {V11_STATS['error']:>12} {v12_errors:>12} {v12_errors - V11_STATS['error']:>+12}")
    print(f"{'runTime':<25} {V11_STATS['runTime']:>12} {v12_runtimes:>12} {v12_runtimes - V11_STATS['runTime']:>+12}")
    print()
    
    print("=" * 70)
    print("总结")
    print("=" * 70)
    if v12_win_rate > V11_STATS["win_rate"] * 100:
        print(f"✓ 胜率提升: v12胜率 {v12_win_rate:.1f}% > v11胜率 {V11_STATS['win_rate']*100:.1f}%")
    else:
        print(f"✗ 胜率下降: v12胜率 {v12_win_rate:.1f}% < v11胜率 {V11_STATS['win_rate']*100:.1f}%")
    
    v12_abnormal = v12_crashes + v12_errors + v12_runtimes
    v11_abnormal = V11_STATS["crash"] + V11_STATS["error"] + V11_STATS["runTime"]
    if v12_abnormal < v11_abnormal:
        print(f"✓ 异常减少: v12异常 {v12_abnormal}次 < v11异常 {v11_abnormal}次")
    else:
        print(f"✗ 异常增加: v12异常 {v12_abnormal}次 > v11异常 {v11_abnormal}次")
    
    print()
    print("注意: v12目前只参与了5场对战，样本量较小，统计结果可能不具有代表性。")
    print("      建议等待更多对战数据后再做全面评估。")

if __name__ == "__main__":
    main()
