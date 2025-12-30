import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { getJoinToken, getSwarmState } from '../../lib/swarm.js';
import { BooleanishSchema, NumberishSchema } from '../../lib/schemas.js';

const SwarmInitInputSchema = DockerBaseInputSchema.extend({
  advertise_addr: z.string().optional(),
  listen_addr: z.string().optional(),
  data_path_addr: z.string().optional(),
  data_path_port: NumberishSchema.optional(),
  autolock: BooleanishSchema.optional(),
  force_new_cluster: BooleanishSchema.optional(),
});

type SwarmInitParams = z.infer<typeof SwarmInitInputSchema>;

const SwarmInitOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  alreadyActive: z.boolean().optional(),
  state: z.string().optional(),
  managerToken: z.string().optional(),
  workerToken: z.string().optional(),
  error: z.string().optional(),
});

type SwarmInitResult = z.infer<typeof SwarmInitOutputSchema>;

async function run(context: TaskContext<SwarmInitParams>): Promise<SwarmInitResult> {
  const state = await getSwarmState(context, context.params);
  if (!state.success) {
    return { success: false, error: state.error };
  }
  if (state.state === 'active' && !context.params.force_new_cluster) {
    return {
      success: true,
      alreadyActive: true,
      state: state.state,
    };
  }

  const args = ['swarm', 'init'];
  if (context.params.advertise_addr) {
    args.push('--advertise-addr', context.params.advertise_addr);
  }
  if (context.params.listen_addr) {
    args.push('--listen-addr', context.params.listen_addr);
  }
  if (context.params.data_path_addr) {
    args.push('--data-path-addr', context.params.data_path_addr);
  }
  if (typeof context.params.data_path_port === 'number') {
    args.push('--data-path-port', String(context.params.data_path_port));
  }
  if (context.params.autolock) {
    args.push('--autolock');
  }
  if (context.params.force_new_cluster) {
    args.push('--force-new-cluster');
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

  const managerTokenResult = await getJoinToken(context, context.params, 'manager');
  const workerTokenResult = await getJoinToken(context, context.params, 'worker');

  return {
    success: true,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    state: 'active',
    managerToken: managerTokenResult.token,
    workerToken: workerTokenResult.token,
  };
}

export default task(run, {
  description: 'Initializes a Docker Swarm manager and returns join tokens.',
  inputSchema: SwarmInitInputSchema,
  outputSchema: SwarmInitOutputSchema,
});
