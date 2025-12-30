import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { cleanupComposeFiles, prepareComposeFiles } from '../../lib/compose.js';
import { BooleanishSchema, NumberishSchema, StringArraySchema } from '../../lib/schemas.js';

const ComposeDeployInputSchema = DockerBaseInputSchema.extend({
  compose_path: z.string().optional(),
  compose_content: z.string().optional(),
  env_path: z.string().optional(),
  env_content: z.string().optional(),
  project: z.string().optional(),
  profiles: StringArraySchema.optional(),
  services: StringArraySchema.optional(),
  detach: BooleanishSchema.optional(),
  pull: z.enum(['always', 'missing', 'never']).optional(),
  build: BooleanishSchema.optional(),
  remove_orphans: BooleanishSchema.optional(),
  no_recreate: BooleanishSchema.optional(),
  force_recreate: BooleanishSchema.optional(),
  timeout_seconds: NumberishSchema.optional(),
  cleanup: BooleanishSchema.optional(),
});

type ComposeDeployParams = z.infer<typeof ComposeDeployInputSchema>;

const ComposeDeployOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  composePath: z.string(),
  envPath: z.string().optional(),
  error: z.string().optional(),
});

type ComposeDeployResult = z.infer<typeof ComposeDeployOutputSchema>;

async function run(context: TaskContext<ComposeDeployParams>): Promise<ComposeDeployResult> {
  const { params } = context;
  const { compose_path, compose_content, env_path, env_content, project } = params;

  const files = await prepareComposeFiles(context, {
    composePath: compose_path,
    composeContent: compose_content,
    envPath: env_path,
    envContent: env_content,
    project,
    sudo: params.sudo,
  });

  const args = ['compose', '-f', files.composePath];

  if (files.envPath) {
    args.push('--env-file', files.envPath);
  }
  if (project) {
    args.push('--project-name', project);
  }
  for (const profile of params.profiles ?? []) {
    args.push('--profile', profile);
  }

  args.push('up');

  if (params.detach ?? true) {
    args.push('-d');
  }
  if (params.pull) {
    args.push('--pull', params.pull);
  }
  if (params.build) {
    args.push('--build');
  }
  if (params.remove_orphans) {
    args.push('--remove-orphans');
  }
  if (params.no_recreate) {
    args.push('--no-recreate');
  }
  if (params.force_recreate) {
    args.push('--force-recreate');
  }
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
  description: 'Deploys or updates a Docker Compose stack using docker compose up.',
  inputSchema: ComposeDeployInputSchema,
  outputSchema: ComposeDeployOutputSchema,
});
