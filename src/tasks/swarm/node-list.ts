import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { BooleanishSchema } from '../../lib/schemas.js';

const NodeListInputSchema = DockerBaseInputSchema.extend({
  format: z.string().optional(),
  quiet: BooleanishSchema.optional(),
});

type NodeListParams = z.infer<typeof NodeListInputSchema>;

const NodeListOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  error: z.string().optional(),
});

type NodeListResult = z.infer<typeof NodeListOutputSchema>;

async function run(context: TaskContext<NodeListParams>): Promise<NodeListResult> {
  const args = ['node', 'ls'];
  if (context.params.quiet) {
    args.push('--quiet');
  }
  if (context.params.format) {
    args.push('--format', context.params.format);
  }
  return await runDocker(context, context.params, args);
}

export default task(run, {
  description: 'Lists nodes in a Docker Swarm cluster.',
  inputSchema: NodeListInputSchema,
  outputSchema: NodeListOutputSchema,
});
