const Review = require('../models/Review');

exports.addReview = async (req, res) => {
    try {
        const { productId, username, rating, message, guestId } = req.body;
        const userId = req?.userId;
        // console.log(userId,'id');
        // console.log(guestId,'guestid');
        
        if (!productId || rating == null) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        
        let existingReview;
        if (userId) {            
            existingReview = await Review.findOne({ productId, userId });
        }
        
        if (!existingReview && guestId) {
            existingReview = await Review.findOne({ productId, guestId });
        }

        if (existingReview) {
            return res.status(400).json({ statusM: 111, error: 'You already reviewed this product' });
        }

        const review = new Review({
            productId,
            userId: userId || null,
            guestId: guestId || null,
            username,
            rating,
            message,
            date: new Date().toLocaleDateString()
        });

        await review.save();
        res.status(201).json({ success: true, review });

    } catch (err) {
        // // console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
