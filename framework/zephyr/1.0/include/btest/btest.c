
#include <stdio.h>
#include <stdlib.h>

void split(char* str, const char* ch, char*** args, int* size)
{
	int i = 0, word = 0, sum = 0;
	for (; str[i] != '\0'; i++)
	{
		if (str[i] == ch[0])
			word = 0;
		else if (word == 0)
		{
			word = 1;
			sum++;
		}
	}
	if (sum == 0)
		return;
	*size = sum;
	*args = (char**)k_malloc(sizeof(char*) * sum);
	char* s;
	s = (char*)strtok(str, ch);
	i = 0;
	while (s != NULL)
	{
		(*args)[i] = s;
		s = (char*)strtok(NULL, ch);
		i++;
	}
    k_free(*args);
}
