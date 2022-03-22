#include <btest/btest.h>
#include <drivers/gpio.h>
#include <drivers/pinmux.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <zephyr.h>

static int
cmd_gpio_set(const struct shell *shell, size_t argc, char **argv)
{
	if (argc != 4) {
		shell_print(shell, "Usage: set [a|b] [bitmask] [bitval]");
		BTEST_RETURN(shell, -1);
	}

	const struct device *pinmux;
	const struct device *gpio;
	if (strcmp(argv[1], "a") == 0) {
		pinmux = DEVICE_DT_GET(DT_NODELABEL(pinmuxa));
		gpio = DEVICE_DT_GET(DT_NODELABEL(gpioa));
	} else if (strcmp(argv[1], "b") == 0) {
		pinmux = DEVICE_DT_GET(DT_NODELABEL(pinmuxb));
		gpio = DEVICE_DT_GET(DT_NODELABEL(gpiob));
	} else {
		shell_print(shell, "Error: unsupported GPIO pad: %s", argv[1]);
		BTEST_RETURN(shell, -1);
	}

	int bitmask = atoi(argv[2]);
	int bitval = atoi(argv[3]);
	shell_print(shell, "Set gpio %s %04x %04x", argv[1], bitmask, bitval);

	for (int i = 0; i < 32; i++) {
		if (bitmask & (1 << i)) {
			pinmux_pin_set(pinmux, i, PINMUX_FUNC_A);
			gpio_pin_configure(gpio, i, GPIO_OUTPUT);
		}
	}
	gpio_port_set_masked_raw(gpio, bitmask, bitval);

	BTEST_RETURN(shell, 0);
}

static int
cmd_gpio_get(const struct shell *shell, size_t argc, char **argv)
{
	if (argc != 3) {
		shell_print(shell, "Usage: get [a|b] [bitmask]");
		BTEST_RETURN(shell, -1);
	}

	const struct device *pinmux;
	const struct device *gpio;
	if (strcmp(argv[1], "a") == 0) {
		pinmux = DEVICE_DT_GET(DT_NODELABEL(pinmuxa));
		gpio = DEVICE_DT_GET(DT_NODELABEL(gpioa));
	} else if (strcmp(argv[1], "b") == 0) {
		pinmux = DEVICE_DT_GET(DT_NODELABEL(pinmuxb));
		gpio = DEVICE_DT_GET(DT_NODELABEL(gpiob));
	} else {
		shell_print(shell, "Error: unsupported GPIO pad: %s", argv[1]);
		BTEST_RETURN(shell, -1);
	}

	int bitmask = atoi(argv[2]);
	shell_print(shell, "Get gpio %s %04x", argv[1], bitmask);

	for (int i = 0; i < 32; i++) {
		if (bitmask & (1 << i)) {
			pinmux_pin_set(pinmux, i, PINMUX_FUNC_A);
			gpio_pin_configure(gpio, i, GPIO_INPUT);
		}
	}

	gpio_port_value_t bitval = 0;
	gpio_port_get_raw(gpio, &bitval);

	BTEST_RETURN(shell, bitval & bitmask);
}

BTEST_MODULE(gpio,  //
	BTEST_CMD(set, "Set GPIO", cmd_gpio_set),  //
	BTEST_CMD(get, "Get GPIO", cmd_gpio_get),  //
	BTEST_CMD_END);
