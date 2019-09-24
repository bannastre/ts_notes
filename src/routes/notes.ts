import express, { NextFunction, Request, Response } from 'express';
import { constants } from 'http2';

const notesRouter = express.Router();

notesRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(constants.HTTP_STATUS_NOT_IMPLEMENTED).send();
  } catch (err) {
    next(err);
  }

});

export default notesRouter;
