export interface Item {
    category: string; id: string; quantity: number, total: number
};
export interface Cart {
    items: Item[];
    total: number;
};
export interface RuleValue {
    attribute: string;
    values: string[];
}