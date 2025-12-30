import { createRegistry } from 'hostctl';

import composeDeploy from './tasks/compose/deploy.js';
import composeDown from './tasks/compose/down.js';
import composeLogs from './tasks/compose/logs.js';
import composePs from './tasks/compose/ps.js';
import composePull from './tasks/compose/pull.js';
import composeRestart from './tasks/compose/restart.js';

import registryLogin from './tasks/registry/login.js';
import cleanupPrune from './tasks/cleanup/prune.js';

import swarmInit from './tasks/swarm/init.js';
import swarmJoin from './tasks/swarm/join.js';
import swarmLeave from './tasks/swarm/leave.js';
import swarmToken from './tasks/swarm/token.js';
import swarmStackDeploy from './tasks/swarm/stack-deploy.js';
import swarmStackRemove from './tasks/swarm/stack-rm.js';
import swarmServiceScale from './tasks/swarm/service-scale.js';
import swarmServiceUpdate from './tasks/swarm/service-update.js';
import swarmServiceLogs from './tasks/swarm/service-logs.js';
import swarmNodeList from './tasks/swarm/node-list.js';

export {
  composeDeploy,
  composeDown,
  composeLogs,
  composePs,
  composePull,
  composeRestart,
  registryLogin,
  cleanupPrune,
  swarmInit,
  swarmJoin,
  swarmLeave,
  swarmToken,
  swarmStackDeploy,
  swarmStackRemove,
  swarmServiceScale,
  swarmServiceUpdate,
  swarmServiceLogs,
  swarmNodeList,
};

export const registry = createRegistry()
  .register('docker.compose.deploy', composeDeploy)
  .register('docker.compose.down', composeDown)
  .register('docker.compose.logs', composeLogs)
  .register('docker.compose.ps', composePs)
  .register('docker.compose.pull', composePull)
  .register('docker.compose.restart', composeRestart)
  .register('docker.registry.login', registryLogin)
  .register('docker.cleanup.prune', cleanupPrune)
  .register('docker.swarm.init', swarmInit)
  .register('docker.swarm.join', swarmJoin)
  .register('docker.swarm.leave', swarmLeave)
  .register('docker.swarm.token', swarmToken)
  .register('docker.swarm.stack.deploy', swarmStackDeploy)
  .register('docker.swarm.stack.rm', swarmStackRemove)
  .register('docker.swarm.service.scale', swarmServiceScale)
  .register('docker.swarm.service.update', swarmServiceUpdate)
  .register('docker.swarm.service.logs', swarmServiceLogs)
  .register('docker.swarm.node.list', swarmNodeList);
