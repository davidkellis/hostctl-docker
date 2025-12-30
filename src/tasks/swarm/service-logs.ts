import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { BooleanishSchema, NumberishSchema } from '../../lib/schemas.js';

const ServiceLogsInputSchema = DockerBaseInputSchema.extend({
  service: z.string().min(1),
  follow: BooleanishSchema.optional(),
  tail: NumberishSchema.optional(),
  since: z.string().optional(),
  timestamps: BooleanishSchema.optional(),
  details: BooleanishSchema.optional(),
  raw: BooleanishSchema.optional(),
});

type ServiceLogsParams = z.infer<typeof ServiceLogsInputSchema>;

const ServiceLogsOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  error: z.string().optional(),
});

type ServiceLogsResult = z.infer<typeof ServiceLogsOutputSchema>;

async function run(context: TaskContext<ServiceLogsParams>): Promise<ServiceLogsResult> {
  const args = ['service', 'logs'];
  if (context.params.follow) {
    args.push('--follow');
  }
  if (context.params.timestamps) {
    args.push('--timestamps');
  }
  if (context.params.details) {
    args.push('--details');
  }
  if (context.params.raw) {
    args.push('--raw');
  }
  if (context.params.since) {
    args.push('--since', context.params.since);
  }
  if (typeof context.params.tail === 'number') {
    args.push('--tail', String(context.params.tail));
  }
  args.push(context.params.service);

  return await runDocker(context, context.params, args);
}

export default task(run, {
  description: 'Fetches logs for a Docker Swarm service.',
  inputSchema: ServiceLogsInputSchema,
  outputSchema: ServiceLogsOutputSchema,
});
