import { Users } from 'src/Users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

export class CartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  imgUrl: string;
}

@Entity({ name: 'CARTS' })
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Users, (user) => user.cart, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column('jsonb', { nullable: false, default: [] })
  items: CartItem[];
}
