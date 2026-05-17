import json
import sys

with open('sim_v9_nova_classic.json', 'r') as f:
    data = json.load(f)

result = data.get('result', {})
print('Simulation Result:')
print(f"  Winner: {result.get('winner')}")
print(f"  Reason: {result.get('reason')}")
print(f"  Frames: {result.get('frames')}")

# Check who won
winner = result.get('winner', '')
print(f"\nWinner tank: {winner}")
if winner == '陆奕丞':
    print("✓ WE WON!")
else:
    print("✗ We lost")
