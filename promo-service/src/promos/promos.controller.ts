import { Controller, Get, Post, Body } from '@nestjs/common';
import { Engine } from 'json-rules-engine';
import { RuleResult } from 'json-rules-engine';
import { PromoService} from './promos.service';
import { calculateMemoryUsage } from 'src/utils/memory.utils';

import * as fs from 'fs-extra';

interface Item  {
  category: string; id: string; quantity: number, total: number 
};
type Cart = {
  items: Item[];
  total: number;
};
interface RuleValue {
  attribute: string;
  values: string[];
}

@Controller('promos')
export class PromosController {
  private promos = []; // In-memory data store for simplicity
  
  private engine: Engine;

  constructor(private readonly promosService: PromoService) {
    this.engine = new Engine();
    const initialMemory = process.memoryUsage();
    

    this.engine.addOperator('>=', ( filteredList: Item[], factValue: number) => {
      if (!factValue ||  !Array.isArray(filteredList) ){
        throw new Error('filteredList shold be array.');
      }
      let count: number=0;
      filteredList.forEach(item=> {
          count += item.quantity;
      });

    
      // Return boolean for rule evaluation
      return count >= factValue;
    });

    this.engine.addOperator('in', (factValue: any[], ruleValue: { attribute: string; values: string[] }) => {
      if (!ruleValue || !ruleValue.attribute || !Array.isArray(ruleValue.values)) {
        throw new Error('Rule value must include "attribute" and "values" array.');
      }
    
      // Find matched items
      const matchedItems = factValue.filter(item => ruleValue.values.includes(item[ruleValue.attribute]));
    
      // Return boolean for rule evaluation
      return matchedItems.length > 0;
    });


  
    // Load rules from rules.json on startup
    const rules = fs.readJSONSync('./rules copy.json');
    rules.forEach((rule) => {
        this.promos.push(rule); // Add to local rules array
        this.engine.addRule(rule)
    });
    const finalMemory = process.memoryUsage();
    console.log('Memory usage after loading rules:', calculateMemoryUsage(initialMemory, finalMemory));
  
  }

  @Get()
  getPromos() {
    return { message: 'Rules fetched successfully', rules: this.promos };

  }

  @Post()
  createPromo(@Body() promo: { id: string; discount: number }) {
    this.promos.push(promo); // Adds a new promo to the in-memory store
    return { message: 'Promo added successfully', promo };
  } 

  @Post('/evaluate')
  async evaluateCart(@Body() facts: any) {
    const cart = { ...facts.cart };
    const flattenedCart = this.promosService.flatten(cart);
    // return this.promosService.evaluateCart(facts);
    facts.cart =flattenedCart;
    const result = await this.engine.run(facts);
    const updatedCart = { ...facts.cart };
    return this.promosService.evaluateResults(result, updatedCart)
    // result.results.forEach((ruleResult: RuleResult)=>{
    //   const { action, target, value } = ruleResult.event?.params;
    //   if (ruleResult.event?.type ==="orderLevelDiscount"){
        
        
    //     switch (action) {
    //       case 'percentOff':
    //         updatedCart[target.split('.')[1]] *= (1 - value / 100);
    //         break;
    
    //       case 'dollarOff':
    //         updatedCart[target.split('.')[1]] -= value;
    //         break;
    
    //       case 'freeShipping':
    //         updatedCart[target.split('.')[1]] = 0;
    //         break;
          
    //       default:
    //         break;
    //     }
    //   }
    //   else  if (ruleResult.event?.type === "itemLevelDiscount"){
    //     if ('all' in ruleResult.conditions && 'factResult' in ruleResult.conditions['all'][0]){
    //       const factResult: unknown = ruleResult.conditions['all'][0].factResult;
    //       const matchedItems = Array.isArray(factResult) ? (factResult as Item[]) : [];
    //                 if (Array.isArray(matchedItems)) {
    //         matchedItems.forEach(item => {
    //           switch (action) {
    //             case 'percentOff': 
                
    //              // neet to find total . what if items have different skus. should not matter 
    //             //should ideally prorate based on quanity ((qualtity/total)* total_qty * ruleResult.event?.params.value)
    //             //
                  
    //               item[target.split('.')[1]] *= (1 - ruleResult.event?.params.value / 100);
    //               break;
          
    //             case 'dollarOff':
    //               //should ideally prorate based on quanity (qualtity/total) * total_qty * ruleResult.event?.params.value
    //               item[target.split('.')[1]] -= ruleResult.event?.params.value;
    //               break;
    //             case 'percentOff_bogo':
    //               //valuue : range = 0% - 100% - if 100 means free.
    //               //logic: looks at number of items. divides by two and gives the percent off to those
    //               //eg. quantity 3 => 3/2 = 1 - so one item gets bogo discount
    //               // quantity 3 => 5/2 = 2 - so 2 item gets bogo discount
    //               break;

    //             case 'percentOff_bogo':
    //                 //valuue :  if value > item total or if value = -1, total becomes 0
    //                 //logic: looks at number of items. divides by two and gives the percent off to those
    //                 //eg. quantity 3 => 3/2 = 1 - so one item gets bogo discount
    //                 // quantity 3 => 5/2 = 2 - so 2 item gets bogo discount
    //                 break;
    //             default: 
    //                 break;
    //             }
    //         });
    //       }
    //     }
        
    //   }
    // });
    
  
    // return { message: 'Evaluation complete', updatedCart, events: result.events };
  }
  // private calculateMemoryUsage(before: NodeJS.MemoryUsage, after: NodeJS.MemoryUsage) {
  //   return {
  //     rss: `${((after.rss - before.rss) / 1024 / 1024).toFixed(2)} MB`,
  //     heapTotal: `${((after.heapTotal - before.heapTotal) / 1024 / 1024).toFixed(2)} MB`,
  //     heapUsed: `${((after.heapUsed - before.heapUsed) / 1024 / 1024).toFixed(2)} MB`,
  //     external: `${((after.external - before.external) / 1024 / 1024).toFixed(2)} MB`,
  //   };
  // }
  
}
// function item(value: Item, index: number, array: Item[]): void {
//   throw new Error('Function not implemented.');
// }

