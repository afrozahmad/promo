import { Cart, Item, RuleValue } from '../interfaces/cart.interface';

import { Engine } from 'json-rules-engine';
import * as fs from 'fs-extra';
import { join } from 'path';

const engine = new Engine();
const promos = [];
// Define custom operators
engine.addOperator('>=', (filteredList: Item[], factValue: number) => {
  let count = 0;
  filteredList.forEach(item => {
    count += item.quantity;
  });
  return count >= factValue;
});

engine.addOperator('in', (factValue: any[], ruleValue: { attribute: string; values: string[] }) => {
  const matchedItems = factValue.filter(item => ruleValue.values.includes(item[ruleValue.attribute]));
  return matchedItems.length > 0;
});

// Load rules from a JSON file
const rulesFilePath = join(__dirname, '..', 'rules.json'); // Adjust the path as necessary
const rules = fs.readJSONSync('rules.json');

rules.forEach(rule => {
  engine.addRule(rule);
  promos.push(rule);
});

// Export the configured engine
export {engine, promos};
