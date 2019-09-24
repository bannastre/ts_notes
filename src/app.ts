import { middleware } from '@capitadsp/core-utils';
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

  /**
   * Create the schema for the connection. Ignore the type error.
   */
  // @ts-ignore
  await connection.query(`CREATE SCHEMA IF NOT EXISTS ${ormconfig.schema}`);

  console.log(`[db] Connected with ${connection.name}: ${connection.options.type}`);

  app.use(cors());

  app.use(middleware.parseRequest());
  app.use(middleware.trackingInit());
  app.use(middleware.security());
  app.use(middleware.logging());
  app.use(middleware.requestInit());
  app.use(middleware.schemaValidator(`${__dirname}/../definitions/${config.name}.yaml`));

  app.use('/notes', notesRouter);

  /**
   * Error Handler
   */
  app.use((err: any, _: any, __: any, next: any) => {
    console.log(err);
    next(err);
  });

  app.use(middleware.defaultErrorHandler());
  app.use(middleware.logsClose());

  return app.listen(config.port, (err) => {
    if (err) { console.error(err); }
    console.log(`Express server listening on port ${config.port}`);
  });
}
