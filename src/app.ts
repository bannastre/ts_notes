import cors from 'cors';
import express from 'express';
import { Server } from 'http';
import 'reflect-metadata';
import { Connection, createConnection } from 'typeorm';
import config from './config';
import ormconfig from './ormconfig';

import notesRouter from './routes/notes';

const app: express.Express = express();

export async function start(): Promise<Server> {
  const connection: Connection = await createConnection(ormconfig);
  console.log(`[db] Connected with ${connection.name}: ${connection.options.type}`);

  app.use(cors());

  app.use('/notes', notesRouter);

  /**
   * Error Handler
   */
  app.use((err: any, _: any, __: any, next: any) => {
    console.log(err);
    next(err);
  });

  return app.listen(config.port, (err) => {
    if (err) { console.error(err); }
    console.log(`Express server listening on port ${config.port}`);
  });
}
