#ifndef _LISA_BTEST_H_
#define _LISA_BTEST_H_

#define OK "succeed"
#define NG "fail"
#define error "error"
#include <shell/shell.h>
#include "btest.c"
/**
 * @brief 单个shell实现函数
 *
 * @return .
 */

#define BTEST_CMD(cmd, help, handler) SHELL_CMD(cmd, NULL, help, handler)

/**
 * @brief sehll 结束命令
 *
 * @return .
 */

#define BTEST_CMD_END SHELL_SUBCMD_SET_END

/**
 * @brief shell实现模块
 *
 * @return .
 */

#define BTEST_MODULE(module, cmds...)                      \
	SHELL_STATIC_SUBCMD_SET_CREATE(test_##module, ##cmds); \
	SHELL_CMD_REGISTER(test_##module, &test_##module, "Test commands for " #module, NULL);

/**
 * @brief shell日志输出
 *
 * @return .
 */

#define BTEST_RETURN(shell, ret)            \
	do {                                    \
		shell_print(shell, "DONE:%d", ret); \
		return ret;                         \
	} while (0);

/**
 * @brief 定义cmd结构体附值 在棧上使用
 *
 * @return .
 */

#define INPUT_STRUCT_INFO_STACK(CTX, STRUCT, NAME) \
	STRUCT NAME = { 0 };\
	CTX->struct_info = &NAME;

/**
 * @brief 定义cmd附值  在堆上使用
 *
 * @return .
 */

#define INPUT_STRUCT_INFO(CTX, STRUCT, NAME) \
        STRUCT *NAME = k_malloc(sizeof(STRUCT)); \
		memset(NAME, 0x00, sizeof(STRUCT));\
        CTX->struct_info = NAME;

/**
 * @brief 定义cmd结构体取值
 *
 * @return .
 */

#define OUTPUT_STRUCT_INFO(CTX, STRUCT, NAME) STRUCT *NAME = (STRUCT *)CTX->struct_info;

/**
 * @brief  定义一个CMD结构体信息
 *
 * @return .
 */
typedef struct {
	char *cmd_type;
	int cmd_ranked;
	void *struct_info;
} t_cmd_info;

/**
 * @brief  定义一个函数指针，用在命令解析回调
 *
 * @return .
 */

struct cmd_parse;
typedef void (*cmd_handler)(struct cmd_parse *cmd, t_cmd_info *p, char **argv);
typedef struct cmd_parse {
	char *cmd_type;
	int cmd_ranked;
	cmd_handler handler;
} t_cmd_parse;

/**
 * @brief  命令解析函数
 * @param t_cmd_info
 * @param p  命令信息
 * @param cmd_table[] 结构体数组
 * @param cmd_table_len[]   数组长度
 *
 * @return  返回CMD 命名排名
 */

int
cmd_arg_parse(char **argv, t_cmd_info *p, t_cmd_parse cmd_table[], int cmd_table_len)
{
	int number = 0;
	int type = 0;
	char *temp_type = argv[1];
	number = sizeof(cmd_table) / sizeof(cmd_table[0]);
	int i = 0;
	// number = ARRAY_SIZE(cmd_table);
	for (i = 0; i <= cmd_table_len; i++) {
		if (strcmp(temp_type, cmd_table[i].cmd_type) == 0) {
			p->cmd_type = cmd_table[i].cmd_type;
			p->cmd_ranked = cmd_table[i].cmd_ranked;
			type = cmd_table[i].cmd_ranked;
			if (cmd_table[i].handler) {
				cmd_table[i].handler(&cmd_table[i], p, argv);
			}
			break;
		}
	}
	return type;
}

 
/**
 * @brief  分隔字符串
 *
 * @param str 需要分割的字符串
 * @param ch  分隔符
 * @param args  
 * @param size   长度
 * 
 */

void split(char* str, const char* ch, char*** args, int* size);



#endif  // _LISA_BTEST_H_