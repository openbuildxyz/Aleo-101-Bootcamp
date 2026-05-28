// The 'test_counter_app' test program.
import counter_app.aleo;
program test_counter_app.aleo {
    @test
    @should_fail
    fn test_main_fails() {
        let result: u32 = counter_app.aleo::main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    constructor() {}
}
