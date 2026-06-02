import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class StatsQueryDto {
  @ApiPropertyOptional({ description: 'Window lower bound on occurredAt (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Window upper bound on occurredAt (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
