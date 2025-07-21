import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Fab,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Movie as MovieIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { locationAPI } from '../../services/api';

/**
 * VirtualLocationList 컴포넌트
 * 가상장소(VirtualLocation)의 CRUD를 담당하며, 그룹 할당 기능을 제공
 */
const VirtualLocationList = ({
  projectId,
  locationGroups,
  virtualLocations,
  onDataChange,
  selectedGroup
}) => {
  const { user } = useAuthStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    locationGroupId: '',
    timeOfDay: '시간대 무관',
    lighting: '자연광',
    cameraAngle: '',
    environment: '실내',
    size: '보통',
    noiseLevel: '보통',
    accessibility: '보통',
    specialRequirements: [],
    tags: []
  });

  // 다이얼로그 열기
  const handleOpenDialog = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name || '',
        description: location.description || '',
        locationGroupId: location.locationGroupId || '',
        timeOfDay: location.shootingInfo?.timeOfDay || '시간대 무관',
        lighting: location.shootingInfo?.lighting || '자연광',
        cameraAngle: location.shootingInfo?.cameraAngle || '',
        environment: location.characteristics?.environment || '실내',
        size: location.characteristics?.size || '보통',
        noiseLevel: location.characteristics?.noiseLevel || '보통',
        accessibility: location.characteristics?.accessibility || '보통',
        specialRequirements: location.shootingInfo?.specialRequirements || [],
        tags: location.tags || []
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        description: '',
        locationGroupId: selectedGroup?._id || '',
        timeOfDay: '시간대 무관',
        lighting: '자연광',
        cameraAngle: '',
        environment: '실내',
        size: '보통',
        noiseLevel: '보통',
        accessibility: '보통',
        specialRequirements: [],
        tags: []
      });
    }
    setOpenDialog(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLocation(null);
  };

  // 폼 데이터 변경
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 가상장소 저장
  const handleSaveLocation = async () => {
    try {
      const locationData = {
        name: formData.name,
        description: formData.description,
        locationGroupId: formData.locationGroupId,
        shootingInfo: {
          timeOfDay: formData.timeOfDay,
          lighting: formData.lighting,
          cameraAngle: formData.cameraAngle,
          specialRequirements: formData.specialRequirements
        },
        characteristics: {
          environment: formData.environment,
          size: formData.size,
          noiseLevel: formData.noiseLevel,
          accessibility: formData.accessibility
        },
        tags: formData.tags
      };

      console.log('가상장소 저장 데이터:', locationData);

      let response;
      if (editingLocation) {
        response = await locationAPI.updateVirtualLocation(projectId, editingLocation._id, locationData);
        
        // 가상장소가 수정되면 연결된 콘티들의 장소 정보도 업데이트
        if (response.data.success) {
          await updateConnectedContes(editingLocation._id, formData.name);
        }
      } else {
        response = await locationAPI.createVirtualLocation(projectId, locationData);
      }

      setSnackbar({
        open: true,
        message: editingLocation ? '가상장소가 수정되었습니다.' : '새 가상장소가 생성되었습니다.',
        severity: 'success'
      });

      handleCloseDialog();
      onDataChange();
    } catch (error) {
      console.error('가상장소 저장 오류:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || '저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 연결된 콘티들의 장소 정보 업데이트
  const updateConnectedContes = async (virtualLocationId, newLocationName) => {
    try {
      console.log('연결된 콘티 업데이트 시작:', { virtualLocationId, newLocationName });
      
      // 해당 가상장소를 사용하는 콘티들을 찾아서 장소 정보 업데이트
      const response = await fetch(`/api/projects/${projectId}/virtual-locations/${virtualLocationId}/update-contes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth-token') || localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ newLocationName })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('연결된 콘티 업데이트 성공:', result);
      } else {
        console.error('연결된 콘티 업데이트 실패:', response.status);
      }
    } catch (error) {
      console.error('연결된 콘티 업데이트 오류:', error);
    }
  };

  // 연결된 콘티 수 조회
  const [connectedContesCount, setConnectedContesCount] = useState({});

  const loadConnectedContesCount = async (locationId) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/virtual-locations/${locationId}/connected-contes`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth-token') || localStorage.getItem('auth-token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setConnectedContesCount(prev => ({
          ...prev,
          [locationId]: result.data.count
        }));
      }
    } catch (error) {
      console.error('연결된 콘티 수 조회 오류:', error);
    }
  };

  // 컴포넌트 마운트 시 연결된 콘티 수 로드
  useEffect(() => {
    virtualLocations.forEach(location => {
      loadConnectedContesCount(location._id);
    });
  }, [virtualLocations]);

  // 가상장소 삭제
  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('이 가상장소를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await locationAPI.deleteVirtualLocation(projectId, locationId);

      setSnackbar({
        open: true,
        message: '가상장소가 삭제되었습니다.',
        severity: 'success'
      });

      onDataChange();
    } catch (error) {
      console.error('가상장소 삭제 오류:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || '삭제에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 그룹 변경
  const handleChangeGroup = async (locationId, newGroupId) => {
    console.log('그룹 변경 시작:', { locationId, newGroupId });
    
    try {
      const response = await locationAPI.assignVirtualLocationToGroup(projectId, locationId, newGroupId);
      console.log('그룹 변경 성공:', response);

      setSnackbar({
        open: true,
        message: '그룹이 변경되었습니다.',
        severity: 'success'
      });

      // 데이터 새로고침
      console.log('데이터 새로고침 시작');
      await onDataChange();
      console.log('데이터 새로고침 완료');
      
      // 성공 메시지 표시 후 잠시 대기
      setTimeout(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
      }, 2000);
    } catch (error) {
      console.error('그룹 변경 오류:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || '그룹 변경에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 그룹별 가상장소 필터링
  const getGroupName = (groupId) => {
    // groupId가 객체인 경우 _id를 사용
    const actualGroupId = groupId?._id || groupId;
    const group = locationGroups.find(g => g._id === actualGroupId);
    return group ? group.name : '미할당';
  };

  // 필터링된 가상장소 목록
  const filteredLocations = selectedGroup 
    ? virtualLocations.filter(location => {
        const locationGroupId = location.locationGroupId?._id || location.locationGroupId;
        return locationGroupId === selectedGroup._id;
      })
    : virtualLocations;

  return (
    <Box>
      {/* 가상장소 목록 */}
      <Grid container spacing={3}>
        {filteredLocations.map((location) => {
          const locationGroupId = location.locationGroupId?._id || location.locationGroupId;
          const group = locationGroups.find(g => g._id === locationGroupId);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={location._id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" component="h3" gutterBottom>
                      {location.name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(location)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteLocation(location._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {location.description}
                  </Typography>

                  <Box display="flex" alignItems="center" mb={1}>
                    <GroupIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {getGroupName(location.locationGroupId)}
                    </Typography>
                    {connectedContesCount[location._id] > 0 && (
                      <Chip 
                        size="small" 
                        label={`연결된 씬 ${connectedContesCount[location._id]}개`}
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>

                  <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                    <Chip 
                      label={location.shootingInfo?.timeOfDay} 
                      size="small" 
                      variant="outlined" 
                    />
                    <Chip 
                      label={location.characteristics?.environment} 
                      size="small" 
                      variant="outlined" 
                    />
                    {location.isAIGenerated && (
                      <Chip 
                        label="AI 생성" 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    )}
                  </Box>

                  {/* 태그 */}
                  {location.tags && location.tags.length > 0 && (
                    <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
                      {location.tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" />
                      ))}
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={String(location.locationGroupId?._id || location.locationGroupId || '')}
                      onChange={(e) => handleChangeGroup(location._id, e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>그룹 선택</em>
                      </MenuItem>
                      {locationGroups.map((group) => (
                        <MenuItem key={group._id} value={group._id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* 새 가상장소 추가 버튼 */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Tooltip title="새 가상장소 추가">
          <Fab
            color="primary"
            onClick={() => handleOpenDialog()}
            sx={{ boxShadow: 3 }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* 가상장소 편집 다이얼로그 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLocation ? '가상장소 수정' : '새 가상장소 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="가상장소명"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="설명"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>그룹</InputLabel>
                <Select
                  value={formData.locationGroupId}
                  onChange={(e) => handleFormChange('locationGroupId', e.target.value)}
                  required
                >
                  {locationGroups.map((group) => (
                    <MenuItem key={group._id} value={group._id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>촬영 시간대</InputLabel>
                <Select
                  value={formData.timeOfDay}
                  onChange={(e) => handleFormChange('timeOfDay', e.target.value)}
                >
                  <MenuItem value="새벽">새벽</MenuItem>
                  <MenuItem value="아침">아침</MenuItem>
                  <MenuItem value="오후">오후</MenuItem>
                  <MenuItem value="저녁">저녁</MenuItem>
                  <MenuItem value="밤">밤</MenuItem>
                  <MenuItem value="낮">낮</MenuItem>
                  <MenuItem value="시간대 무관">시간대 무관</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>조명</InputLabel>
                <Select
                  value={formData.lighting}
                  onChange={(e) => handleFormChange('lighting', e.target.value)}
                >
                  <MenuItem value="자연광">자연광</MenuItem>
                  <MenuItem value="인공조명">인공조명</MenuItem>
                  <MenuItem value="혼합조명">혼합조명</MenuItem>
                  <MenuItem value="특수조명">특수조명</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>환경</InputLabel>
                <Select
                  value={formData.environment}
                  onChange={(e) => handleFormChange('environment', e.target.value)}
                >
                  <MenuItem value="실내">실내</MenuItem>
                  <MenuItem value="실외">실외</MenuItem>
                  <MenuItem value="반실내">반실내</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="카메라 앵글/구도"
                value={formData.cameraAngle}
                onChange={(e) => handleFormChange('cameraAngle', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSaveLocation} variant="contained">
            {editingLocation ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VirtualLocationList; 