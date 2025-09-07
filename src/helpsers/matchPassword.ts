import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchPassword', async: false })
export class MatchPassword implements ValidatorConstraintInterface {
  validate(Password: string, args: ValidationArguments) {
    if (Password !== (args.object as any)[args.constraints[0]]) return false;
    return true;
  }
  defaultMessage() {
    return 'Password do not match';
  }
}
