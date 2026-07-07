import { IsString, IsNumber, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { OwnerNumberDto } from './owner-number.dto';
import { OwnerInfoDto } from './owner-info.dto';

export class CreateOwnerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNumber()
  @IsOptional()
  project_id?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OwnerNumberDto)
  numbers!: OwnerNumberDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OwnerInfoDto)
  info?: OwnerInfoDto[];
}
