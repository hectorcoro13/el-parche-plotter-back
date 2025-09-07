import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

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
