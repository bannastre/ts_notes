import { NoteStatus } from './enums';

export type NotePostRequest = {
  text: string;
  status: NoteStatus;
};

export type NoteResponse = {
  id: string;
  text: string;
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
};

export type NotesResponse = NoteResponse[];

export type NotePatchRequest = Partial<NotePostRequest>;
