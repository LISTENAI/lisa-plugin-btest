import LISA, { TaskObject } from '@listenai/lisa_core';

export type LisaType = typeof LISA;

export interface TaskObjectEx extends TaskObject {
  hideTitle?: boolean;
  before?: (ctx: any) => (TaskObject)[],
  after?: (ctx: any) => (TaskObject)[],
}

export function job(cmdName: string, task: TaskObjectEx): void {
  if (task.before || task.after) {
    const _task = task;
    task = {
      ...task,
      task: (ctx, task) => {
        let tasks: TaskObject[] = [];
        if (_task.before) {
          tasks = [...tasks, ..._task.before(ctx)];
        }
        tasks.push({ ..._task, title: undefined });
        if (_task.after) {
          tasks = [...tasks, ..._task.after(ctx)];
        }
        return task.newListr(tasks);
      },
    };
  }

  if (task.hideTitle) {
    const _task = task.task;
    task.task = (ctx, task) => {
      task.title = '';
      return _task(ctx, task);
    };
  }

  LISA.job(cmdName, task);
}
