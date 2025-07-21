const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const LocationGroup = require('../models/LocationGroup');
const RealLocation = require('../models/VirtualLocation'); // 파일명은 그대로, 모델명만 변경
const SceneLocationMapping = require('../models/SceneLocationMapping');
const Conte = require('../models/Conte');

// JWT 토큰 검증 미들웨어
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
    const User = require('../models/User');
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
 * LocationGroup CRUD API
 */

// 프로젝트의 모든 LocationGroup 조회
// GET /api/projects/:projectId/location-groups
router.get('/:projectId/location-groups', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const locationGroups = await LocationGroup.findByProject(projectId);
    
    res.status(200).json({
      success: true,
      data: locationGroups
    });
  } catch (error) {
    console.error('LocationGroup 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: 'LocationGroup 조회 중 오류가 발생했습니다.'
    });
  }
});

// LocationGroup 생성
// POST /api/projects/:projectId/location-groups
router.post('/:projectId/location-groups', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const locationGroupData = {
      ...req.body,
      projectId,
      createdBy: req.user.name || 'User'
    };
    
    const locationGroup = new LocationGroup(locationGroupData);
    await locationGroup.save();
    
    res.status(201).json({
      success: true,
      data: locationGroup
    });
  } catch (error) {
    console.error('LocationGroup 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: 'LocationGroup 생성 중 오류가 발생했습니다.'
    });
  }
});

// LocationGroup 수정
// PUT /api/projects/:projectId/location-groups/:groupId
router.put('/:projectId/location-groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { projectId, groupId } = req.params;
    const updateData = {
      ...req.body,
      modifiedBy: req.user.name || 'User'
    };
    
    const locationGroup = await LocationGroup.findOneAndUpdate(
      { _id: groupId, projectId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!locationGroup) {
      return res.status(404).json({
        success: false,
        message: 'LocationGroup을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: locationGroup
    });
  } catch (error) {
    console.error('LocationGroup 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: 'LocationGroup 수정 중 오류가 발생했습니다.'
    });
  }
});

// LocationGroup 삭제 (소프트 삭제)
// DELETE /api/projects/:projectId/location-groups/:groupId
router.delete('/:projectId/location-groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const { projectId, groupId } = req.params;
    
    // 해당 그룹에 속한 VirtualLocation들도 함께 비활성화
    await VirtualLocation.updateMany(
      { locationGroupId: groupId },
      { status: 'archived' }
    );
    
    const locationGroup = await LocationGroup.findOneAndUpdate(
      { _id: groupId, projectId },
      { status: 'archived' },
      { new: true }
    );
    
    if (!locationGroup) {
      return res.status(404).json({
        success: false,
        message: 'LocationGroup을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'LocationGroup이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('LocationGroup 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: 'LocationGroup 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * RealLocation CRUD API
 */

// 프로젝트의 모든 RealLocation 조회
// GET /api/projects/:projectId/real-locations
router.get('/:projectId/real-locations', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const realLocations = await RealLocation.findByProject(projectId);
    
    res.status(200).json({
      success: true,
      data: realLocations
    });
  } catch (error) {
    console.error('RealLocation 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: 'RealLocation 조회 중 오류가 발생했습니다.'
    });
  }
});

// 그룹별 VirtualLocation 조회
// GET /api/projects/:projectId/location-groups/:groupId/virtual-locations
router.get('/:projectId/location-groups/:groupId/virtual-locations', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const virtualLocations = await VirtualLocation.findByGroup(groupId);
    
    res.status(200).json({
      success: true,
      data: virtualLocations
    });
  } catch (error) {
    console.error('그룹별 VirtualLocation 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '그룹별 VirtualLocation 조회 중 오류가 발생했습니다.'
    });
  }
});

