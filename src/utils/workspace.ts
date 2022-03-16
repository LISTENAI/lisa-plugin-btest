import LISA from '@listenai/lisa_core';
import { ParsedArgs } from 'minimist';
import { resolve } from 'path';

export default function workspace(): string {
  const { application } = LISA;
  const argv = application.argv as ParsedArgs;
  return argv._[1] ? resolve(argv._[1]) : process.cwd();
}
