import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { cleanupFile, ensureFileFromContent, stackTempDir } from '../../lib/files.js';
import { BooleanishSchema } from '../../lib/schemas.js';

const StackDeployInputSchema = DockerBaseInputSchema.extend({
  stack_name: z.string().min(1),
  compose_path: z.string().optional(),
  compose_content: z.string().optional(),
  with_registry_auth: BooleanishSchema.optional(),
  prune: BooleanishSchema.optional(),
  resolve_image: z.enum(['always', 'changed', 'never']).optional(),
  cleanup: BooleanishSchema.optional(),
});

type StackDeployParams = z.infer<typeof StackDeployInputSchema>;

const StackDeployOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  composePath: z.string(),
  error: z.string().optional(),
});

type StackDeployResult = z.infer<typeof StackDeployOutputSchema>;

async function run(context: TaskContext<StackDeployParams>): Promise<StackDeployResult> {
  const { params } = context;
  if (!params.compose_path && !params.compose_content) {
    return {
      success: false,
      exitCode: -1,
      stdout: '',
      stderr: '',
      composePath: '',
      error: 'compose_path or compose_content is required.',
    };
  }

  const baseDir = stackTempDir(params.stack_name, context.id);
  const composePath = params.compose_path ?? `${baseDir}/docker-compose.yml`;
  const composeFile = await ensureFileFromContent(context, {
    path: composePath,
    content: params.compose_content,
    defaultDir: baseDir,
    defaultName: 'docker-compose.yml',
    mode: 0o600,
    sudo: params.sudo,
  });

  const args = ['stack', 'deploy', '-c', composePath];
  if (params.with_registry_auth) {
    args.push('--with-registry-auth');
  }
  if (params.prune) {
    args.push('--prune');
  }
  if (params.resolve_image) {
    args.push('--resolve-image', params.resolve_image);
  }
  args.push(params.stack_name);

  const result = await runDocker(context, params, args);
  await cleanupFile(context, composeFile, params.cleanup ?? false);

  return {
    ...result,
    composePath,
  };
}

export default task(run, {
  description: 'Deploys a Docker Swarm stack using docker stack deploy.',
  inputSchema: StackDeployInputSchema,
  outputSchema: StackDeployOutputSchema,
});
