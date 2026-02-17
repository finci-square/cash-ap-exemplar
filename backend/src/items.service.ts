import { Item } from './models';
import demoItems from './demo-items.json';

export class ItemsService {
  /**
   * Get all available items
   */
  getAllItems(): Item[] {
    return demoItems as Item[];
  }
}

// Export singleton instance
export const itemsService = new ItemsService();
