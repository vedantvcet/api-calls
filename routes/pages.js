const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

router.get('/reset-password', (req, res) => {
  const { token } = req.query;
  res.render('reset-password', { token });
});

router.get('/dashboard', authenticateToken, (req, res) => {
  res.render('dashboard', { user: req.user });
});

module.exports = router;