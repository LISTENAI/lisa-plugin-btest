import { job } from "../utils/lisa_ex";
import getEnv from "../utils/getEnv";
import extendExec from '../utils/extendExec';

export default () => {
  job("exec", {
    title: "exec",
    async task(ctx, task) {
      task.title = '';
      const execArgsIndex = process.argv.indexOf("exec");
      const execArgs = process.argv.slice(execArgsIndex + 1);
      const command = execArgs.shift();
      if (!command) return;

      try {
        const exec = extendExec({ task });
        await exec(command, execArgs, {
          stdio: "inherit",
          env: await getEnv()
        });
      } catch (error) {
        task.title = 'exec exit';
        throw new Error(`Command failed : ${command} ${execArgs.join(' ')}`)
      }

      task.title = 'exec exit';
    }
  });
};