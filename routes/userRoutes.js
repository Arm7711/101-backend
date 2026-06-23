const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Payment = require('../models/Payment');

router.get('/cart', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('cart.product');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/payments', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/checkId', auth, async (req, res) => {
  try {
    const targetId = '6922ef2d8728f97c37f9c8a2';

    if (req.userId === targetId) {
      return res.json({ userId: req.userId });
    }

    return res.status(204).send(); // 204 No Content
  } catch (err) {
    return res.status(204).send();
  }
});
// router.get('/userOrders', auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.userId);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     res.json(user.userOrders);
//   } catch (err) {
//     res.status(500).json({ message: 'Server error' });
//   }
// });


router.post('/userOrders', auth, async (req, res) => {
  try {
    const { printfulOrder } = req.body;
    console.log(req.body, 'req body');
    console.log(printfulOrder, 'req body');


    if (!printfulOrder || !Array.isArray(printfulOrder) || printfulOrder.length === 0) {
      return res.status(400).json({ message: 'No printfulOrder provided' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.userOrders.push({ printfulOrder });

    user.cart = [];

    await user.save();

    res.json({ message: 'Order added successfully', printfulOrder });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/userOrders', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user.userOrders); 
  } catch (err) {
    // console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
