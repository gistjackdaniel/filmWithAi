const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

/**
 * 사용자 인증 미들웨어
 * JWT 토큰을 검증하여 사용자 정보를 req.user에 설정
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '액세스 토큰이 필요합니다.' 
      });
    }

    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '유효하지 않은 토큰입니다.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return res.status(403).json({ 
      success: false, 
      message: '토큰이 유효하지 않습니다.' 
    });
  }
};

/**
 * Google OAuth 사용자 생성/로그인
 * POST /api/users/auth/google
 */
router.post('/auth/google', async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;

    // 필수 필드 검증
    if (!googleId || !email || !name) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다.'
      });
    }

    // 기존 사용자 확인
    let user = await User.findByGoogleId(googleId);

    if (user) {
      // 기존 사용자: 마지막 로그인 시간 업데이트
      await user.updateLastLogin();
    } else {
      // 새 사용자: 생성
      user = new User({
        googleId,
        email: email.toLowerCase(),
        name,
        picture
      });
      await user.save();
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id, googleId: user.googleId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        user: {
          id: user._id,
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          picture: user.picture,
          lastLoginAt: user.lastLoginAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Google OAuth 로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 사용자 프로필 조회
 * GET /api/users/profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('projectCount');

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          googleId: user.googleId,
          email: user.email,
          name: user.name,
          picture: user.picture,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          projectCount: user.projectCount
        }
      }
    });

  } catch (error) {
    console.error('프로필 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로필 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 사용자 프로필 업데이트
 * PUT /api/users/profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, picture } = req.body;
    const updateData = {};

    // 업데이트할 필드만 설정
    if (name) updateData.name = name;
    if (picture) updateData.picture = picture;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '업데이트할 정보가 없습니다.'
      });
    }

    const updatedUser = await req.user.updateProfile(updateData);

    res.status(200).json({
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data: {
        user: {
          id: updatedUser._id,
          googleId: updatedUser.googleId,
          email: updatedUser.email,
          name: updatedUser.name,
          picture: updatedUser.picture,
          lastLoginAt: updatedUser.lastLoginAt
        }
      }
    });

  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 사용자 계정 비활성화
 * DELETE /api/users/profile
 */
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    // 소프트 삭제: 계정을 비활성화
    req.user.isActive = false;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: '계정이 비활성화되었습니다.'
    });

  } catch (error) {
    console.error('계정 비활성화 오류:', error);
    res.status(500).json({
      success: false,
      message: '계정 비활성화 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 토큰 검증
 * GET /api/users/verify
 */
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: '토큰이 유효합니다.',
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name
        }
      }
    });

  } catch (error) {
    console.error('토큰 검증 오류:', error);
    res.status(500).json({
      success: false,
      message: '토큰 검증 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 