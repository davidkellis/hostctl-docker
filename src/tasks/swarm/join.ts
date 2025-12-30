import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { getSwarmState } from '../../lib/swarm.js';
import { BooleanishSchema, NumberishSchema } from '../../lib/schemas.js';

const SwarmJoinInputSchema = DockerBaseInputSchema.extend({
  manager_addr: z.string().min(1),
  token: z.string().min(1),
  advertise_addr: z.string().optional(),
  listen_addr: z.string().optional(),
  data_path_addr: z.string().optional(),
  data_path_port: NumberishSchema.optional(),
  force: BooleanishSchema.optional(),
});

type SwarmJoinParams = z.infer<typeof SwarmJoinInputSchema>;

const SwarmJoinOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  alreadyActive: z.boolean().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

type SwarmJoinResult = z.infer<typeof SwarmJoinOutputSchema>;

async function run(context: TaskContext<SwarmJoinParams>): Promise<SwarmJoinResult> {
  const state = await getSwarmState(context, context.params);
  if (!state.success) {
    return { success: false, error: state.error };
  }
  if (state.state === 'active' && !context.params.force) {
    return { success: true, alreadyActive: true, state: state.state };
  }

  const args = ['swarm', 'join', '--token', context.params.token];
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

  args.push(context.params.manager_addr);

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
    state: 'active',
  };
}

export default task(run, {
  description: 'Joins a Docker Swarm cluster as a worker or manager.',
  inputSchema: SwarmJoinInputSchema,
  outputSchema: SwarmJoinOutputSchema,
});
