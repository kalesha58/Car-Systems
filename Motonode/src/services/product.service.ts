import { PRODUCTS, type Product } from '@data/mockData';

export type { Product };

export async function getProducts(): Promise<Product[]> {
  return PRODUCTS;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return PRODUCTS.find(p => p.id === id);
}
