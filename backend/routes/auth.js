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
    console.log('Access token length:', access_token ? access_token.length : 0);
    
    if (!access_token) {
      console.log('Error: Access token is missing');
      return res.status(400).json({ 
        success: false,
        message: '필수 정보가 누락되었습니다.',
        error: 'Access token is required' 
      });
    }

    // Google 사용자 정보 가져오기 (access_token 직접 사용)
    console.log('Attempting to fetch user info from Google...');
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    console.log('Google user info response status:', userInfoResponse.status);
    const userInfo = userInfoResponse.data;
    console.log('User info received:', { 
      id: userInfo.id, 
      email: userInfo.email, 
      name: userInfo.name 
    });

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

    console.log('JWT token generated successfully');
    res.json({
      success: true,
      token,
      user
    });

  } catch (error) {
    console.error('Google OAuth error:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    
    res.status(500).json({ 
      success: false,
      message: 'Google OAuth 인증에 실패했습니다.',
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

/**
 * Google Cloud 인증 토큰 제공
 * Veo3 API 사용을 위한 인증 토큰을 클라이언트에 제공
 */
router.get('/google-cloud-token', async (req, res) => {
  try {
    // Google Cloud 서비스 계정 키를 사용한 인증
    const { GoogleAuth } = require('google-auth-library')
    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_CLOUD_KEY_FILE || './google-cloud-key.json',
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    })

    const client = await auth.getClient()
    const token = await client.getAccessToken()

    res.json({
      success: true,
      token: token.token,
      expiresAt: token.expiry_date
    })

  } catch (error) {
    console.error('Google Cloud 인증 오류:', error)
    res.status(500).json({
      success: false,
      error: 'Google Cloud 인증에 실패했습니다.',
      details: error.message
    })
  }
})

module.exports = router; 