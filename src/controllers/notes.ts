import { NextFunction, Request, Response } from 'express';
import { constants } from 'http2';
import { getCustomRepository } from 'typeorm';
import { Note } from '../entities/notes';
import { NoteRepository } from '../repositories/notes';
import { IController } from '../types/interfaces';

export class NotesController implements IController {
  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const noteRepo: NoteRepository = getCustomRepository(NoteRepository);
      const note: Note = noteRepo.create(req.body);
      const savedNote = await noteRepo.save(note);
      res.status(constants.HTTP_STATUS_CREATED).send(savedNote);
    } catch (err) {
      next(err);
    }
  }

  public list = async (_: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notes: Note[] = await getCustomRepository(NoteRepository).list();
      res.status(constants.HTTP_STATUS_OK).send(notes);
    } catch (err) {
      next(err);
    }
  }

  public read = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const note: Note = await getCustomRepository(NoteRepository).find(req.params.noteId);
      res.status(constants.HTTP_STATUS_OK).send(note);
    } catch (err) {
      if (err.name === 'EntityNotFound') {
        res.status(constants.HTTP_STATUS_NOT_FOUND).send();
      }
      next(err);
    }
  }

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const note: Note = await getCustomRepository(NoteRepository).update(req.params.noteId, req.body);
      res.status(constants.HTTP_STATUS_OK).send(note);
    } catch (err) {
      if (err.name === 'EntityNotFound') {
        res.status(constants.HTTP_STATUS_NOT_FOUND).send();
      }
      next(err);
    }
  }

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await getCustomRepository(NoteRepository).delete(req.params.noteId);
      res.status(constants.HTTP_STATUS_NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  }

}
