import { VEHICLES, type Vehicle } from '@data/mockData';

export type { Vehicle };

export async function getVehicles(): Promise<Vehicle[]> {
  return VEHICLES;
}

export async function getVehicleById(id: string): Promise<Vehicle | undefined> {
  return VEHICLES.find(v => v.id === id);
}
