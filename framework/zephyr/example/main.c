#include <btest/btest.h>
#include <stdio.h>
#include <stdlib.h>

void
main(void)
{
	printk("SYSTEM READY\n");
}

static int
cmd_foo_bar(const struct shell *shell, size_t argc, char **argv)
{
	shell_print(shell, "argc: %d", argc);
	BTEST_RETURN(shell, 0);
}

BTEST_MODULE(foo,  //
	BTEST_CMD(bar, "FOO", cmd_foo_bar),  //
	BTEST_CMD_END);
