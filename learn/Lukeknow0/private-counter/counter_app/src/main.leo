// The `counter_v2.aleo` program.
program counter_v2.aleo {
    @noupgrade
    constructor() {}

    record Counter {
        owner: address,
        count: u32,
    }

    // Create a new counter with initial value 0
    fn mint(owner: address) -> Counter {
        return Counter {
            owner: owner,
            count: 0u32,
        };
    }

    // Increment the counter by 1
    fn increment(counter: Counter) -> Counter {
        assert_eq(counter.owner, self.caller);
        let new_count: u32 = counter.count + 1u32;
        return Counter {
            owner: self.caller,
            count: new_count,
        };
    }

    // Get the current count
    fn get_count(counter: Counter) -> u32 {
        assert_eq(counter.owner, self.caller);
        return counter.count;
    }
}
