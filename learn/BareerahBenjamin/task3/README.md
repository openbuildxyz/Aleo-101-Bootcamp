# vote.aleo

Anonymous voting program for the demo dApp.

## Develop in the Leo Playground

This workspace does not have the local Leo CLI installed. To work on this program:

1. Open https://play.leo-lang.org/
2. Create a new program named `vote`
3. Paste `src/main.leo` into the editor
4. Use the **Run** widget to exercise the transitions locally (no proofs, no network) — this is the fast iteration loop for catching syntax/type errors
5. When ready to deploy, use the Playground's **Deploy** widget against testnet (see deploy notes in the project plan)

After any edits in the Playground, copy the updated source back into `src/main.leo` so the repo stays the source of truth.

## What this program does

- Anyone can call `propose(info)` to register a proposal. They receive a `Proposal` record.
- Anyone can call `new_ticket(pid)` once per proposal — guarded by the `claimed` mapping keyed on `BHP256((caller, pid))`.
- The ticket holder calls `agree(ticket)` or `disagree(ticket)` to cast their private vote. The ticket record is consumed (snarkVM serial-number protection prevents reuse).

Public mappings: `proposals`, `tickets` (issued count), `agree_votes`, `disagree_votes`, `claimed`.

## Run examples (Playground)

```text
propose '{ title: 1field, content: 2field, proposer: aleo1<your-address> }'
new_ticket 1field        # hash_to_field(1field) is the proposal id
agree <ticket-record>
disagree <ticket-record>
```

The proposal id is `BHP256::hash_to_field(title)` — note that `title` is a `field`, not a string. The frontend keeps a registry mapping these numeric IDs to display titles.
