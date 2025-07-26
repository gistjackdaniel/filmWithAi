import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, Button, List, Box, Chip, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../services/api';

const GroupDetailModal = ({ open, onClose, group, projectId }) => {
  const [address, setAddress] = useState(group?.address || '');
  const [locations, setLocations] = useState([]);

  const fetchLocations = async () => {
    if (group && projectId) {
      const res = await api.get(`/projects/${projectId}/realLocations`, { params: { groupId: group._id } });
      setLocations(res.data.data || []);
    }
  };

  useEffect(() => {
    setAddress(group?.address || '');
    fetchLocations();
    // eslint-disable-next-line
  }, [group, projectId]);

  const handleAddressSave = async () => {
    await api.put(`/projects/${projectId}/groups/${group._id}`, { name: group.name, address });
    onClose(true); // true: 변경됨
  };

  const handleRemoveLocation = async (locId) => {
    await api.put(`/projects/${projectId}/realLocations/${locId}`, { groupId: null });
    fetchLocations();
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>그룹 상세 정보</DialogTitle>
      <DialogContent>
        <TextField
          label="주소"
          value={address}
          onChange={e => setAddress(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" onClick={handleAddressSave}>주소 저장</Button>
        <div style={{ marginTop: 24 }}>
          <Typography variant="subtitle1" gutterBottom>소속 장소 목록</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {locations.map(loc => (
              <Box key={loc._id} sx={{ position: 'relative', display: 'inline-block' }}>
                <Chip label={loc.name} sx={{ pr: 3, minWidth: 80 }} />
                <IconButton
                  size="small"
                  sx={{ position: 'absolute', top: -8, right: -8, zIndex: 1, background: '#333', color: 'white', boxShadow: 1, '&:hover': { background: '#555' } }}
                  onClick={() => handleRemoveLocation(loc._id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {locations.length === 0 && <Typography color="text.secondary">장소가 없습니다.</Typography>}
          </Box>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupDetailModal; 