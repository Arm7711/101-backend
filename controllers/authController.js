const TempUser = require('../models/TempUser');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const RefreshToken = require('../models/RefreshToken');


exports.register = async (req, res) => {
  let { username, email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }
  if (!username || username.trim() === '') {
    username = email.split('@')[0];
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userWithUsername = await User.findOne({ username });
    if (userWithUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    const tempUser = await TempUser.findOne({ email });

    const hashedPassword = await bcrypt.hash(password, 12);


    const rawVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedVerificationCode = crypto.createHash('sha256').update(rawVerificationCode).digest('hex');

    if (tempUser) {
      tempUser.username = username;
      tempUser.password = hashedPassword;
      tempUser.verificationCode = hashedVerificationCode;
      tempUser.codeExpire = Date.now() + 10 * 60 * 1000;
      await tempUser.save();
    } else {
      await new TempUser({
        username,
        email,
        password: hashedPassword,
        verificationCode: hashedVerificationCode,
        codeExpire: Date.now() + 10 * 60 * 1000
      }).save();
    }
    await sendEmail({
      to: email,
      subject: 'Verify your email',
      text: `Your verification code\` <br/> <strong style='padding:7px 15px;border:1px solid white;border-radius:5px;background-color:black;color:white;font-weight:500;font-size:25px;'>${rawVerificationCode}</strong> <br/> (valid 10 minutes)`
    });

    res.json({ message: 'Verification code sent', email });
  } catch (e) {
    // // console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });

  if (!user) return res.status(400).json({ message: 'User not found' });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

  // Access token
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30m' });

  // Refresh token
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '30d' });

  console.log(accessToken, 'accessToken');
  console.log(refreshToken, 'refreshToken');

  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 дней
  });

  // res.cookie('token', accessToken, { httpOnly: true, secure: false, sameSite: 'Lax', maxAge: 15 * 60 * 1000 });
  // res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, sameSite: 'Lax', maxAge: 30 * 24 * 60 * 60 * 1000 });

  res.cookie('token', accessToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 30 * 24 * 60 * 60 * 1000 });

  res.json({ user: { id: user._id, username: user.username, email: user.email } });
};


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Please enter your email' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User with this email not found' });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordToken = crypto.createHash('sha256').update(resetCode).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Code',
      text: `Your code\` <br/> <strong style='padding:7px 15px;border:1px solid white;border-radius:5px;background-color:black;color:white;font-weight:500;font-size:25px;'>${resetCode}</strong><br/> (valid for 10 minutes).`
    });

    return res.json({ message: 'Reset code has been sent to your email' });

  } catch (error) {
    console.error('Error sending reset code:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.resetPassword = async (req, res) => {
  const { code, password } = req.body;
  if (!code || !password) return res.status(400).json({ message: 'Please provide the code and new password' });

  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password has been successfully changed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

  try {
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const tempUser = await TempUser.findOne({ email, verificationCode: hashedCode });
    if (!tempUser) return res.status(400).json({ message: 'Invalid or expired code' });

    if (tempUser.codeExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    const newUser = new User({
      username: tempUser.username,
      email: tempUser.email,
      password: tempUser.password,
      emailVerified: true
    });

    await newUser.save();
    await TempUser.deleteOne({ email });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '30min' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      // secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000,
    });

    res.json({
      message: 'Email verified successfully',
      user: { id: newUser._id, username: newUser.username, email: newUser.email }
    });
  } catch (err) {
    // // console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.deleteUserByEmail = async (req, res) => {
  const email = req.query.email;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOneAndDelete({ email });
    const tempUser = await TempUser.findOneAndDelete({ email });

    if (!user && !tempUser) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    // // console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken; 
  if (!refreshToken) {
    // Пользователь гость
    return res.status(200).json({ guest: true });
  }

  const savedToken = await RefreshToken.findOne({ token: refreshToken });
  if (!savedToken) return res.status(401).json({ message: 'Invalid refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: '30min' }
    );

    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 10 * 60 * 1000
    });

    res.json({ accessToken: newAccessToken, guest: false });
  } catch (err) {
    await RefreshToken.deleteOne({ token: refreshToken });
    res.status(401).json({ guest: true });
  }
};

