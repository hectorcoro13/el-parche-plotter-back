import { ApiHideProperty, PickType } from '@nestjs/swagger';
import {
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import { MatchPassword } from 'src/helpsers/matchPassword';

export class CreateUserDto {
  /**
   * Nombre de usuario
   * @example  Isioma
   */
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name: string;

  /**
   * Direccion de correo electronico
   * @example Isioma123@gmail.com
   */
  @IsNotEmpty()
  @IsEmail()
  email: string;

  /**
   * Debes ingresar una contraseña,debe tener una mayuscula,una minuscula,un caracter especial y un numero
   * @example Clavesegura@123
   */
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(15)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message:
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character: !@#$%^&*',
  })
  password: string;

  /**
   * Confirmacion de la contraseña
   * @example Clavesegura@123
   */
  @Validate(MatchPassword, ['password'])
  passwordConfirm: string;

  /**
   * Direccion de residencia
   * @example "Calle 45 #24-15"
   */
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  address: string;

  /**
   * Numero de telefono
   * @example 3134569021
   */
  @IsNotEmpty()
  @IsNumber()
  phone: number;

  /**
   * Nombre del pais
   * @example Colombia
   */
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  @IsString()
  country: string;

  /**
   * Nombre de la Cuidad
   * @example Bogota
   */
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  @IsString()
  city?: string;

  @ApiHideProperty()
  @IsEmpty()
  IsAdmin?: boolean;
}

export class LoginDto extends PickType(CreateUserDto, ['email', 'password']) {}
