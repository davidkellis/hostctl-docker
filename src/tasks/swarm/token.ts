import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { BooleanishSchema } from '../../lib/schemas.js';

const SwarmTokenInputSchema = DockerBaseInputSchema.extend({
  role: z.enum(['worker', 'manager']),
  rotate: BooleanishSchema.optional(),
});

type SwarmTokenParams = z.infer<typeof SwarmTokenInputSchema>;

const SwarmTokenOutputSchema = z.object({
  success: z.boolean(),
  token: z.string().optional(),
  exitCode: z.number().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  error: z.string().optional(),
});

type SwarmTokenResult = z.infer<typeof SwarmTokenOutputSchema>;

async function run(context: TaskContext<SwarmTokenParams>): Promise<SwarmTokenResult> {
  const args = ['swarm', 'join-token'];
  if (context.params.rotate) {
    args.push('--rotate');
  }
  args.push('-q', context.params.role);

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

  const token = result.stdout.trim();
  return {
    success: true,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    token: token || undefined,
  };
}

export default task(run, {
  description: 'Fetches or rotates Docker Swarm join tokens.',
  inputSchema: SwarmTokenInputSchema,
  outputSchema: SwarmTokenOutputSchema,
});
