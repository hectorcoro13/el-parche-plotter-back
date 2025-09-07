import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { Users } from 'src/Users/entities/user.entity';
import { AddToCartDto } from './dto/car.dto';
import { Products } from 'src/Products/entities/products.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Products)
    private readonly productsRepository: Repository<Products>,
  ) {}

  private async findOrCreateCart(userId: string): Promise<Cart> {
    const userWithCart = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['cart'],
    });

    if (!userWithCart) throw new NotFoundException('Usuario no encontrado');

    if (userWithCart.cart) {
      return userWithCart.cart;
    }

    // Si el usuario no tiene carrito, creamos uno nuevo
    const newCart = this.cartRepository.create({
      user: userWithCart,
      items: [],
    });
    return this.cartRepository.save(newCart);
  }

  async getCart(userId: string): Promise<Cart> {
    return this.findOrCreateCart(userId);
  }

  async addToCart(userId: string, itemDto: AddToCartDto): Promise<Cart> {
    const product = await this.productsRepository.findOneBy({
      id: itemDto.productId,
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    const cart = await this.findOrCreateCart(userId);
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === itemDto.productId,
    );

    const quantityInCart =
      existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
    const requestedQuantity = itemDto.quantity;

    if (product.stock < quantityInCart + requestedQuantity) {
      // Usamos BadRequestException para un error 400 claro.
      throw new BadRequestException(
        `Stock insuficiente para ${product.name}. Solo quedan ${product.stock} unidades.`,
      );
    }

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += itemDto.quantity;
    } else {
      cart.items.push({ ...itemDto });
    }

    return this.cartRepository.save(cart);
  }
  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    return this.cartRepository.save(cart);
  }
  async decreaseItemQuantity(userId: string, productId: string): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );

    if (itemIndex > -1) {
      if (cart.items[itemIndex].quantity > 1) {
        // Si hay más de 1, solo restamos
        cart.items[itemIndex].quantity -= 1;
      } else {
        // Si solo hay 1, eliminamos el producto del array
        cart.items.splice(itemIndex, 1);
      }
    } else {
      throw new NotFoundException('Producto no encontrado en el carrito');
    }

    return this.cartRepository.save(cart);
  }

  async removeItemFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    return this.cartRepository.save(cart);
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.findOrCreateCart(userId);
    cart.items = [];
    return this.cartRepository.save(cart);
  }
}
