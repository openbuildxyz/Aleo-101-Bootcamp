program private_vote.aleo {
    struct Vote {
        candidate: address,
        timestamp: u64,
    }

    struct VoteState {
        votes: map address => u64,
        total_votes: u64,
    }

    record Ballot {
        owner: address,
        has_voted: bool,
        _nonce: u64,
    }

    transition init_vote_state(
        initial_candidates: [address; 3]
    ) -> VoteState {
        let mut state: VoteState = VoteState {
            votes: {},
            total_votes: 0u64,
        };

        for i: u8 in 0..3 {
            state.votes.set(initial_candidates[i], 0u64);
        }

        return state;
    }

    transition vote(
        mut ballot: Ballot,
        candidate: address,
        mut state: VoteState
    ) -> (Ballot, VoteState) {
        assert(ballot.has_voted == false, "Already voted");
        
        ballot.has_voted = true;
        
        let current_votes: u64 = state.votes.get(candidate).unwrap_or(0u64);
        state.votes.set(candidate, current_votes + 1u64);
        state.total_votes = state.total_votes + 1u64;

        return (ballot, state);
    }

    transition get_vote_count(
        state: VoteState,
        candidate: address
    ) -> u64 {
        return state.votes.get(candidate).unwrap_or(0u64);
    }
}