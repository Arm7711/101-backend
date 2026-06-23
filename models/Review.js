const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    userId: { type: String },    
    guestId: { type: String },     
    username: { type: String, default: 'Anonymous' },
    rating: { type: Number, required: true },
    message: { type: String},
    date: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
