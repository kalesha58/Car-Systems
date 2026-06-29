import { SERVICES, type Service } from '@data/mockData';

export type { Service };

export async function getServices(): Promise<Service[]> {
  return SERVICES;
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  return SERVICES.find(s => s.id === id);
}
