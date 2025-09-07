import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ProductIdDto } from 'src/Products/Dto/productIdDto.dto';

export class CreateOrderDto {
  @ApiProperty({
    example: '4ce2aa7e-bdfb-454b-8ea7-9f55754769a8',
    description: 'ID del usuario sustraído de la base de datos',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    type: [ProductIdDto],
    example: [
      { id: 'b14b85b3-b955-4a67-882a-b78ae2d17f84' },
      { id: '59925039-3213-40d5-8d33-82de5213dd44' },
    ],
  })
  @ArrayNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductIdDto)
  products: ProductIdDto[];
}
