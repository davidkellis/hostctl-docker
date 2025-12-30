import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { cleanupComposeFiles, prepareComposeFiles } from '../../lib/compose.js';
import { BooleanishSchema, NumberishSchema } from '../../lib/schemas.js';

const ComposeDownInputSchema = DockerBaseInputSchema.extend({
  compose_path: z.string().optional(),
  compose_content: z.string().optional(),
  env_path: z.string().optional(),
  env_content: z.string().optional(),
  project: z.string().optional(),
  remove_orphans: BooleanishSchema.optional(),
  volumes: BooleanishSchema.optional(),
  timeout_seconds: NumberishSchema.optional(),
  cleanup: BooleanishSchema.optional(),
});

type ComposeDownParams = z.infer<typeof ComposeDownInputSchema>;

const ComposeDownOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  composePath: z.string(),
  envPath: z.string().optional(),
  error: z.string().optional(),
});

type ComposeDownResult = z.infer<typeof ComposeDownOutputSchema>;

async function run(context: TaskContext<ComposeDownParams>): Promise<ComposeDownResult> {
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

  args.push('down');

  if (params.remove_orphans) {
    args.push('--remove-orphans');
  }
  if (params.volumes) {
    args.push('--volumes');
  }
  if (typeof params.timeout_seconds === 'number') {
    args.push('--timeout', String(params.timeout_seconds));
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
  description: 'Takes down a Docker Compose stack using docker compose down.',
  inputSchema: ComposeDownInputSchema,
  outputSchema: ComposeDownOutputSchema,
});
