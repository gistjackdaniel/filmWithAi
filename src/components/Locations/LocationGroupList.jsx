import React, { useState } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Snackbar,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import GroupAssignment from './GroupAssignment';
import { useAuthStore } from '../../stores/authStore';
import { locationAPI } from '../../services/api';

/**
 * LocationGroupList 컴포넌트
 * 장소 그룹(LocationGroup)의 CRUD를 담당하며, 실제 주소 입력 및 하위 가상장소 관리를 수행
 */
const LocationGroupList = ({
  projectId,
  locationGroups,
  virtualLocations,
  onDataChange,
  onGroupSelect,
  selectedGroup
}) => {
  const { user } = useAuthStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    name: '',
    realAddress: '',
    city: '',
    district: '',
    postalCode: '',
    contactPerson: '',
    contactPhone: '',
    permissionRequired: false,
    notes: ''
  });

  // 다이얼로그 열기
  const handleOpenDialog = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name || '',
        realAddress: group.realAddress || '',
        city: group.addressDetails?.city || '',
        district: group.addressDetails?.district || '',
        postalCode: group.addressDetails?.postalCode || '',
        contactPerson: group.shootingInfo?.contactPerson || '',
        contactPhone: group.shootingInfo?.contactPhone || '',
        permissionRequired: group.shootingInfo?.permissionRequired || false,
        notes: group.shootingInfo?.notes || ''
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        realAddress: '',
        city: '',
        district: '',
        postalCode: '',
        contactPerson: '',
        contactPhone: '',
        permissionRequired: false,
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGroup(null);
  };

  // 폼 데이터 변경
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 그룹 저장
  const handleSaveGroup = async () => {
    try {
      const groupData = {
        name: formData.name,
        realAddress: formData.realAddress,
        addressDetails: {
          city: formData.city,
          district: formData.district,
          postalCode: formData.postalCode
        },
        shootingInfo: {
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          permissionRequired: formData.permissionRequired,
          notes: formData.notes
        }
      };

      let response;
      if (editingGroup) {
        response = await locationAPI.updateLocationGroup(projectId, editingGroup._id, groupData);
      } else {
        response = await locationAPI.createLocationGroup(projectId, groupData);
      }

      setSnackbar({
        open: true,
        message: editingGroup ? '그룹이 수정되었습니다.' : '새 그룹이 생성되었습니다.',
        severity: 'success'
      });

      handleCloseDialog();
      onDataChange();
    } catch (error) {
      console.error('그룹 저장 오류:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || '저장에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 그룹 삭제
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('이 그룹을 삭제하시겠습니까? 포함된 가상장소들도 함께 삭제됩니다.')) {
      return;
    }

    try {
      await locationAPI.deleteLocationGroup(projectId, groupId);

      setSnackbar({
        open: true,
        message: '그룹이 삭제되었습니다.',
        severity: 'success'
      });

      onDataChange();
    } catch (error) {
      console.error('그룹 삭제 오류:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || '삭제에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 그룹 확장/축소 토글
  const toggleGroupExpansion = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // 그룹별 가상장소 필터링
  const getVirtualLocationsByGroup = (groupId) => {
    return virtualLocations.filter(location => location.locationGroupId === groupId);
  };

  return (
    <Box>
      {/* 그룹 목록 */}
      <Grid container spacing={3}>
        {locationGroups.map((group) => {
          const groupVirtualLocations = getVirtualLocationsByGroup(group._id);
          const isExpanded = expandedGroups.has(group._id);
          const isSelected = selectedGroup?._id === group._id;

          return (
            <Grid item xs={12} md={6} lg={4} key={group._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
                onClick={() => onGroupSelect(group)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" component="h3" gutterBottom>
                      {group.name}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(group);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {group.realAddress}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} mb={2}>
                    <Chip 
                      label={`${groupVirtualLocations.length}개 가상장소`} 
                      size="small" 
                      variant="outlined" 
                    />
                    {group.shootingInfo?.permissionRequired && (
                      <Chip 
                        label="허가 필요" 
                        size="small" 
                        color="warning" 
                        variant="outlined" 
                      />
                    )}
                  </Box>

                  {/* 가상장소 목록 (축소 가능) */}
                  <Box>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroupExpansion(group._id);
                      }}
                      endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      가상장소 목록
                    </Button>

                    {isExpanded && (
                      <List dense sx={{ mt: 1 }}>
                        {groupVirtualLocations.map((location) => (
                          <ListItem key={location._id} sx={{ pl: 2 }}>
                            <ListItemText
                              primary={location.name}
                              secondary={location.description}
                            />
                            <ListItemSecondaryAction>
                              <DragIcon color="action" />
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                        {groupVirtualLocations.length === 0 && (
                          <ListItem>
                            <ListItemText
                              primary="가상장소가 없습니다"
                              secondary="가상장소를 추가해주세요"
                            />
                          </ListItem>
                        )}
                      </List>
                    )}
                  </Box>
                </CardContent>

                <CardActions>
                  <Button 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      // GroupAssignment 모달 열기
                    }}
                  >
                    가상장소 관리
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* 새 그룹 추가 버튼 */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Tooltip title="새 장소 그룹 추가">
          <Fab
            color="primary"
            onClick={() => handleOpenDialog()}
            sx={{ boxShadow: 3 }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* 그룹 편집 다이얼로그 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingGroup ? '장소 그룹 수정' : '새 장소 그룹 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="그룹명"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="실제 주소"
                value={formData.realAddress}
                onChange={(e) => handleFormChange('realAddress', e.target.value)}
                required
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="도시"
                value={formData.city}
                onChange={(e) => handleFormChange('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="구/군"
                value={formData.district}
                onChange={(e) => handleFormChange('district', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="우편번호"
                value={formData.postalCode}
                onChange={(e) => handleFormChange('postalCode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="연락처"
                value={formData.contactPhone}
                onChange={(e) => handleFormChange('contactPhone', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="담당자"
                value={formData.contactPerson}
                onChange={(e) => handleFormChange('contactPerson', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="메모"
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSaveGroup} variant="contained">
            {editingGroup ? '수정' : '추가'}
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

export default LocationGroupList; 