// Anonymous voting on Aleo.
//
// - Proposals and tallies are PUBLIC (anyone can read the mappings).
// - Each Ticket is a private record owned by the voter.
// - Two-layer double-vote prevention:
//     1. `claimed` mapping keyed by BHP256((voter, pid)) — one ticket per (address, proposal).
//     2. snarkVM record serial numbers — a single Ticket record can be spent at most once.
//
// `title` and `content` are `field` (numeric). The frontend maintains an off-chain
// registry mapping these IDs to human-readable strings.

struct ProposalInfo {
    title: field,
    content: field,
    proposer: address,
}

program vote.aleo {
    record Proposal {
        owner: address,
        id: field,
        info: ProposalInfo,
    }

    record Ticket {
        owner: address,
        pid: field,
    }

    mapping proposals:      field => ProposalInfo;
    mapping tickets:        field => u64;
    mapping agree_votes:    field => u64;
    mapping disagree_votes: field => u64;
    mapping claimed:        field => bool;

    @noupgrade
    constructor() {}

    // pid is the title field directly (demo simplification: trivializes off-chain pid lookup).
    // Tradeoff: two proposals with the same title collide; the second propose() overwrites the
    // first's mapping entries. Acceptable since proposals are hardcoded in the off-chain registry.
    fn propose(public info: ProposalInfo) -> (Proposal, Final) {
        assert_eq(self.caller, info.proposer);
        let id: field = info.title;
        return (Proposal { owner: self.caller, id, info }, final {
            proposals.set(id, info);
            tickets.set(id, 0u64);
        });
    }

    fn new_ticket(public pid: field) -> (Ticket, Final) {
        let voter: address = self.caller;
        return (Ticket { owner: voter, pid }, final {
            let key: field = BHP256::hash_to_field((voter, pid));
            let already: bool = claimed.get_or_use(key, false);
            assert(already.not());
            claimed.set(key, true);
            let cur: u64 = tickets.get_or_use(pid, 0u64);
            tickets.set(pid, cur + 1u64);
        });
    }

    fn agree(ticket: Ticket) -> Final {
        let pid: field = ticket.pid;
        return final {
            let cur: u64 = agree_votes.get_or_use(pid, 0u64);
            agree_votes.set(pid, cur + 1u64);
        };
    }

    fn disagree(ticket: Ticket) -> Final {
        let pid: field = ticket.pid;
        return final {
            let cur: u64 = disagree_votes.get_or_use(pid, 0u64);
            disagree_votes.set(pid, cur + 1u64);
        };
    }
}
