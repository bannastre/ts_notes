import { Server } from 'http';
import { start } from './src/app';

const init = async () => {
  const server: Server = await start();
};

init();
