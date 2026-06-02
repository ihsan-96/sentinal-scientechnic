import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';
import { OpenIncidentDto } from './open-incident.dto';

export class BatchOpenIncidentDto {
  @ApiProperty({ type: [OpenIncidentDto] })
  @ValidateNested({ each: true })
  @Type(() => OpenIncidentDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  incidents!: OpenIncidentDto[];
}
