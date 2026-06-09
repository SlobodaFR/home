import { Module } from '@nestjs/common';
import { AuthModule } from '@home/auth';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
