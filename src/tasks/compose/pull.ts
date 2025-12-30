import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { cleanupComposeFiles, prepareComposeFiles } from '../../lib/compose.js';
import { BooleanishSchema, StringArraySchema } from '../../lib/schemas.js';

const ComposePullInputSchema = DockerBaseInputSchema.extend({
  compose_path: z.string().optional(),
  compose_content: z.string().optional(),
  env_path: z.string().optional(),
  env_content: z.string().optional(),
  project: z.string().optional(),
  services: StringArraySchema.optional(),
  ignore_failures: BooleanishSchema.optional(),
  quiet: BooleanishSchema.optional(),
  cleanup: BooleanishSchema.optional(),
});

type ComposePullParams = z.infer<typeof ComposePullInputSchema>;

const ComposePullOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  composePath: z.string(),
  envPath: z.string().optional(),
  error: z.string().optional(),
});

type ComposePullResult = z.infer<typeof ComposePullOutputSchema>;

async function run(context: TaskContext<ComposePullParams>): Promise<ComposePullResult> {
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

  args.push('pull');

  if (params.ignore_failures) {
    args.push('--ignore-pull-failures');
  }
  if (params.quiet) {
    args.push('--quiet');
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
  description: 'Pulls images for a Docker Compose stack.',
  inputSchema: ComposePullInputSchema,
  outputSchema: ComposePullOutputSchema,
});