// RealLocation 생성
// POST /api/projects/:projectId/real-locations
router.post('/:projectId/real-locations', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const realLocationData = {
      ...req.body,
      projectId,
      createdBy: req.user.name || 'User',
      isAIGenerated: req.body.isAIGenerated || false
    };
    
    const realLocation = new RealLocation(realLocationData);
    await realLocation.save();
    
    res.status(201).json({
      success: true,
      data: realLocation
    });
  } catch (error) {
    console.error('RealLocation 생성 오류:', error);
    console.error('요청 데이터:', req.body);
    console.error('프로젝트 ID:', req.params.projectId);
    res.status(500).json({
      success: false,
      message: 'RealLocation 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// VirtualLocation 생성 (기존 호환성 유지)
// POST /api/projects/:projectId/virtual-locations
router.post('/:projectId/virtual-locations', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const virtualLocationData = {
      ...req.body,
      projectId,
      createdBy: req.user.name || 'User',
      isAIGenerated: false // 사용자 생성
    };
    
    const virtualLocation = new VirtualLocation(virtualLocationData);
    await virtualLocation.save();
    
    res.status(201).json({
      success: true,
      data: virtualLocation
    });
  } catch (error) {
    console.error('VirtualLocation 생성 오류:', error);
    console.error('요청 데이터:', req.body);
    console.error('프로젝트 ID:', req.params.projectId);
    res.status(500).json({
      success: false,
      message: 'VirtualLocation 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// VirtualLocation 수정
// PUT /api/projects/:projectId/virtual-locations/:locationId
router.put('/:projectId/virtual-locations/:locationId', authenticateToken, async (req, res) => {
  try {
    const { projectId, locationId } = req.params;
    const updateData = {
      ...req.body,
      modifiedBy: req.user.name || 'User'
    };
    
    const virtualLocation = await VirtualLocation.findOneAndUpdate(
      { _id: locationId, projectId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!virtualLocation) {
      return res.status(404).json({
        success: false,
        message: 'VirtualLocation을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: virtualLocation
    });
  } catch (error) {
    console.error('VirtualLocation 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: 'VirtualLocation 수정 중 오류가 발생했습니다.'
    });
  }
});

// 콘티의 가상장소 연결 상태 확인
// GET /api/projects/:projectId/contes/:conteId/virtual-location-status
router.get('/:projectId/contes/:conteId/virtual-location-status', authenticateToken, async (req, res) => {
  try {
    const { projectId, conteId } = req.params;
    
    const conte = await Conte.findOne({ _id: conteId, projectId });
    
    if (!conte) {
      return res.status(404).json({
        success: false,
        message: '콘티를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        conteId: conte._id,
        scene: conte.scene,
        title: conte.title,
        virtualLocationId: conte.virtualLocationId,
        location: conte.keywords?.location
      }
    });
  } catch (error) {
    console.error('콘티 가상장소 연결 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '가상장소 연결 상태 확인 중 오류가 발생했습니다.'
    });
  }
});

// 가상장소와 연결된 콘티들 조회
// GET /api/projects/:projectId/virtual-locations/:locationId/connected-contes
router.get('/:projectId/virtual-locations/:locationId/connected-contes', authenticateToken, async (req, res) => {
  try {
    const { projectId, locationId } = req.params;
    
    // 해당 가상장소를 사용하는 모든 콘티 찾기
    const contes = await Conte.find({ 
      projectId, 
      virtualLocationId: locationId 
    }).select('_id scene title keywords.location virtualLocationId');
    
    res.status(200).json({
      success: true,
      data: {
        virtualLocationId: locationId,
        connectedContes: contes,
        count: contes.length
      }
    });
  } catch (error) {
    console.error('가상장소 연결 콘티 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '연결된 콘티 조회 중 오류가 발생했습니다.'
    });
  }
});

// VirtualLocation 수정 시 연결된 콘티들 업데이트
// PUT /api/projects/:projectId/virtual-locations/:locationId/update-contes
router.put('/:projectId/virtual-locations/:locationId/update-contes', authenticateToken, async (req, res) => {
  try {
    const { projectId, locationId } = req.params;
    const { newLocationName } = req.body;
    
    // 해당 가상장소를 사용하는 모든 콘티 찾기
    const contes = await Conte.find({ 
      projectId, 
      virtualLocationId: locationId 
    });
    
    // 각 콘티의 장소 정보 업데이트
    const updatePromises = contes.map(conte => {
      return Conte.findByIdAndUpdate(
        conte._id,
        {
          $set: {
            'keywords.location': newLocationName,
            modifiedBy: req.user.name || 'User'
          }
        },
        { new: true }
      );
    });
    
    const updatedContes = await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: `${updatedContes.length}개 콘티의 장소 정보가 업데이트되었습니다.`,
      data: {
        updatedCount: updatedContes.length,
        contes: updatedContes.map(conte => ({
          _id: conte._id,
          scene: conte.scene,
          title: conte.title,
          location: conte.keywords?.location
        }))
      }
    });
  } catch (error) {
    console.error('가상장소 연결 콘티 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '연결된 콘티 업데이트 중 오류가 발생했습니다.'
    });
  }
});

// VirtualLocation 그룹 할당
// PUT /api/projects/:projectId/virtual-locations/:locationId/assign-group
router.put('/:projectId/virtual-locations/:locationId/assign-group', authenticateToken, async (req, res) => {
  try {
    const { projectId, locationId } = req.params;
    const { groupId } = req.body;
    
    const virtualLocation = await VirtualLocation.findOne({ _id: locationId, projectId });
    
    if (!virtualLocation) {
      return res.status(404).json({
        success: false,
        message: 'VirtualLocation을 찾을 수 없습니다.'
      });
    }
    
    // 새 그룹이 유효한지 확인
    const newGroup = await LocationGroup.findOne({ _id: groupId, projectId });
    if (!newGroup) {
      return res.status(404).json({
        success: false,
        message: '새 LocationGroup을 찾을 수 없습니다.'
      });
    }
    
    await virtualLocation.changeGroup(groupId);
    
    res.status(200).json({
      success: true,
      data: virtualLocation
    });
  } catch (error) {
    console.error('VirtualLocation 그룹 할당 오류:', error);
    res.status(500).json({
      success: false,
      message: 'VirtualLocation 그룹 할당 중 오류가 발생했습니다.'
    });
  }
});

// VirtualLocation 삭제 (소프트 삭제)
// DELETE /api/projects/:projectId/virtual-locations/:locationId
router.delete('/:projectId/virtual-locations/:locationId', authenticateToken, async (req, res) => {
  try {
    const { projectId, locationId } = req.params;
    
    const virtualLocation = await VirtualLocation.findOneAndUpdate(
      { _id: locationId, projectId },
      { status: 'archived' },
      { new: true }
    );
    
    if (!virtualLocation) {
      return res.status(404).json({
        success: false,
        message: 'VirtualLocation을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'VirtualLocation이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('VirtualLocation 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: 'VirtualLocation 삭제 중 오류가 발생했습니다.'
    });
  }
});

/**
 * SceneLocationMapping CRUD API
 */

// 프로젝트의 모든 씬-실제장소 매핑 조회
// GET /api/projects/:projectId/scene-location-mappings
router.get('/:projectId/scene-location-mappings', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const mappings = await SceneLocationMapping.findByProject(projectId);
    
    res.status(200).json({
      success: true,
      data: mappings
    });
  } catch (error) {
    console.error('SceneLocationMapping 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: 'SceneLocationMapping 조회 중 오류가 발생했습니다.'
    });
  }
});

// 특정 씬의 실제장소 조회
// GET /api/projects/:projectId/contes/:conteId/real-location
router.get('/:projectId/contes/:conteId/real-location', authenticateToken, async (req, res) => {
  try {
    const { projectId, conteId } = req.params;
    
    const mapping = await SceneLocationMapping.findByConte(projectId, conteId);
    
    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: '해당 씬의 실제장소 매핑을 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: mapping
    });
  } catch (error) {
    console.error('씬 실제장소 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '씬 실제장소 조회 중 오류가 발생했습니다.'
    });
  }
});

