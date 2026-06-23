const express = require('express');
const router = express.Router();
const optionalAuth = require('../middleware/optionalAuth');
const { addReview, getReviewsByProduct } = require('../controllers/reviewController');

// POST /api/reviews 
router.post('/',optionalAuth, addReview);

// GET /api/reviews/:productId 
router.get('/:productId', getReviewsByProduct);

module.exports = router;
