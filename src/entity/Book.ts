import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Review } from "./Review";

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column()
  author!: string;

  @Column()
  cover!: string;

  @Column()
  price!: string;

  @Column()
  category!: string;

  @Column()
  url!: string;

  @OneToMany(() => Review, (review) => review.book)
  reviews!: Review[];
}
