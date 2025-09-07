import { SetMetadata } from '@nestjs/common';
import { role } from 'src/roles.enum';

export const Roles = (...roles: role[]) => SetMetadata('roles', roles);
