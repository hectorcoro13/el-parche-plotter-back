import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsNumber,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  address?: string;

  @IsOptional()
  @IsNumber()
  phone?: number;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  city?: string;

  @IsOptional()
  @IsString()
  identificationType?: string;

  @IsOptional()
  @IsString()
  identificationNumber?: string;
}
