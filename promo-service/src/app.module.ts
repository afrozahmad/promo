import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PromosModule } from './promos/promos.module';

@Module({
  imports: [PromosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
