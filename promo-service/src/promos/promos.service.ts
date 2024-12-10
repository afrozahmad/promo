import { Injectable , Inject } from '@nestjs/common';
// import {engine, promos} from '../rules/engine';
import { calculateMemoryUsage } from 'src/utils/memory.utils';
import { Cart, Item } from '../interfaces/cart.interface';
import { Engine } from 'json-rules-engine';
import * as fs from 'fs-extra';

@Injectable()
export class PromoService {
  private engine: Engine;
  private rules: any[]; // Local storage for rules

  constructor() {

    // this.engine = new Engine();
    // this.rules = [];
    // const initialMemory = process.memoryUsage();
    

    // this.engine.addOperator('>=', ( filteredList: Item[], factValue: number) => {
    //   if (!factValue ||  !Array.isArray(filteredList) ){
    //     throw new Error('filteredList shold be array.');
    //   }
    //   let count: number=0;
    //   filteredList.forEach(item=> {
    //       count += item.quantity;
    //   });

    
    //   // Return boolean for rule evaluation
    //   return count >= factValue;
    // });

    // this.engine.addOperator('in', (factValue: any[], ruleValue: { attribute: string; values: string[] }) => {
    //   if (!ruleValue || !ruleValue.attribute || !Array.isArray(ruleValue.values)) {
    //     throw new Error('Rule value must include "attribute" and "values" array.');
    //   }
    
    //   // Find matched items
    //   const matchedItems = factValue.filter(item => ruleValue.values.includes(item[ruleValue.attribute]));
    
    //   // Return boolean for rule evaluation
    //   return matchedItems.length > 0;
    // });


  
    // // Load rules from rules.json on startup
    // const rules = fs.readJSONSync('./rules.json');
    // rules.forEach((rule) => {
    //     this.rules.push(rule); // Add to local rules array
    //     this.engine.addRule(rule)
    // });
    // const finalMemory = process.memoryUsage();
    // console.log('Memory usage after loading rules:', calculateMemoryUsage(initialMemory, finalMemory));
  

  }
  /**
   * Evaluates
   */
  
  async getPromos(){
    return this.rules;
  }
  /**
   * Evaluates the given cart against the rules configured in the engine.
   * @param cart - The cart to evaluate.
   * @returns The evaluation results, including any triggered events and the updated cart.
   */
  async evaluateResults(result, updatedCart: Cart): Promise<{ updatedCart: Cart; events: any[] }> {
    
    

    // // Clone the cart to avoid modifying the original
    // const updatedCart = { ...facts.cart };
    // const flattenedCart = this.flatten(updatedCart);
    // // facts.cart = updatedCart;
    // const result = await this.engine.run({ facts });
    result.results.forEach(ruleResult => {
      const {  type, params } = ruleResult.event;

      if (params['level'] === 'orderLevelDiscount') {
        this.applyOrderLevelDiscount(updatedCart, params);
      } else if (params['level'] === 'itemLevelDiscount') {
        this.applyItemLevelDiscount3(updatedCart, ruleResult);
      }
    });

    return { updatedCart, events: result.events };
  }

  /**
   * Applies order-level discounts (e.g., percentage off the total, free shipping).
   * @param cart - The cart to update.
   * @param params - Parameters for the discount action.
   */
  private applyOrderLevelDiscount(updatedCart: Cart, params: any): void {
    const { action, target, value } = params;
    switch (action) {
      case 'percentOff':
        updatedCart[target.split('.')[1]] *= (1 - value / 100);
        break;

      case 'dollarOff':
        updatedCart[target.split('.')[1]] -= value;
        break;

      case 'freeShipping':
        updatedCart[target.split('.')[1]] = 0;
        break;
      
      default:
        break;
    }
 
  }

  /**
   * Applies item-level discounts (e.g., percentage off specific items).
   * @param cart - The cart to update.
   * @param ruleResult - The result of the rule evaluation.
   */
  private applyItemLevelDiscount(cart: Cart, ruleResult: any): void {
    
    
    
    const { action, target, value } = ruleResult.event.params;
    if ('all' in ruleResult.conditions && 'factResult' in ruleResult.conditions['all'][0]){
      const factResult: unknown = ruleResult.conditions['all'][0].factResult;
      const matchedItems = Array.isArray(factResult) ? (factResult as Item[]) : [];
      if (Array.isArray(matchedItems)) {
        matchedItems.forEach(item => {
          switch (action) {
            case 'percentOff': 
            
            // neet to find total . what if items have different skus. should not matter 
            //should ideally prorate based on quanity ((qualtity/total)* total_qty * ruleResult.event?.params.value)
            //
              
              item[target.split('.')[1]] *= (1 - ruleResult.event?.params.value / 100);
              break;
      
            case 'dollarOff':
              //should ideally prorate based on quanity (qualtity/total) * total_qty * ruleResult.event?.params.value
              item[target.split('.')[1]] -= ruleResult.event?.params.value;
              break;
            case 'percentOff_bogo':
              //valuue : range = 0% - 100% - if 100 means free.
              //logic: looks at number of items. divides by two and gives the percent off to those
              //eg. quantity 3 => 3/2 = 1 - so one item gets bogo discount
              // quantity 3 => 5/2 = 2 - so 2 item gets bogo discount
              let countOfItemstoDiscount: number =  Math.floor(matchedItems.length/2);
              for (let i:number = 1; i <= countOfItemstoDiscount; i++) {
                
              }
              break;

            case 'percentOff_bogo':
                //valuue :  if value > item total or if value = -1, total becomes 0
                //logic: looks at number of items. divides by two and gives the percent off to those
                //eg. quantity 3 => 3/2 = 1 - so one item gets bogo discount
                // quantity 3 => 5/2 = 2 - so 2 item gets bogo discount
                break;
            default: 
                break;
          }
        });
      }
      
    }
    

  }
  public flatten(cart:Cart) {
    cart.items.forEach(item => {
      if (item.quantity>1){
        let priceArray:number[] =  this.distributeTotal(item.total, item.quantity);
        item.total =priceArray[0];
        let q:number = item.quantity-1;
        item.quantity = 1;
        let priceIndex:number=1;
        while (q>0){
          const newItem = { ...item };
          newItem.total = priceArray[priceIndex++];
          cart.items.push(newItem);
          q--;
        }

      }

    });
    return cart;
  }

