import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Review } from './Review';
import { User } from './User';

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

  @ManyToMany(() => User, (user) => user.likes)
  likes!: User[];

  @ManyToMany(() => User, (user) => user.reads)
  reads!: User[];
}
