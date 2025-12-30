import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';

const StackRemoveInputSchema = DockerBaseInputSchema.extend({
  stack_name: z.string().min(1),
});

type StackRemoveParams = z.infer<typeof StackRemoveInputSchema>;

const StackRemoveOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  error: z.string().optional(),
});

type StackRemoveResult = z.infer<typeof StackRemoveOutputSchema>;

async function run(context: TaskContext<StackRemoveParams>): Promise<StackRemoveResult> {
  return await runDocker(context, context.params, ['stack', 'rm', context.params.stack_name]);
}

export default task(run, {
  description: 'Removes a Docker Swarm stack.',
  inputSchema: StackRemoveInputSchema,
  outputSchema: StackRemoveOutputSchema,
});
