import { IsOptional, IsString, IsNumber } from 'class-validator';

export class NotifyCallingDto {
  @IsOptional()
  @IsNumber()
  owner_id?: number;

  @IsString()
  owner_number!: string;
}
