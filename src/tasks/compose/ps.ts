import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { cleanupComposeFiles, prepareComposeFiles } from '../../lib/compose.js';
import { BooleanishSchema } from '../../lib/schemas.js';

const ComposePsInputSchema = DockerBaseInputSchema.extend({
  compose_path: z.string().optional(),
  compose_content: z.string().optional(),
  env_path: z.string().optional(),
  env_content: z.string().optional(),
  project: z.string().optional(),
  format: z.string().optional(),
  all: BooleanishSchema.optional(),
  cleanup: BooleanishSchema.optional(),
});

type ComposePsParams = z.infer<typeof ComposePsInputSchema>;

const ComposePsOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  composePath: z.string(),
  envPath: z.string().optional(),
  error: z.string().optional(),
});

type ComposePsResult = z.infer<typeof ComposePsOutputSchema>;

async function run(context: TaskContext<ComposePsParams>): Promise<ComposePsResult> {
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

  args.push('ps');

  if (params.all) {
    args.push('--all');
  }
  if (params.format) {
    args.push('--format', params.format);
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
  description: 'Lists containers in a Docker Compose stack.',
  inputSchema: ComposePsInputSchema,
  outputSchema: ComposePsOutputSchema,
});
