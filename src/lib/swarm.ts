import type { TaskContext } from 'hostctl';
import type { DockerBaseParams } from './docker.js';
import { runDocker } from './docker.js';

export type SwarmStateResult = {
  success: boolean;
  state?: string;
  controlAvailable?: boolean;
  error?: string;
};

export async function getSwarmState(
  context: TaskContext,
  params: DockerBaseParams,
): Promise<SwarmStateResult> {
  const stateResult = await runDocker(context, params, ['info', '--format', '{{.Swarm.LocalNodeState}}']);
  if (!stateResult.success) {
    return { success: false, error: stateResult.error };
  }
  const controlResult = await runDocker(context, params, ['info', '--format', '{{.Swarm.ControlAvailable}}']);
  if (!controlResult.success) {
    return { success: false, error: controlResult.error };
  }

  return {
    success: true,
    state: stateResult.stdout.trim(),
    controlAvailable: controlResult.stdout.trim() === 'true',
  };
}

export async function getJoinToken(
  context: TaskContext,
  params: DockerBaseParams,
  role: 'worker' | 'manager',
): Promise<{ success: boolean; token?: string; error?: string }> {
  const result = await runDocker(context, params, ['swarm', 'join-token', '-q', role]);
  if (!result.success) {
    return { success: false, error: result.error };
  }
  const token = result.stdout.trim();
  if (!token) {
    return { success: false, error: 'Swarm join token not available.' };
  }
  return { success: true, token };
}
