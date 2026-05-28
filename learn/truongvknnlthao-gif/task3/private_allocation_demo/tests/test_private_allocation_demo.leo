import private_allocation_demo.aleo;

program test_private_allocation_demo.aleo {
    @test
    fn test_create_valid_allocation() {
        let owner: address = aleo1gddjky60sr43w3mts7zqpjztekylkhzgtfaua8ys870h7x75hsrqgvkrnk;
        let allocation = private_allocation_demo.aleo::create_allocation(owner, 4u8, 3u8, 3u8);
        assert_eq(allocation.scout, 4u8);
        assert_eq(allocation.shield, 3u8);
        assert_eq(allocation.research, 3u8);
    }

    @test
    fn test_reveal_single_lane() {
        let owner: address = aleo1gddjky60sr43w3mts7zqpjztekylkhzgtfaua8ys870h7x75hsrqgvkrnk;
        let allocation = private_allocation_demo.aleo::create_allocation(owner, 4u8, 3u8, 3u8);
        let revealed: u8 = private_allocation_demo.aleo::reveal_lane(allocation, 1u8);
        assert_eq(revealed, 4u8);
    }

    @test
    @should_fail
    fn test_over_budget_fails() {
        let owner: address = aleo1gddjky60sr43w3mts7zqpjztekylkhzgtfaua8ys870h7x75hsrqgvkrnk;
        private_allocation_demo.aleo::create_allocation(owner, 8u8, 3u8, 2u8);
    }

    @noupgrade
    constructor() {}
}
