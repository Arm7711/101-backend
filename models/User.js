const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  printfulId: String,
  name: String,
  quantity: Number,
  price: Number,
  product: { type: Schema.Types.Mixed },
  files: [{ type: Schema.Types.Mixed }],
  options: [{ type: Schema.Types.Mixed }]
}, { _id: false });

const userOrderSchema = new Schema({
  orderId: Number,
  status: String,
  created: Number,
  items: [orderItemSchema],
  shipping: { type: Schema.Types.Mixed },
  recipient: { type: Schema.Types.Mixed },
  costs: { type: Schema.Types.Mixed },
}, { _id: false });

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerified: { type: Boolean, default: false },
  emailVerificationExpire: Date,
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  cart: [
    {
      productId: { type: String },
      quantity: { type: Number, default: 1 },
      size: { type: String },
      title: { type: String },
      price: { type: Number },
      image: [{ type: String }],
    }
  ],
  userOrders: [
    {
      type: Schema.Types.Mixed
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
