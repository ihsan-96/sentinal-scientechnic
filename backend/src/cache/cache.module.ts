import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { redisProvider } from './redis.provider';

@Global()
@Module({
  providers: [redisProvider, RedisCacheService],
  exports: [redisProvider, RedisCacheService],
})
export class CacheModule {}
