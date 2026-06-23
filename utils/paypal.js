const axios = require('axios');

const PAYPAL_API = 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  throw new Error('PayPal credentials missing!');
}

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  const { data } = await axios.post(`${PAYPAL_API}/v1/oauth2/token`, params, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return data.access_token;
}

async function verifyOrder(orderID) {
  if (!orderID) throw new Error('orderID is required');

  const token = await getAccessToken();

  const { data } = await axios.get(`${PAYPAL_API}/v2/checkout/orders/${orderID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

module.exports = { verifyOrder };
