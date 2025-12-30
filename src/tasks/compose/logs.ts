import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { cleanupComposeFiles, prepareComposeFiles } from '../../lib/compose.js';
import { BooleanishSchema, NumberishSchema, StringArraySchema } from '../../lib/schemas.js';

const ComposeLogsInputSchema = DockerBaseInputSchema.extend({
  compose_path: z.string().optional(),
  compose_content: z.string().optional(),
  env_path: z.string().optional(),
  env_content: z.string().optional(),
  project: z.string().optional(),
  services: StringArraySchema.optional(),
  follow: BooleanishSchema.optional(),
  tail: NumberishSchema.optional(),
  since: z.string().optional(),
  timestamps: BooleanishSchema.optional(),
  cleanup: BooleanishSchema.optional(),
});

type ComposeLogsParams = z.infer<typeof ComposeLogsInputSchema>;

const ComposeLogsOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  composePath: z.string(),
  envPath: z.string().optional(),
  error: z.string().optional(),
});

type ComposeLogsResult = z.infer<typeof ComposeLogsOutputSchema>;

async function run(context: TaskContext<ComposeLogsParams>): Promise<ComposeLogsResult> {
  const { params } = context;
  const files = await prepareComposeFiles(context, {
    composePath: params.compose_path,
    composeContent: params.compose_content,
    envPath: params.env_path,
    envContent: params.env_content,
    project: params.project,
    sudo: params.sudo,
  });

  const args = ['compose', '-f', files.composePath];
  if (files.envPath) {
    args.push('--env-file', files.envPath);
  }
  if (params.project) {
    args.push('--project-name', params.project);
  }

  args.push('logs');

  if (params.follow) {
    args.push('--follow');
  }
  if (params.timestamps) {
    args.push('--timestamps');
  }
  if (params.since) {
    args.push('--since', params.since);
  }
  if (typeof params.tail === 'number') {
    args.push('--tail', String(params.tail));
  }
  if (params.services?.length) {
    args.push(...params.services);
  }

  const result = await runDocker(context, params, args);
  await cleanupComposeFiles(context, files, params.cleanup ?? false);

  return {
    ...result,
    composePath: files.composePath,
    envPath: files.envPath,
  };
}

export default task(run, {
  description: 'Fetches logs for a Docker Compose stack.',
  inputSchema: ComposeLogsInputSchema,
  outputSchema: ComposeLogsOutputSchema,
});
