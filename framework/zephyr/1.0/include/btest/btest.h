#ifndef _LISA_BTEST_H_
#define _LISA_BTEST_H_

#include <shell/shell.h>

#define BTEST_CMD(cmd, help, handler) SHELL_CMD(cmd, NULL, help, handler)
#define BTEST_CMD_END SHELL_SUBCMD_SET_END

#define BTEST_MODULE(module, cmds...)                      \
	SHELL_STATIC_SUBCMD_SET_CREATE(test_##module, ##cmds); \
	SHELL_CMD_REGISTER(test_##module, &test_##module, "Test commands for " #module, NULL);

#define BTEST_RETURN(shell, ret)            \
	do {                                    \
		shell_print(shell, "DONE:%d", ret); \
		return ret;                         \
	} while (0);

#endif  // _LISA_BTEST_H_
