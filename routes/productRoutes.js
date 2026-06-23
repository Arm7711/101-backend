const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

const multer = require('multer');
const upload = multer();

const {
  addProduct,
  getProducts,
  addToFavorites,
  removeFromFavorites,
  addToCart,
  removeFromCart,
  getCart,
  getBrandProducts,
  deleteProduct
} = require('../controllers/productController');

router.post('/', upload.array('images'), addProduct);
router.get('/', getProducts);
router.delete('/:id(\\d+)', deleteProduct);

router.post('/favorites', auth, addToFavorites);
router.delete('/favorites', auth, removeFromFavorites);

router.post('/cart', auth, addToCart);
router.delete('/cart', auth, removeFromCart);
router.get('/cart', auth, getCart);
router.get('/brand', getBrandProducts);


module.exports = router;