  private  distributeTotal(total, numParts) {
    // Step 1: Calculate the base value for each part
    let baseValue = total / numParts;
  
    // Step 2: Round the base value to two decimal places
    baseValue = Math.round(baseValue * 100) / 100;
  
    // Step 3: Calculate the total sum of base values
    let sum = baseValue * numParts;
  
    // Step 4: Find the difference between the total and the sum
    let difference =  total - sum;
    difference = Number(difference.toFixed(2)); // Rounds to 2 decimal places

  
    // Step 5: Create an array of the base values
    let result = new Array(numParts).fill(baseValue);
  
    // Step 6: Distribute the difference across the parts to make sure no part is more than 1 cent apart
    let i = 0;
    // Distribute the difference, ensuring it's distributed even if the difference is exactly 0.01
    while (Math.abs(difference) > 0) {
      // Distribute the remainder (difference)
      if (difference > 0) {
        result[i] += 0.01;  // Add 0.01 to a part
        difference -= 0.01;  // Decrease the difference
      } else if (difference < 0) {
        result[i] -= 0.01;  // Subtract 0.01 from a part
        difference += 0.01;  // Increase the difference
      }
  
      // Move to the next part (to distribute the rounding)
      i = (i + 1) % numParts;
    }
  
    // Step 7: Return the result
    return result;
  }
  private applyItemLevelDiscount3(cart: Cart, ruleResult: any): void {
    
    
    
    const { action, target, value } = ruleResult.event.params;
    if ('all' in ruleResult.conditions && 'factResult' in ruleResult.conditions['all'][0]){
      const factResult: unknown = ruleResult.conditions['all'][0].factResult;
      const matchedItems = Array.isArray(factResult) ? (factResult as Item[]) : [];
      if (!Array.isArray(matchedItems)){
        return;
      }
      switch (action) {
        case 'percentOff': 
          matchedItems.forEach(item => {
            // since it is all quantity 1, it is matter 
            //of going through each item and applying the action
            item[target.split('.')[1]] *= (1 - ruleResult.event?.params.value / 100);
          });
          break;
        case 'dollarOff':
          matchedItems.forEach(item => {
            //should ideally prorate based on quanity (qualtity/total) * total_qty * ruleResult.event?.params.value
            item[target.split('.')[1]] -= ruleResult.event?.params.value;
          });
          break;
        case 'bogN_dollarOff':
            //valuue : range = 0% - 100% - if 100 means free.
            //logic: looks at number of items. divides by two and gives the percent off to those
            //eg. quantity 3 => 3/2 = 1 - so one item gets bogo discount
            // quantity 3 => 5/2 = 2 - so 2 item gets bogo discount
            let countOfItemstoDiscount: number =  Math.floor(matchedItems.length/2);
            for (let i:number = 0; i < countOfItemstoDiscount; i++) {
              matchedItems[i][target.split('.')[1]]  -= ruleResult.event?.params.value;
            }
          break;
        case 'bogN_percentOff':
          //valuue : range = 0% - 100% - if 100 means free.
          //logic: looks at number of items. divides by two and gives the percent off to those
          //eg. quantity 3 => 3/2 = 1 - so one item gets bogo discount
          // quantity 3 => 5/2 = 2 - so 2 item gets bogo discount
          let countOfItemstoPercentDiscount: number =  Math.floor(matchedItems.length/2);
          for (let i:number = 0; i < countOfItemstoPercentDiscount; i++) {
            matchedItems[i][target.split('.')[1]] *= (1 - ruleResult.event?.params.value / 100);
          }
          break;
        case 'gwp':
          const item: Item = {
            category: "gwp",
            id: target,
            quantity: 1,
            total: 0
          };
          cart.items.push(item);
          break;

      } 
    
    }
  

 

  }  
  
}


