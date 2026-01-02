const Item = require('../models/Item');
const Transaction = require('../models/Transaction');

class MarketplaceService {
  async listItems(filters = {}) {
    const query = {};

    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.status) {
      query.status = filters.status;
    } else {
      query.status = 'available';
    }
    if (filters.currency) {
      query.currency = filters.currency;
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = parseFloat(filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = parseFloat(filters.maxPrice);
      }
    }
    if (filters.sellerId) {
      query.sellerId = filters.sellerId;
    }
    if (filters.isPremium !== undefined) {
      query.isPremium = filters.isPremium === 'true';
    }

    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Item.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getItem(id) {
    const item = await Item.findById(id).lean();
    if (!item) {
      return null;
    }

    const transactions = await Transaction.find({ itemId: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return {
      ...item,
      transactionHistory: transactions,
    };
  }

  async createItem(data, sellerId) {
    const item = new Item({
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      currency: data.currency || 'USD',
      sellerId,
      isPremium: data.isPremium || false,
      tags: data.tags || [],
    });

    await item.save();
    return item.toObject();
  }

  async purchaseItem(itemId, buyerId) {
    const item = await Item.findById(itemId);

    if (!item) {
      throw new Error('Item not found');
    }

    if (item.status !== 'available') {
      throw new Error('Item is not available for purchase');
    }

    if (item.sellerId === buyerId) {
      throw new Error('Cannot purchase your own item');
    }

    const transaction = new Transaction({
      itemId: item._id,
      buyerId,
      sellerId: item.sellerId,
      price: item.price,
      currency: item.currency,
      type: 'purchase',
      status: 'completed',
    });

    item.status = 'sold';

    await Promise.all([
      transaction.save(),
      item.save(),
    ]);

    return {
      transaction: transaction.toObject(),
      item: item.toObject(),
    };
  }
}

module.exports = new MarketplaceService();
