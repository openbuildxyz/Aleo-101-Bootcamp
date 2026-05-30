// Off-chain registry of proposal titles.
//
// `field` in Leo can't hold strings — the on-chain `ProposalInfo.title` / `content` are
// numeric field IDs. This registry maps those IDs to human-readable display strings.
//
// Since the contract uses `id = info.title` directly (see contracts/vote/src/main.leo),
// the `title` value here is ALSO the pid that mapping queries and `new_ticket` take.

export interface ProposalEntry {
  /** title field id used on-chain. Also serves as the pid for all mapping lookups. */
  title: string; // e.g. "1field"
  /** content field id on-chain. Decorative — only used to round out the ProposalInfo struct. */
  content: string;
  displayTitle: string;
  displayContent: string;
}

export const PROPOSALS: ProposalEntry[] = [
  {
    title: "1field",
    content: "1001field",
    displayTitle: "Move the office to Lisbon",
    displayContent: "Relocate HQ to Lisbon for tax + lifestyle reasons.",
  },
  {
    title: "2field",
    content: "1002field",
    displayTitle: "Adopt a four-day workweek",
    displayContent: "Drop Friday — same pay, same output targets.",
  },
  {
    title: "3field",
    content: "1003field",
    displayTitle: "Open-source the demo SDK",
    displayContent: "Push the internal SDK to GitHub under MIT.",
  },
];
