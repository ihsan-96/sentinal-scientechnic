import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional } from 'class-validator';

export enum Bucket {
  MINUTE = 'minute',
  FIVE_MINUTES = 'fiveMinutes',
  FIFTEEN_MINUTES = 'fifteenMinutes',
  HOUR = 'hour',
  SIX_HOURS = 'sixHours',
  DAY = 'day',
}

export class TimeseriesQueryDto {
  @ApiPropertyOptional({ description: 'Window lower bound on occurredAt (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Window upper bound on occurredAt (ISO 8601); defaults to now' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiProperty({ enum: Bucket, default: Bucket.HOUR })
  @IsEnum(Bucket)
  bucket: Bucket = Bucket.HOUR;
}
