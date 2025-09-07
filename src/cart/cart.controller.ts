import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CartService } from './cart.services';
import { AuthGuard } from 'src/Auth/Auth.guard';
import { AddToCartDto } from './dto/car.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req) {
    const userId = req.user.id;
    return this.cartService.getCart(userId);
  }

  @Post('add')
  addToCart(@Req() req, @Body() addToCartDto: AddToCartDto) {
    const userId = req.user.id;
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Delete('remove/:productId')
  removeFromCart(@Req() req, @Param('productId') productId: string) {
    const userId = req.user.id;
    return this.cartService.removeFromCart(userId, productId);
  }

  @Delete('clear')
  clearCart(@Req() req) {
    const userId = req.user.id;
    return this.cartService.clearCart(userId);
  }
  @Post('decrease')
  decreaseItemQuantity(@Req() req, @Body('productId') productId: string) {
    const userId = req.user.id;
    return this.cartService.decreaseItemQuantity(userId, productId);
  }

  // Ruta para eliminar completamente un producto (ej. desde el carrito con un botón 'X')
  @Delete('item/:productId')
  removeItemFromCart(
    @Req() req,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const userId = req.user.id;
    return this.cartService.removeItemFromCart(userId, productId);
  }
}
