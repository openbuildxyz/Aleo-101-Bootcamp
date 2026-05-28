// Private Allocation Proof
//
// This small demo is inspired by the ZKGames pattern of "public rules,
// hidden strategy", but it abstracts the idea into a reusable real-world
// primitive: prove that a private allocation satisfies public constraints
// without revealing the full allocation.
program private_allocation_demo.aleo {
    record Allocation {
        owner: address,
        scout: u8,
        shield: u8,
        research: u8,
    }

    @noupgrade
    constructor() {}

    // The UI presents this as a tiny strategy-game planner:
    // - scout, shield, research are private resource allocations.
    // - the public rule is that the total budget must be at most 10.
    // The same pattern maps to private budgeting, sealed bids, loan prechecks,
    // and supplier qualification.
    fn create_allocation(
        public owner: address,
        private scout: u8,
        private shield: u8,
        private research: u8,
    ) -> Allocation {
        let total: u8 = scout + shield + research;
        assert(total <= 10u8);

        return Allocation {
            owner: owner,
            scout: scout,
            shield: shield,
            research: research,
        };
    }

    // Reveal only one selected lane, not the full private allocation.
    // lane: 1 = scout, 2 = shield, 3 = research.
    fn reveal_lane(private allocation: Allocation, public lane: u8) -> u8 {
        assert(lane == 1u8 || lane == 2u8 || lane == 3u8);

        if lane == 1u8 {
            return allocation.scout;
        } else if lane == 2u8 {
            return allocation.shield;
        } else {
            return allocation.research;
        }
    }
}
