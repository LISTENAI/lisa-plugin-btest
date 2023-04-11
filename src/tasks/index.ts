import test from './test';
import project from './project';
import dm from './dm';
import list from './list';
import init from './init';
import exec from './exec';
import framework from "./framework";
import {LisaType} from "../utils/lisa_ex";

export default (core: LisaType) => {
  test();
  project();
  dm();
  list();
  init();
  exec();
  framework(core);
};