// 씬-실제장소 매핑 생성 또는 업데이트
// POST /api/projects/:projectId/scene-location-mappings
router.post('/:projectId/scene-location-mappings', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { conteId, realLocationId } = req.body;
    
    if (!conteId || !realLocationId) {
      return res.status(400).json({
        success: false,
        message: '씬 ID와 실제장소 ID가 필요합니다.'
      });
    }
    
    const mapping = await SceneLocationMapping.createOrUpdateMapping(projectId, conteId, realLocationId);
    
    res.status(201).json({
      success: true,
      data: mapping
    });
  } catch (error) {
    console.error('SceneLocationMapping 생성/업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: 'SceneLocationMapping 생성/업데이트 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 그룹 할당 관리 API
 */

// 그룹 내 VirtualLocation 순서 변경
// PUT /api/projects/:projectId/location-groups/:groupId/reorder
router.put('/:projectId/location-groups/:groupId/reorder', authenticateToken, async (req, res) => {
  try {
    const { projectId, groupId } = req.params;
    const { locationIds } = req.body; // 순서대로 정렬된 locationId 배열
    
    // 각 VirtualLocation의 order를 업데이트
    const updatePromises = locationIds.map((locationId, index) => {
      return VirtualLocation.findOneAndUpdate(
        { _id: locationId, projectId, locationGroupId: groupId },
        { order: index },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: 'VirtualLocation 순서가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    console.error('VirtualLocation 순서 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: 'VirtualLocation 순서 변경 중 오류가 발생했습니다.'
    });
  }
});

// 콘티에 RealLocation 할당
// PUT /api/projects/:projectId/contes/:conteId/assign-location
router.put('/:projectId/contes/:conteId/assign-location', authenticateToken, async (req, res) => {
  try {
    const { projectId, conteId } = req.params;
    const { realLocationId } = req.body;
    
    // 콘티 찾기
    const conte = await Conte.findOne({ _id: conteId, projectId });
    if (!conte) {
      return res.status(404).json({
        success: false,
        message: '콘티를 찾을 수 없습니다.'
      });
    }
    
    // 실제장소가 제공된 경우 유효성 검사 (빈 문자열이나 null이 아닌 경우)
    if (realLocationId && realLocationId.trim() !== '') {
      const realLocation = await RealLocation.findOne({ _id: realLocationId, projectId });
      if (!realLocation) {
        return res.status(404).json({
          success: false,
          message: '실제장소를 찾을 수 없습니다.'
        });
      }
      
      // 콘티의 장소 정보도 함께 업데이트
      conte.realLocationId = realLocationId;
      conte.keywords = conte.keywords || {};
      conte.keywords.location = realLocation.name;
      conte.modifiedBy = req.user.name || 'User';
      
    } else {
      // 실제장소 연결 해제
      conte.realLocationId = null;
      conte.modifiedBy = req.user.name || 'User';
      
    }
    
    await conte.save();
    
    res.status(200).json({
      success: true,
      message: realLocationId && realLocationId.trim() !== '' 
        ? '실제장소가 성공적으로 할당되었습니다.' 
        : '실제장소 연결이 해제되었습니다.',
      data: {
        conteId: conte._id,
        scene: conte.scene,
        title: conte.title,
        realLocationId: conte.realLocationId,
        location: conte.keywords?.location
      }
    });
  } catch (error) {
    console.error('콘티 실제장소 할당 오류:', error);
    console.error('오류 상세 정보:', {
      projectId,
      conteId,
      realLocationId,
      errorMessage: error.message,
      errorStack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '실제장소 할당 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 