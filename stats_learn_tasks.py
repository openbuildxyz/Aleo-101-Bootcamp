#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path


TASK_FILE_RE = re.compile(r"^task([1-4])(?:\.[^/]+)?$", re.IGNORECASE)
TASK_DIR_RE = re.compile(r"^task([1-4])$", re.IGNORECASE)
ALEO_ADDRESS_RE = re.compile(r"\baleo1[0-9a-z]{20,}\b", re.IGNORECASE)


def normalize_value(value: str) -> str:
    value = value.strip()
    value = value.strip("*`")
    return value


def parse_labeled_value(text: str, label_patterns: list[str]) -> str:
    for raw_line in text.splitlines():
        line = raw_line.strip()
        line = re.sub(r"^[-*]\s*", "", line)
        for label_pattern in label_patterns:
            if re.match(fr"(?i)^{label_pattern}\s*[：:]", line):
                value = re.split(r"[：:]", line, maxsplit=1)[1]
                return normalize_value(value)
    return ""


def extract_aleo_wallet(text: str) -> str:
    match = ALEO_ADDRESS_RE.search(text)
    if match:
        return match.group(0)

    labeled = parse_labeled_value(
        text, [r"aleo\s*钱包地址", r"aleo\s*address", r"wallet\s*address"]
    )
    labeled_match = ALEO_ADDRESS_RE.search(labeled)
    if labeled_match:
        return labeled_match.group(0)
    return ""


def find_profile_md(folder: Path) -> Path | None:
    candidates: list[Path] = []
    for child in folder.iterdir():
        if not child.is_file() or child.suffix.lower() != ".md":
            continue
        if TASK_FILE_RE.match(child.name):
            continue
        candidates.append(child)

    if not candidates:
        return None

    expected_name = f"{folder.name.lower()}.md"
    for candidate in candidates:
        if candidate.name.lower() == expected_name:
            return candidate

    candidates.sort(key=lambda p: p.name.lower())
    return candidates[0]


def collect_task_status(folder: Path) -> dict[int, bool]:
    status = {1: False, 2: False, 3: False, 4: False}
    for path in folder.rglob("*"):
        if path.is_file():
            file_match = TASK_FILE_RE.match(path.name)
            if file_match:
                status[int(file_match.group(1))] = True
        elif path.is_dir():
            dir_match = TASK_DIR_RE.match(path.name)
            if dir_match:
                status[int(dir_match.group(1))] = True
    return status


def build_rows(learn_dir: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    folders = sorted([p for p in learn_dir.iterdir() if p.is_dir()], key=lambda p: p.name.lower())

    for folder in folders:
        task_status = collect_task_status(folder)
        profile_file = find_profile_md(folder)

        nickname = ""
        github = ""
        aleo_wallet = ""

        if profile_file is not None:
            content = profile_file.read_text(encoding="utf-8", errors="ignore")
            nickname = parse_labeled_value(content, [r"昵称", r"nickname", r"nick"])
            github = parse_labeled_value(
                content,
                [r"github\s*用户名", r"github\s*用户", r"github\s*username", r"github"],
            )
            aleo_wallet = extract_aleo_wallet(content)

        rows.append(
            {
                "folder": folder.name,
                "task1": "Y" if task_status[1] else "N",
                "task2": "Y" if task_status[2] else "N",
                "task3": "Y" if task_status[3] else "N",
                "task4": "Y" if task_status[4] else "N",
                "nickname": nickname or "未填写",
                "github": github or "未填写",
                "aleo_wallet": aleo_wallet or "未填写",
            }
        )

    return rows


def write_csv(rows: list[dict[str, str]], path: Path) -> None:
    fieldnames = ["folder", "task1", "task2", "task3", "task4", "nickname", "github", "aleo_wallet"]
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def write_markdown(rows: list[dict[str, str]], path: Path) -> None:
    task_counts = {
        "task1": sum(1 for r in rows if r["task1"] == "Y"),
        "task2": sum(1 for r in rows if r["task2"] == "Y"),
        "task3": sum(1 for r in rows if r["task3"] == "Y"),
        "task4": sum(1 for r in rows if r["task4"] == "Y"),
    }

    lines = [
        "# learn 目录提交统计",
        "",
        f"- 个人文件夹总数：{len(rows)}",
        f"- task1 已提交：{task_counts['task1']}",
        f"- task2 已提交：{task_counts['task2']}",
        f"- task3 已提交：{task_counts['task3']}",
        f"- task4 已提交：{task_counts['task4']}",
        "",
        "| 文件夹名 | task1 | task2 | task3 | task4 | 昵称 | GitHub 用户名 | Aleo 钱包地址 |",
        "|---|---|---|---|---|---|---|---|",
    ]

    for row in rows:
        lines.append(
            f"| {row['folder']} | {row['task1']} | {row['task2']} | {row['task3']} | {row['task4']} | "
            f"{row['nickname']} | {row['github']} | {row['aleo_wallet']} |"
        )

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="统计 learn 文件夹下个人任务提交情况及个人信息。"
    )
    parser.add_argument(
        "--learn-dir",
        default="learn",
        help="learn 目录路径（默认: learn）",
    )
    parser.add_argument(
        "--csv-out",
        default="learn_task_submission_report.csv",
        help="CSV 输出文件路径（默认: learn_task_submission_report.csv）",
    )
    parser.add_argument(
        "--md-out",
        default="learn_task_submission_report.md",
        help="Markdown 输出文件路径（默认: learn_task_submission_report.md）",
    )
    args = parser.parse_args()

    learn_dir = Path(args.learn_dir)
    if not learn_dir.exists() or not learn_dir.is_dir():
        raise SystemExit(f"未找到 learn 目录: {learn_dir}")

    rows = build_rows(learn_dir)
    write_csv(rows, Path(args.csv_out))
    write_markdown(rows, Path(args.md_out))

    print(f"已生成 CSV: {args.csv_out}")
    print(f"已生成 Markdown: {args.md_out}")
    print(f"个人文件夹总数: {len(rows)}")


if __name__ == "__main__":
    main()
