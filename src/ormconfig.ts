import 'reflect-metadata';
import { ConnectionOptions } from 'typeorm';

// tslint:disable object-literal-sort-keys
const ormconfig: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'super_secret',
  database: `nerd_notes`,
  schema: 'nerds',
  synchronize: true,
  logging: true,
  entities: ['dist/src/entities/**/*.js'],
  migrations: ['dist/src/migrations/**/*.js'],
  subscribers: ['dist/src/subscribers/**/*.js'],
  cli: {
    entitiesDir: 'dist/src/entities',
    migrationsDir: 'dist/src/migrations',
    subscribersDir: 'dist/src/subscribers',
  }
};

export = ormconfig;
