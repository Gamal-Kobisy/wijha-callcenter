import { IsNumberString } from 'class-validator';

export class GetNextOwnerQueryDto {
  @IsNumberString()
  project_id!: string;
}
