import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { EventType, Severity } from '../incident.enums';

export class OpenIncidentDto {
  @ApiPropertyOptional({ description: 'Client-supplied correlation id; generated if omitted' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'CAM-001' })
  @IsString()
  @MaxLength(64)
  deviceId!: string;

  @ApiProperty({ example: 'Sheikh Zayed Road' })
  @IsString()
  @MaxLength(256)
  location!: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  eventType!: EventType;

  @ApiProperty({ enum: Severity })
  @IsEnum(Severity)
  severity!: Severity;

  @ApiProperty({ example: '2026-06-01T10:30:00Z' })
  @IsISO8601()
  timestamp!: string;
}
