import express from 'express';
import { NotesController } from '../controllers/notes';

const notesRouter = express.Router();

const notesController = new NotesController();

notesRouter.post('/', notesController.create);
notesRouter.get('/', notesController.list);
notesRouter.get('/:noteId', notesController.read);
notesRouter.patch('/:noteId', notesController.update);
notesRouter.delete('/:noteId', notesController.delete);

export default notesRouter;
