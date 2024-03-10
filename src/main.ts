import cluster from 'cluster';
import os from 'os';
import { startServer } from './server';

if (cluster.isPrimary) {
  for (let i = 0; i < os.cpus().length; i++) {
    cluster.fork();
  }
} else {
  startServer();
}
