const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  buyerId: {
    type: String,
    required: true,
  },
  sellerId: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'BTC', 'GOLD'],
    required: true,
  },
  type: {
    type: String,
    enum: ['purchase', 'investment', 'trade'],
    default: 'purchase',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

transactionSchema.index({ buyerId: 1 });
transactionSchema.index({ sellerId: 1 });
transactionSchema.index({ itemId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
