import crypto from 'node:crypto';
import path from 'node:path';
import type { TaskContext } from 'hostctl';

export type PreparedFile = {
  path: string;
  created: boolean;
};

export type EnsureFileOptions = {
  path?: string;
  content?: string;
  defaultDir: string;
  defaultName: string;
  mode?: number;
  sudo?: boolean;
};

function posixDirname(target: string): string {
  return path.posix.dirname(target);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export async function ensureFileFromContent(
  context: TaskContext,
  options: EnsureFileOptions,
): Promise<PreparedFile> {
  const targetPath = options.path ?? path.posix.join(options.defaultDir, options.defaultName);
  if (typeof options.content !== 'string') {
    return { path: targetPath, created: false };
  }
  const content = options.content;

  await context.file.mkdir(posixDirname(targetPath), { recursive: true });

  try {
    await context.file.write(targetPath, content, { mode: options.mode, flag: 'w' });
    return { path: targetPath, created: true };
  } catch (error) {
    if (!options.sudo) {
      throw error;
    }
    const marker = `HOSTCTL_DOCKER_${crypto.randomUUID()}`;
    const script = `cat <<'${marker}' > ${shellQuote(targetPath)}\n${content}\n${marker}`;
    const fallback = await context.exec(['bash', '-lc', script], { sudo: true });
    if (fallback.exitCode !== 0) {
      throw new Error(fallback.stderr || fallback.stdout || 'Failed to write file with sudo.');
    }
    return { path: targetPath, created: true };
  }
}

export async function cleanupFile(
  context: TaskContext,
  file: PreparedFile | undefined,
  shouldCleanup: boolean,
): Promise<void> {
  if (!file || !shouldCleanup || !file.created) return;
  try {
    await context.file.rm(file.path, { force: true });
  } catch (error) {
    context.warn(`Failed to clean up file ${file.path}: ${(error as Error)?.message ?? error}`);
  }
}

export function composeTempDir(project: string | undefined, invocationId: string): string {
  const slug = project && project.trim() ? project.trim() : invocationId;
  return path.posix.join('/tmp/hostctl-docker/compose', slug);
}

export function stackTempDir(stack: string, invocationId: string): string {
  const slug = stack && stack.trim() ? stack.trim() : invocationId;
  return path.posix.join('/tmp/hostctl-docker/swarm', slug);
}
