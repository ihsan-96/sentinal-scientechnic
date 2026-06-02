import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';
import { IncidentStatus } from '../incident.enums';

export class StatusEventDto {
  @ApiProperty({ enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  status!: IncidentStatus;

  @ApiPropertyOptional({ description: 'Event time (ISO 8601); defaults to now' })
  @IsOptional()
  @IsISO8601()
  timestamp?: string;
}
