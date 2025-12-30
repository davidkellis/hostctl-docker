import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { BooleanishSchema, NumberishSchema, StringArraySchema } from '../../lib/schemas.js';

const ServiceUpdateInputSchema = DockerBaseInputSchema.extend({
  service: z.string().min(1),
  image: z.string().optional(),
  replicas: NumberishSchema.optional(),
  env_add: StringArraySchema.optional(),
  env_rm: StringArraySchema.optional(),
  label_add: StringArraySchema.optional(),
  label_rm: StringArraySchema.optional(),
  publish_add: StringArraySchema.optional(),
  publish_rm: StringArraySchema.optional(),
  mount_add: StringArraySchema.optional(),
  mount_rm: StringArraySchema.optional(),
  force: BooleanishSchema.optional(),
  with_registry_auth: BooleanishSchema.optional(),
});

type ServiceUpdateParams = z.infer<typeof ServiceUpdateInputSchema>;

const ServiceUpdateOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  error: z.string().optional(),
});

type ServiceUpdateResult = z.infer<typeof ServiceUpdateOutputSchema>;

async function run(context: TaskContext<ServiceUpdateParams>): Promise<ServiceUpdateResult> {
  const { params } = context;
  const args = ['service', 'update'];

  if (params.image) {
    args.push('--image', params.image);
  }
  if (typeof params.replicas === 'number') {
    args.push('--replicas', String(params.replicas));
  }
  for (const env of params.env_add ?? []) {
    args.push('--env-add', env);
  }
  for (const env of params.env_rm ?? []) {
    args.push('--env-rm', env);
  }
  for (const label of params.label_add ?? []) {
    args.push('--label-add', label);
  }
  for (const label of params.label_rm ?? []) {
    args.push('--label-rm', label);
  }
  for (const publish of params.publish_add ?? []) {
    args.push('--publish-add', publish);
  }
  for (const publish of params.publish_rm ?? []) {
    args.push('--publish-rm', publish);
  }
  for (const mount of params.mount_add ?? []) {
    args.push('--mount-add', mount);
  }
  for (const mount of params.mount_rm ?? []) {
    args.push('--mount-rm', mount);
  }
  if (params.force) {
    args.push('--force');
  }
  if (params.with_registry_auth) {
    args.push('--with-registry-auth');
  }

  args.push(params.service);

  return await runDocker(context, params, args);
}

export default task(run, {
  description: 'Updates a Docker Swarm service.',
  inputSchema: ServiceUpdateInputSchema,
  outputSchema: ServiceUpdateOutputSchema,
});
