const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  items: [
    {
      productId: { type: String, required: true },
      quantity: { type: Number, required: true },
      size: { type: String, required: true },
      title: { type: String, required: true },
      price: { type: Number, required: true },
      image: [{ type: String }],
    }
  ],
  totalPrice: { type: Number, required: true },
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
