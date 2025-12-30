import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, runDocker } from '../../lib/docker.js';
import { NumberishSchema } from '../../lib/schemas.js';

const ServiceScaleInputSchema = DockerBaseInputSchema.extend({
  service: z.string().min(1),
  replicas: NumberishSchema,
});

type ServiceScaleParams = z.infer<typeof ServiceScaleInputSchema>;

const ServiceScaleOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  error: z.string().optional(),
});

type ServiceScaleResult = z.infer<typeof ServiceScaleOutputSchema>;

async function run(context: TaskContext<ServiceScaleParams>): Promise<ServiceScaleResult> {
  const target = `${context.params.service}=${context.params.replicas}`;
  return await runDocker(context, context.params, ['service', 'scale', target]);
}

export default task(run, {
  description: 'Scales a Docker Swarm service to a desired replica count.',
  inputSchema: ServiceScaleInputSchema,
  outputSchema: ServiceScaleOutputSchema,
});
