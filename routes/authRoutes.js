const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const RefreshToken = require('../models/RefreshToken');
const rateLimit = require('express-rate-limit');

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  deleteUserByEmail,
  refresh
} = require('../controllers/authController');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  message: { message: 'Too many login attempts, please try again later.' },
});

// Маршруты
router.post('/refresh', refresh);
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', loginLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', loginLimiter, verifyEmail);
router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/'
  };

  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);

  res.json({ message: 'Logged out successfully' });
});


router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/delete', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
    const tempUser = await TempUser.findOneAndDelete({ _id: req.userId });
    if (!user && !tempUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
