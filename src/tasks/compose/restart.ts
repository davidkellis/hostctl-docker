import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { cleanupComposeFiles, prepareComposeFiles } from '../../lib/compose.js';
import { NumberishSchema, StringArraySchema, BooleanishSchema } from '../../lib/schemas.js';

const ComposeRestartInputSchema = DockerBaseInputSchema.extend({
  compose_path: z.string().optional(),
  compose_content: z.string().optional(),
  env_path: z.string().optional(),
  env_content: z.string().optional(),
  project: z.string().optional(),
  services: StringArraySchema.optional(),
  timeout_seconds: NumberishSchema.optional(),
  cleanup: BooleanishSchema.optional(),
});

type ComposeRestartParams = z.infer<typeof ComposeRestartInputSchema>;

const ComposeRestartOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  composePath: z.string(),
  envPath: z.string().optional(),
  error: z.string().optional(),
});

type ComposeRestartResult = z.infer<typeof ComposeRestartOutputSchema>;

async function run(context: TaskContext<ComposeRestartParams>): Promise<ComposeRestartResult> {
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

  args.push('restart');

  if (typeof params.timeout_seconds === 'number') {
    args.push('--timeout', String(params.timeout_seconds));
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
  description: 'Restarts services for a Docker Compose stack.',
  inputSchema: ComposeRestartInputSchema,
  outputSchema: ComposeRestartOutputSchema,
});
