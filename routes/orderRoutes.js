const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

router.post('/create', async (req, res) => {
  try {
    const { items, userId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalPrice = 0;

    const populatedItems = await Promise.all(
      items.map(async i => {
        const product = await Product.findOne({ externalId: i.productId });

        if (!product) {
          throw new Error(`Product not found in DB for externalId ${i.productId}`);
        }

        totalPrice += i.price * i.quantity;

        return {
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          title: i.title,
          price: i.price,
          image: i.image,
        };
      })
    );

    const order = new Order({
      userId: userId || null,
      items: populatedItems,
      totalPrice,
      status: 'pending',
    });

    await order.save();

    res.json({ success: true, orderId: order._id });
  } catch (err) {
    res.status(500).json({ message: 'Error creating order', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId', 'title price images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching order', error: err.message });
  }
});

module.exports = router;
