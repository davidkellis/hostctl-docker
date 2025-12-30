import type { TaskContext } from 'hostctl';
import { cleanupFile, composeTempDir, ensureFileFromContent, type PreparedFile } from './files.js';

export type ComposeFileInput = {
  composePath?: string;
  composeContent?: string;
  envPath?: string;
  envContent?: string;
  project?: string;
  sudo?: boolean;
};

export type ComposeFileResult = {
  composePath: string;
  envPath?: string;
  composeFile: PreparedFile;
  envFile?: PreparedFile;
};

export async function prepareComposeFiles(
  context: TaskContext,
  input: ComposeFileInput,
): Promise<ComposeFileResult> {
  if (!input.composePath && !input.composeContent) {
    throw new Error('compose_path or compose_content is required.');
  }

  const baseDir = composeTempDir(input.project, context.id);
  const composePath = input.composePath ?? `${baseDir}/docker-compose.yml`;
  const composeFile = await ensureFileFromContent(context, {
    path: composePath,
    content: input.composeContent,
    defaultDir: baseDir,
    defaultName: 'docker-compose.yml',
    mode: 0o600,
    sudo: input.sudo,
  });

  let envFile: PreparedFile | undefined;
  let envPath: string | undefined;

  if (input.envPath || input.envContent) {
    envPath = input.envPath ?? `${baseDir}/.env`;
    envFile = await ensureFileFromContent(context, {
      path: envPath,
      content: input.envContent,
      defaultDir: baseDir,
      defaultName: '.env',
      mode: 0o600,
      sudo: input.sudo,
    });
  }

  return { composePath, envPath, composeFile, envFile };
}

export async function cleanupComposeFiles(
  context: TaskContext,
  files: ComposeFileResult,
  cleanup: boolean,
): Promise<void> {
  await cleanupFile(context, files.envFile, cleanup);
  await cleanupFile(context, files.composeFile, cleanup);
}
