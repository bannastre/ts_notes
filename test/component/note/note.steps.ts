/* tslint:disable no-console only-arrow-functions */
import { logger } from '@core/utils';
import chai from 'chai';
import { Given, Then, When } from 'cucumber';
import { getRepository } from 'typeorm';
import { Note } from '../../../src/entities/notes';
import { NotePostRequest } from '../../../src/types/contracts';
import { NoteStatus } from '../../../src/types/enums';
import { requestGenerator } from '../../common.steps';

chai.should();

const testNote: NotePostRequest = {
  status: NoteStatus.DRAFT,
  text: 'A note created by the test suite'
};

Given('The right attributes for a new note', function() {
  this.body = testNote;
});

Given('I only have the {string} atributes for a new note, {string}', function(attr, value) {
  this.body = { [attr]: value };
});

Given('The right atributes to update a note', function() {
  if (!this.noteId) {
    throw new Error(`No body provided for updating a note`);
  }
  this.body = {
    status: this.response.body.status,
    text: this.response.body.text
  };
});

Given('The wrong atributes for a new note', function() {
  this.body = {
    nonesense: 'blahblahblah',
  };
});

Then('I remember the noteId', async function() {
  this.noteId = await this.response.body.id;
});

When('I call {string} {string} with a noteId', async function(method, path) {
  if (!this.noteId) {
    throw new Error(`No ID provided for ${method} ${path}`);
  }
  const id = this.noteId;
  this.response = await requestGenerator(this, method, `${path}/${id}`);
  this.response.should.not.be.an('Error');
});

Then('The database should contain {int} notes', async function(n) {
  try {
    const noteRepo = getRepository(Note);
    const notesInDatbase = await noteRepo.count();
    notesInDatbase.should.equal(n);
  } catch (err) {
    logger.error(err);
    throw err;
  }
});
