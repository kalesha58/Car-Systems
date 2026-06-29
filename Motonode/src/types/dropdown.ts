export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownResponse {
  vehicleTypes: DropdownOption[];
  brands: DropdownOption[];
  models: DropdownOption[];
  availability: DropdownOption[];
  fuelTypes: DropdownOption[];
  transmission: DropdownOption[];
  condition: DropdownOption[];
  businessTypes: DropdownOption[];
  categories: DropdownOption[];
  batteryTypes: DropdownOption[];
  productBrands: DropdownOption[];
}

export interface DropdownApiResponse {
  success?: boolean;
  Response: DropdownResponse;
}
