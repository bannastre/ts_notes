/* tslint:disable no-console only-arrow-functions */
import { logger, Schema } from '@core/utils';
import chai from 'chai';
import { After, Before, BeforeAll, Then, When } from 'cucumber';
import rp from 'request-promise';
import { getRepository, ObjectType } from 'typeorm';
import uuid from 'uuid/v4';
import { Note } from '../src/entities/notes';

import { start } from '../src/app';
import config from '../src/config';

chai.should();

export const cleanDB = async (entity: ObjectType<any>): Promise<number> => {
  try {
    const repository = getRepository(entity);
    await repository.delete({});
    return await repository.count();
  } catch (err) {
    logger.error(err);
    throw err;
  }
};

BeforeAll(async () => {
  try {
    await start();
    await cleanDB(Note);
  } catch (err) {
    logger.error(err);
    throw err;
  }
});

Before(async function(scenario) {
  try {
    console.log('\nScenario: ', scenario.pickle.name);
    this.headers = { 'x-correlation-id': uuid() };
    console.log('Correlation-id:', this.headers['x-correlation-id']);
  } catch (err) {
    logger.error(err);
    throw err;
  }
});

export async function requestGenerator(thys: any, method: string, path: string) {
  const response = await rp({
    body: thys.body,
    form: thys.form,
    headers: { ...thys.headers },
    json: true,
    method,
    qs: thys.qs,
    resolveWithFullResponse: true,
    simple: false,
    url: `${config.url}:${config.port}${path}`,
  });
  return response;
}

When('I call {string} {string}', async function(method, path) {
  this.response = await requestGenerator(this, method, path);
});

Then('I should get the expected status code {int}', async function(statusCode) {
  await this.response.statusCode.should.equal(statusCode);
});

Then('The response should match the swagger at {string}', async function(swaggerPath) {
  const validator = new Schema(swaggerPath);
  const url = this.response.request.uri.pathname;
  const { method } = this.response.request;
  const { statusCode } = this.response;
  const schema = validator._matchRoute(url, method, statusCode);
  if (!schema) {
    throw new Error(`No Swagger Response Found for ${statusCode}:${url}:${method}`);
  }
  const valid = await schema(this.response.body);
  if (!valid) {
    throw schema.errors;
  }
});

Then('I remember the {string}', async function(idName) {
  this[idName] = this.response.body[idName];
});

After(async function() {
  try {
    await cleanDB(Note);
  } catch (err) {
    logger.error(err);
    throw err;
  }
});
