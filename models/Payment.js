const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  orderID: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
  details: { type: Schema.Types.Mixed }, 
});

module.exports = mongoose.model('Payment', paymentSchema);
