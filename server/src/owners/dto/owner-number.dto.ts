import { IsPhoneNumber } from 'class-validator';

export class OwnerNumberDto {
  @IsPhoneNumber('EG')
  number!: string;
}
