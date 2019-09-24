import { ConnectionOptions } from 'typeorm';

/* tslint:disable object-literal-sort-keys */
const config: ConnectionOptions = {
  type: 'postgres',
  host: 'db',
  port: 5432,
  username: 'postgres',
  password: 'super_secret',
  database: `nerd_notes`,
  synchronize: true,
  logging: true,
  schema: 'nerds',
  entities: ['dist/src/db/entities/**/*.js'],
  migrations: ['dist/src/db/migrations/**/*.js'],
  subscribers: ['dist/src/db/subscribers/**/*.js'],
  cli: {
    entitiesDir: 'dist/src/db/entities',
    migrationsDir: 'dist/src/db/migrations',
    subscribersDir: 'dist/src/db/subscribers',
  }
};

export = config;
