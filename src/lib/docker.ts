import type { TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { BooleanishSchema } from './schemas.js';

export const DockerBaseInputSchema = z.object({
  sudo: BooleanishSchema.optional(),
  cwd: z.string().optional(),
  docker_context: z.string().optional(),
  docker_host: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
});

export type DockerBaseParams = z.infer<typeof DockerBaseInputSchema>;

export type CommandResultPayload = {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  error?: string;
};

export function buildDockerArgs(params: DockerBaseParams, args: string[]): string[] {
  const command = ['docker'];
  if (params.docker_context) {
    command.push('--context', params.docker_context);
  }
  command.push(...args);
  return command;
}

export function buildDockerEnv(params: DockerBaseParams): Record<string, string> | undefined {
  const env = { ...(params.env ?? {}) };
  if (params.docker_host) {
    env.DOCKER_HOST = params.docker_host;
  }
  return Object.keys(env).length > 0 ? env : undefined;
}

export async function runDocker(
  context: TaskContext,
  params: DockerBaseParams,
  args: string[],
): Promise<CommandResultPayload> {
  const result = await context.exec(buildDockerArgs(params, args), {
    sudo: params.sudo ?? false,
    cwd: params.cwd,
    env: buildDockerEnv(params),
  });

  if (result.exitCode !== 0) {
    return {
      success: false,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.stderr || result.stdout || 'Docker command failed.',
    };
  }

  return {
    success: true,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
