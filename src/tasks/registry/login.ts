import { task, type TaskContext } from 'hostctl';
import { z } from 'hostctl';
import { DockerBaseInputSchema, buildDockerArgs, buildDockerEnv } from '../../lib/docker.js';

const RegistryLoginInputSchema = DockerBaseInputSchema.extend({
  registry: z.string().min(1),
  username: z.string().min(1),
  password: z.string().optional(),
  password_secret: z.string().optional(),
  config_dir: z.string().optional(),
});

type RegistryLoginParams = z.infer<typeof RegistryLoginInputSchema>;

const RegistryLoginOutputSchema = z.object({
  success: z.boolean(),
  exitCode: z.number(),
  stdout: z.string(),
  stderr: z.string(),
  error: z.string().optional(),
});

type RegistryLoginResult = z.infer<typeof RegistryLoginOutputSchema>;

async function run(context: TaskContext<RegistryLoginParams>): Promise<RegistryLoginResult> {
  const { params, getSecret, getPassword } = context;

  let password = params.password;
  if (!password && params.password_secret) {
    password = await getSecret(params.password_secret);
  }
  if (!password) {
    password = await getPassword();
  }

  if (!password) {
    return {
      success: false,
      exitCode: -1,
      stdout: '',
      stderr: '',
      error: 'Registry password is required.',
    };
  }

  const args = buildDockerArgs(params, [
    'login',
    params.registry,
    '--username',
    params.username,
    '--password-stdin',
  ]);
  const env = {
    ...(buildDockerEnv(params) ?? {}),
    ...(params.config_dir ? { DOCKER_CONFIG: params.config_dir } : {}),
  };

  const stdin = password.endsWith('\n') ? password : `${password}\n`;
  const result = await context.exec(args, {
    sudo: params.sudo ?? false,
    cwd: params.cwd,
    env: Object.keys(env).length > 0 ? env : undefined,
    stdin,
  });

  if (result.exitCode !== 0) {
    return {
      success: false,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.stderr || result.stdout || 'Docker registry login failed.',
    };
  }

  return {
    success: true,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export default task(run, {
  description: 'Logs into a Docker registry using docker login --password-stdin.',
  inputSchema: RegistryLoginInputSchema,
  outputSchema: RegistryLoginOutputSchema,
});
