const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendResetEmail } = require('../utils/emailService');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.redirect('/login?registered=true');
  } catch (err) {
    res.render('register', { error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');
  } catch (err) {
    res.render('login', { error: 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.render('forgot-password', { error: 'Email not found' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
    
    try {
      await sendResetEmail(email, resetLink);
      res.render('forgot-password', { 
        message: 'Reset link sent to your email. Check the console for the preview URL.' 
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.render('forgot-password', { 
        error: 'Failed to send reset email. Please try again later.' 
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.render('forgot-password', { 
      error: 'An error occurred. Please try again later.' 
    });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.render('reset-password', { 
        error: 'Invalid request. Missing token or password.',
        token: token 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.render('reset-password', { 
        error: 'Invalid or expired reset link',
        token: token 
      });
    }

    user.password = password;
    await user.save();

    res.redirect('/login?reset=true');
  } catch (err) {
    console.error('Reset password error:', err);
    res.render('reset-password', { 
      error: 'Password reset failed. The link may be expired.',
      token: req.body.token 
    });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

module.exports = router;