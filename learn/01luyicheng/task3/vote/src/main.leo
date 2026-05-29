// Simple vote program for Aleo Bootcamp
// Note: This is a simplified version for demonstration

program privatevotedapp123.aleo {
    // Simple record for tracking votes
    record VoteRecord {
        owner: address,
        proposal_id: field,
        vote_value: bool,  // true = agree, false = disagree
    }

    // Constructor - required for programs deployed after ConsensusVersion::V9
    // @noupgrade means this program cannot be upgraded after deployment
    @noupgrade
    constructor() {}

    // Create a new vote record
    // transition is the entrypoint for creating records on Aleo
    transition create_vote(public proposal_id: field, public vote_value: bool) -> VoteRecord {
        return VoteRecord {
            owner: self.caller,
            proposal_id,
            vote_value,
        };
    }
}
