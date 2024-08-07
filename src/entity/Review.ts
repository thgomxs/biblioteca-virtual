import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Book } from "./Book";
import { User } from "./User";

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  rating!: string;

  @Column()
  comment!: string;

  @ManyToOne(() => Book, (book) => book.reviews)
  book!: Book;

  @ManyToOne(() => User, (user) => user.reviews)
  user!: User;
}
