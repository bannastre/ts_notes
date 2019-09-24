import { EntityManager, EntityRepository } from 'typeorm';
import { Note, NoteCreateOptions } from '../entities/notes';

export interface INoteRepository {
  create(createOptions: NoteCreateOptions): Note;
  save(note: NoteCreateOptions): Promise<Note>;
  list(): Promise<Note[]>;
  find(id: string): Promise<Note>;
  update(id: string, updates: object): Promise<Note>;
  delete(id: string): Promise<void>;
}
@EntityRepository()
export class NoteRepository implements INoteRepository {
  constructor(private manager: EntityManager) {}

  public create(createOptions: NoteCreateOptions): Note {
    return new Note(createOptions);
  }

  public async save(note: Note): Promise<Note> {
    return this.manager.save(Note, note);
  }

  public async list(): Promise<Note[]> {
    return this.manager.find(Note);
  }

  public async find(id: string): Promise<Note> {
    return this.manager.findOneOrFail(Note, { id });
  }

  public async update(id: string, updates: object): Promise<Note> {
    await this.manager.update(Note, { id }, updates);
    return this.manager.findOneOrFail(Note, { id });
  }

  public async delete(id: string): Promise<void> {
    await this.manager.delete(Note, id);
  }
}
