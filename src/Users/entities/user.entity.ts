import { Cart } from 'src/cart/entities/cart.entity';
import { Orders } from 'src/orders/entities/order.entity';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { v4 as uuid } from 'uuid';

@Entity({
  name: 'USERS',
})
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuid();

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  password: string;

  @Column({
    type: 'bigint',
    nullable: true,
  })
  phone: number;

  @Column({ type: 'boolean', default: false, name: 'is_profile_complete' })
  isProfileComplete: boolean;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  country: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    name: 'identification_type',
  })
  identificationType: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'identification_number',
  })
  identificationNumber: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  imageProfile: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  address: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  city: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  auth0Id: string;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_blocked',
  })
  isBlocked: boolean;

  @Column({
    type: 'boolean',
    default: false,
    nullable: true,
    name: 'isadmin',
  })
  isAdmin: boolean;

  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Cart;

  @OneToMany(() => Orders, (order) => order.user)
  order: Orders[];
}
