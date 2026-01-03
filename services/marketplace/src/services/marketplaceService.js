const Item = require('../models/Item');
const Transaction = require('../models/Transaction');

class MarketplaceService {
  async listItems(filters = {}) {
    const query = {};

    if (filters.category) {
      query.category = filters.category;
    }
    // Only filter by status if explicitly provided (allows fetching all items)
    if (filters.status) {
      query.status = filters.status;
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
    // First check if buyer is trying to buy their own item
    const itemCheck = await Item.findById(itemId).lean();
    if (!itemCheck) {
      throw new Error('Item not found');
    }
    if (itemCheck.sellerId === buyerId) {
      throw new Error('Cannot purchase your own item');
    }

    // Atomic update - only succeeds if status is still 'available'
    // This prevents race conditions when multiple agents try to buy same item
    const item = await Item.findOneAndUpdate(
      { _id: itemId, status: 'available' },
      { status: 'sold' },
      { new: true }
    );

    if (!item) {
      throw new Error('Item is not available for purchase (already sold)');
    }

    // Create transaction record
    const transaction = new Transaction({
      itemId: item._id,
      buyerId,
      sellerId: item.sellerId,
      price: item.price,
      currency: item.currency,
      type: 'purchase',
      status: 'completed',
    });

    await transaction.save();

    return {
      transaction: transaction.toObject(),
      item: item.toObject(),
    };
  }
}

module.exports = new MarketplaceService();
