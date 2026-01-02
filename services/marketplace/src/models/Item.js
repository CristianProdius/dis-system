const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['asset', 'innovation', 'service', 'knowledge'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'BTC', 'GOLD'],
    default: 'USD',
  },
  sellerId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'reserved'],
    default: 'available',
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ price: 1 });
itemSchema.index({ sellerId: 1 });

module.exports = mongoose.model('Item', itemSchema);
