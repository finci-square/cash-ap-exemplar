import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { ItemsService } from '../items.service';
import { Item } from '../models';

// Route types
export interface GetItemsRoute extends RouteGenericInterface {
  Reply: {
    items?: Item[];
    error?: {
      message: string;
    };
  };
}

export class ItemsHandlers {
  private itemsService: ItemsService;

  constructor(itemsService: ItemsService) {
    this.itemsService = itemsService;
  }

  async getAllItems(
    request: FastifyRequest<GetItemsRoute>,
    reply: FastifyReply<GetItemsRoute>
  ) {
    const items = this.itemsService.getAllItems();
    return { items };
  }
}
