import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';

/**
 * GroupAssignment 컴포넌트
 * 선택한 그룹 내 가상장소의 할당/추가/삭제를 담당
 */
const GroupAssignment = ({
  open,
  onClose,
  selectedGroup,
  virtualLocations,
  onDataChange
}) => {
  const { user } = useAuthStore();
  const [groupVirtualLocations, setGroupVirtualLocations] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);

  // 그룹 내 가상장소와 사용 가능한 가상장소 분리
  React.useEffect(() => {
    if (selectedGroup) {
      const inGroup = virtualLocations.filter(location => 
        location.locationGroupId === selectedGroup._id
      );
      const available = virtualLocations.filter(location => 
        !location.locationGroupId || location.locationGroupId !== selectedGroup._id
      );
      
      setGroupVirtualLocations(inGroup);
      setAvailableLocations(available);
    }
  }, [selectedGroup, virtualLocations]);

  // 가상장소를 그룹에 추가
  const handleAddToGroup = async (locationId) => {
    try {
      const response = await fetch(`/api/projects/${selectedGroup.projectId}/virtual-locations/${locationId}/change-group`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newLocationGroupId: selectedGroup._id })
      });

      if (!response.ok) {
        throw new Error('그룹 추가에 실패했습니다.');
      }

      onDataChange();
    } catch (error) {
      console.error('그룹 추가 오류:', error);
    }
  };

  // 가상장소를 그룹에서 제거
  const handleRemoveFromGroup = async (locationId) => {
    try {
      const response = await fetch(`/api/projects/${selectedGroup.projectId}/virtual-locations/${locationId}/change-group`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newLocationGroupId: null })
      });

      if (!response.ok) {
        throw new Error('그룹 제거에 실패했습니다.');
      }

      onDataChange();
    } catch (error) {
      console.error('그룹 제거 오류:', error);
    }
  };

  if (!selectedGroup) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedGroup.name} - 가상장소 관리
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, height: '400px' }}>
          {/* 그룹 내 가상장소 */}
          <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              그룹 내 가상장소 ({groupVirtualLocations.length}개)
            </Typography>
            <List dense>
              {groupVirtualLocations.map((location) => (
                <ListItem key={location._id}>
                  <DragIcon sx={{ mr: 1, color: 'action.active' }} />
                  <ListItemText
                    primary={location.name}
                    secondary={location.description}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFromGroup(location._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {groupVirtualLocations.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="가상장소가 없습니다"
                    secondary="오른쪽에서 가상장소를 추가해주세요"
                  />
                </ListItem>
              )}
            </List>
          </Box>

          {/* 사용 가능한 가상장소 */}
          <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              사용 가능한 가상장소 ({availableLocations.length}개)
            </Typography>
            <List dense>
              {availableLocations.map((location) => (
                <ListItem key={location._id}>
                  <ListItemText
                    primary={location.name}
                    secondary={location.description}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleAddToGroup(location._id)}
                    >
                      <AddIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {availableLocations.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="사용 가능한 가상장소가 없습니다"
                    secondary="새 가상장소를 생성해주세요"
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GroupAssignment; 