program privacy_vote.aleo;

// Mapping to store proposal vote counts (public on-chain data)
// key: proposal_id (u32)
// value: VotesData struct
mapping votes: u32 => VotesData;

// Struct to hold vote counts for a proposal
struct VotesData:
    yes as u32;
    no as u32;

// Record representing a private ballot
// Only the owner can see the contents
record Ballot:
    owner as address.private;
    proposal_id as u32.private;
    choice as u8.private; // 1 = yes, 0 = no

// Transition: Create a new proposal with zero votes
transition create_proposal:
    input r0 as u32.public;
    async create_proposal r0 into r1;
    output r1 as VotesData.future;

// Transition: Cast a private vote
// Creates a Ballot record for the voter (private)
// Updates the public vote count
transition vote:
    // Input: proposal_id
    input r0 as u32.public;
    // Input: choice (1 = yes, 0 = no)
    input r1 as u8.private;
    // Create a private ballot record for the voter
    let ballot: Ballot = Ballot {
        owner: self.caller,
        proposal_id: r0,
        choice: r1,
    };
    // Output the private ballot record
    output ballot as Ballot.record;
    // Update public vote count asynchronously
    async vote r0 r1 into r2;
    output r2 as VotesData.future;

// Transition: Get current vote results (public query)
transition get_results:
    input r0 as u32.public;
    async get_results r0 into r1;
    output r1 as VotesData.future;

// Async function: Create proposal in mapping
async function create_proposal:
    input r0 as u32.public;
    let data: VotesData = VotesData { yes: 0u32, no: 0u32 };
    Mapping::set("privacy_vote.aleo", "votes", r0, data);

// Async function: Update vote counts
async function vote:
    input r0 as u32.public;
    input r1 as u8.public;
    let current: VotesData = Mapping::get("privacy_vote.aleo", "votes", r0);
    let is_yes: u32 = r1 as u32;
    let is_no: u32 = (1u8 - r1) as u32;
    let new_yes: u32 = current.yes + is_yes;
    let new_no: u32 = current.no + is_no;
    let updated: VotesData = VotesData { yes: new_yes, no: new_no };
    Mapping::set("privacy_vote.aleo", "votes", r0, updated);

// Async function: Get results
async function get_results:
    input r0 as u32.public;
    return;
