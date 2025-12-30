import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { BooleanishSchema, StringArraySchema } from '../../lib/schemas.js';

const CleanupPruneInputSchema = DockerBaseInputSchema.extend({
  all: BooleanishSchema.optional(),
  volumes: BooleanishSchema.optional(),
  force: BooleanishSchema.optional(),
  filters: StringArraySchema.optional(),
});

type CleanupPruneParams = z.infer<typeof CleanupPruneInputSchema>;

const CleanupPruneOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  error: z.string().optional(),
});

type CleanupPruneResult = z.infer<typeof CleanupPruneOutputSchema>;

async function run(context: TaskContext<CleanupPruneParams>): Promise<CleanupPruneResult> {
  const { params } = context;
  const args = ['system', 'prune'];

  if (params.force ?? true) {
    args.push('--force');
  }
  if (params.all) {
    args.push('--all');
  }
  if (params.volumes) {
    args.push('--volumes');
  }
  for (const filter of params.filters ?? []) {
    args.push('--filter', filter);
  }

  return await runDocker(context, params, args);
}

export default task(run, {
  description: 'Runs docker system prune with optional filters.',
  inputSchema: CleanupPruneInputSchema,
  outputSchema: CleanupPruneOutputSchema,
});
