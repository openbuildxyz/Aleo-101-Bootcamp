import os
import re


def count_task1_folders(base_dir='./learn'):
    """统计 learn 下各子文件夹中包含 task1 文件（task1.md 或 task1 目录）的个数"""
    count = 0
    for folder_name in os.listdir(base_dir):
        folder_path = os.path.join(base_dir, folder_name)
        if not os.path.isdir(folder_path):
            continue
        task1_file = os.path.join(folder_path, 'task1.md')
        task1_dir = os.path.join(folder_path, 'task1')
        if os.path.exists(task1_file) or os.path.isdir(task1_dir):
            count += 1
    return count


def main():
    base_dir = './learn'  
    result = []

    wallet_pattern = re.compile(r'0x[a-fA-F0-9]{40}')

    for folder_name in os.listdir(base_dir):
        folder_path = os.path.join(base_dir, folder_name)
        if not os.path.isdir(folder_path):
            continue

        # 查找与文件夹同名（忽略大小写）的 .md 文件
        md_file = None
        for f in os.listdir(folder_path):
            if f.lower() == f"{folder_name.lower()}.md":
                md_file = f
                break

        if not md_file:
            continue

        md_path = os.path.join(folder_path, md_file)
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(wallet_pattern, content)
            if not match:
                continue
            wallet_address = match.group(0)

          # 检查是否完成 taskx（文件或文件夹）
        task1_path_file = os.path.join(folder_path, 'task1.md')
        task1_path_dir = os.path.join(folder_path, 'task1')

        if os.path.exists(task1_path_file) or os.path.isdir(task1_path_dir):
            result.append((folder_name, wallet_address, md_file))


    # 按用户名排序
    result.sort(key=lambda x: x[0].lower())

    print("\n以下是完成 task1 的用户信息（按用户名排序）：\n")
    for username, address, md_file in result:
        print(f"用户名: {username}, 钱包地址: {address}, 来源文件: {md_file}")

if __name__ == '__main__':
    main()

