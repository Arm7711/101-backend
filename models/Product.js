const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true },
  external_id: String,
  is_ignored: Boolean,
  name: String,
  synced: Number,
  thumbnail_url: String,
  variants: Number,

  title: String,
  price: Number,
  image: [String],
  colors: [String],
  category: String,
  isNewProducts: Boolean,
  isPopular: Boolean,
  visible: Boolean,
  order: Number,
  description: String,

  printfulData: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('Product', productSchema);
