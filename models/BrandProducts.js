const mongoose = require('mongoose');

const brandProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: [{ type: String }],
  colors: [{ type: String }],
  category: { type: String },
  isNewProducts: { type: Boolean },
  isPopular: { type: Boolean },
  visible: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('BrandProducts', brandProductSchema);
