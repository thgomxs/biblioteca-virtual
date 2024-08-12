import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Review } from './Review';
import { Book } from './Book';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];

  @ManyToMany(() => Book, (book) => book.likes)
  @JoinTable()
  likes!: Book[];

  @ManyToMany(() => Book, (book) => book.reads)
  @JoinTable()
  reads!: Book[];
}
