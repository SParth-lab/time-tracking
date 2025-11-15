const User = require('../models/User');
const { generateToken, generateResetToken } = require('../utils/tokenUtils');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, mobile, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !mobile || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      mobile,
      email,
      passwordHash: password, // Will be hashed by pre-save hook
    });

    // Generate token
    const token = generateToken(user._id);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.email}`);

    // Remove password from output
    user.passwordHash = undefined;

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Master password login (admin feature)
// @route   POST /api/auth/master-login
// @access  Public
exports.masterLogin = async (req, res, next) => {
  try {
    const { email, masterPassword } = req.body;

    // Validation
    if (!email || !masterPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and master password',
      });
    }

    // Check master password
    if (masterPassword !== process.env.MASTER_PASSWORD) {
      logger.warn(`Failed master login attempt for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid master password',
      });
    }

    // Check for user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    logger.info(`Master login successful for: ${user.email}`);

    res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiry (10 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    logger.info(`Password reset requested for: ${user.email}`);

    // In production, send email here
    // For now, return the token in response (development only)
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Hash token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Set new password
    user.passwordHash = password; // Will be hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    logger.info(`Password reset successful for: ${user.email}`);

    res.status(200).json({
      success: true,
      token,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Set new password
    user.passwordHash = newPassword;
    await user.save();

    const token = generateToken(user._id);

    logger.info(`Password updated for: ${user.email}`);

    res.status(200).json({
      success: true,
      token,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

