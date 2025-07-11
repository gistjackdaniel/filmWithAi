const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const router = express.Router();

// JWT 시크릿 키 (실제 프로덕션에서는 환경변수로 관리)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Google OAuth 로그인 처리
 * POST /api/auth/google
 */
router.post('/google', async (req, res) => {
  try {
    const { access_token } = req.body;
    
    console.log('Received request body:', req.body);
    console.log('Access token present:', !!access_token);
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Google 사용자 정보 가져오기 (access_token 직접 사용)
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const userInfo = userInfoResponse.data;

    // 사용자 정보 생성
    const user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name
    };

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Google OAuth authentication failed',
      details: error.response?.data || error.message
    });
  }
});

/**
 * 현재 사용자 정보 조회
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    
    // JWT 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 실제로는 데이터베이스에서 사용자 정보를 조회해야 함
    // 현재는 토큰에서 추출한 정보를 반환
    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || 'User',
      picture: decoded.picture
    };

    res.json({ user });

  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/**
 * 토큰 갱신
 * POST /api/auth/refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // 기존 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 새 토큰 생성
    const newToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token: newToken });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router; 