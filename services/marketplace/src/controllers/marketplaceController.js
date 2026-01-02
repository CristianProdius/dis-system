const marketplaceService = require('../services/marketplaceService');

class MarketplaceController {
  async listItems(req, res) {
    try {
      const result = await marketplaceService.listItems(req.query);
      res.json(result);
    } catch (error) {
      console.error('Error listing items:', error);
      res.status(500).json({ error: 'Failed to list items' });
    }
  }

  async getItem(req, res) {
    try {
      const { id } = req.params;
      const item = await marketplaceService.getItem(id);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json(item);
    } catch (error) {
      console.error('Error getting item:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid item ID format' });
      }
      res.status(500).json({ error: 'Failed to get item' });
    }
  }

  async createItem(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      const { name, description, category, price, currency, isPremium, tags } = req.body;

      if (!name || !description || !category || price === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: name, description, category, price'
        });
      }

      const validCategories = ['asset', 'innovation', 'service', 'knowledge'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
        });
      }

      if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
      }

      const item = await marketplaceService.createItem(req.body, userId);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  }

  async purchaseItem(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: 'User ID required' });
      }

      const { itemId } = req.body;
      if (!itemId) {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      const result = await marketplaceService.purchaseItem(itemId, userId);
      res.json(result);
    } catch (error) {
      console.error('Error purchasing item:', error);
      if (error.message === 'Item not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Item is not available for purchase' ||
          error.message === 'Cannot purchase your own item') {
        return res.status(400).json({ error: error.message });
      }
      if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid item ID format' });
      }
      res.status(500).json({ error: 'Failed to purchase item' });
    }
  }
}

module.exports = new MarketplaceController();
