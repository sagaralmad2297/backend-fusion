const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// POST /api/auth/signup - Register a new user
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 400,
        message: 'All fields are required',
      });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        status: 400,
        message: 'User already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      status: 201,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Server error',
    });
  }
});

// POST /api/auth/login - Login a user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        status: 400,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid credentials',
      });
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      status: 200,
      message: 'Login successful',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Server error',
    });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      status: 400,
      message: 'Refresh token is required',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid refresh token',
      });
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      status: 200,
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken, // Returning new refresh token
    });
  } catch (error) {
    res.status(401).json({
      status: 401,
      message: 'Invalid or expired refresh token',
    });
  }
});

// POST /api/auth/forgot-password - Send reset email with only the link
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        status: 400,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'User not found',
      });
    }

    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to proceed:</p>
          <a href="https://fusion-v1-1.vercel.app/reset-password/${resetToken}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                    color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 0.9em;">
            This link will expire in 15 minutes.<br>
            If you didn't request this password reset, you can safely ignore this email.
          </p>
          <hr style="border: 1px solid #ddd;">
          <p style="color: #999; font-size: 0.8em;">
            Sent by Fusion App • 
            <a href="https://fusion-v1-1.vercel.app" style="color: #999;">Visit our website</a>
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      status: 200,
      message: 'Password reset email sent',
    });
  } catch (error) {
    

    res.status(500).json({
      status: 500,
      message: 'Server error',
    });
  }
});

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({
        status: 400,
        message: 'Token and new password are required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid token',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      status: 200,
      message: 'Password reset successful',
    });
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: 'Invalid or expired token',
    });
  }
});

module.exports = router;