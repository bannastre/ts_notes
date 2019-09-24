import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { NotePostRequest } from '../types/contracts';
import { NoteStatus } from '../types/enums';

export type NoteCreateOptions = Partial<NotePostRequest>;

@Entity({ name: 'note' })
export class Note {
  @PrimaryGeneratedColumn('uuid')
  public id?: string;

  @Column({ type: 'text' })
  public text: string;

  @Column({ type: 'text', default: NoteStatus.DRAFT })
  public status: NoteStatus;

  @CreateDateColumn()
  public createdAt?: Date;

  @UpdateDateColumn()
  public updatedAt?: Date;

  constructor({
    text,
    status
  }: NoteCreateOptions = {}) {
    this.text = text;
    this.status = status;
  }
}
