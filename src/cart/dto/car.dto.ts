// src/cart/dto/car.dto.ts

import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

// Esta clase es la que ya tenías
export class AddToCartDto {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsString()
  imgUrl: string;
}

// --- CLASE AÑADIDA PARA CORREGIR EL ERROR ---
// Esta es la definición que faltaba.
export class CartItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
// --- FIN DE LA CORRECCIÓN ---

// Esta clase ahora podrá encontrar a CartItemDto
export class SyncCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}
