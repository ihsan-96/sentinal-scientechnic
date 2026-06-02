import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { IncidentStatus } from '../incident.enums';

export class UpdateStatusDto {
  @ApiProperty({ enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;
}
