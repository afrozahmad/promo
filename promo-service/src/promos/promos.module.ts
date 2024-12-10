import { Module } from '@nestjs/common';
import { engine } from '../rules/engine';
import { PromosController } from './promos.controller';
import { PromoService } from './promos.service';

@Module({
  providers: [
    PromoService,
    
  ],
  controllers: [PromosController],
  exports: [PromoService], // Export if needed in other modules
})
export class PromosModule {}
