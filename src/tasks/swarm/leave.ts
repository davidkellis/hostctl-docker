import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { getSwarmState } from '../../lib/swarm.js';
import { BooleanishSchema } from '../../lib/schemas.js';

const SwarmLeaveInputSchema = DockerBaseInputSchema.extend({
  force: BooleanishSchema.optional(),
});

type SwarmLeaveParams = z.infer<typeof SwarmLeaveInputSchema>;

const SwarmLeaveOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  alreadyInactive: z.boolean().optional(),
  error: z.string().optional(),
});

type SwarmLeaveResult = z.infer<typeof SwarmLeaveOutputSchema>;

async function run(context: TaskContext<SwarmLeaveParams>): Promise<SwarmLeaveResult> {
  const state = await getSwarmState(context, context.params);
  if (!state.success) {
    return { success: false, error: state.error };
  }
  if (state.state !== 'active') {
    return { success: true, alreadyInactive: true };
  }

  const args = ['swarm', 'leave'];
  if (context.params.force) {
    args.push('--force');
  }

  const result = await runDocker(context, context.params, args);
  if (!result.success) {
    return {
      success: false,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
    };
  }

  return {
    success: true,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export default task(run, {
  description: 'Leaves a Docker Swarm cluster.',
  inputSchema: SwarmLeaveInputSchema,
  outputSchema: SwarmLeaveOutputSchema,
});
