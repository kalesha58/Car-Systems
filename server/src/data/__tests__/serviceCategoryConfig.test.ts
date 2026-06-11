import { SERVICE_SECTIONS } from '../serviceCategoryConfig';

describe('serviceCategoryConfig battery section', () => {
  it('defines three battery service subcategories', () => {
    const batterySection = SERVICE_SECTIONS.find((section) => section.id === 'battery-service');
    expect(batterySection).toBeDefined();
    expect(batterySection?.subcategories.map((item) => item.id)).toEqual([
      'battery_starting',
      'battery_charging',
      'battery_replacement',
    ]);
  });
});
