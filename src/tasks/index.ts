import { LisaType } from '../utils/lisa_ex';

import test from './test';
import project from './project';
import dm from './dm';
import list from './list';
import init from './init';
import exec from './exec';

export default () => {
  test();
  project();
  dm();
  list();
  init();
  exec();
};
