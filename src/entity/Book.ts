import { Entity, PrimaryColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { Review } from './Review';
import { User } from './User';

@Entity()
export class Book {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column()
  author!: string;

  @Column()
  thumbnail!: string;

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
