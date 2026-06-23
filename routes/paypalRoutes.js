const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const { verifyOrder } = require('../utils/paypal');

router.post('/verify', async (req, res) => {
  const { orderID } = req.body;
  if (!orderID) return res.status(400).json({ error: 'orderID is required' });

  try {
    const order = await verifyOrder(orderID);

    if (order.status === 'COMPLETED') {
      const existingPayment = await Payment.findOne({ orderID });
      if (existingPayment) {
        return res.json({ success: true, message: 'Payment already recorded', payment: existingPayment });
      }

      const payment = new Payment({
        orderID,
        amount: parseFloat(order.purchase_units[0].amount.value),
        currency: order.purchase_units[0].amount.currency_code,
        status: order.status,
        details: order,
      });

      await payment.save();

      return res.json({ success: true, payment });
    } else {
      return res.status(400).json({ success: false, message: 'Order not completed', order });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Error Payment' });
  }
});

module.exports = router;
