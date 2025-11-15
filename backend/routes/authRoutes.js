const express = require('express');
const {
  register,
  login,
  masterLogin,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/master-login', masterLogin);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.put('/update-password', protect, updatePassword);

module.exports = router;

