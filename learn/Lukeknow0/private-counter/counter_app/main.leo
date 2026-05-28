// The `counter_app.aleo` program.
program counter_app.aleo {
    // A private counter record - only the owner can see the value
    record Counter {
        owner: address,
        value: u32,
    }

    // Transition 1: Create a new counter with initial value 0
    transition mint -> Counter {
        return Counter {
            owner: self.caller,
            value: 0u32,
        };
    }

    // Transition 2: Increment the counter by 1 (private operation)
    transition increment(counter: Counter) -> Counter {
        // Check that the caller owns the counter
        assert_eq(counter.owner, self.caller);
        
        // Increment the value
        let new_value: u32 = counter.value + 1u32;
        
        // Return a new counter record with the incremented value
        return Counter {
            owner: self.caller,
            value: new_value,
        };
    }

    // Transition 3: Get the current value (reveals the value - use carefully!)
    transition get_value(counter: Counter) -> u32 {
        assert_eq(counter.owner, self.caller);
        return counter.value;
    }
}
