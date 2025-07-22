import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, Button, MenuItem, List, Box, Chip, IconButton, Typography, Checkbox, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../services/api';

const RealLocationDetailModal = ({ open, onClose, realLocation, projectId }) => {
  const [name, setName] = useState(realLocation?.name || '');
  const [groupId, setGroupId] = useState(realLocation?.groupId || '');
  const [groups, setGroups] = useState([]);
  const [contes, setContes] = useState([]);
  const [allContes, setAllContes] = useState([]);
  const [selectedConteIds, setSelectedConteIds] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  // 모든 RealLocation 불러오기
  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}/groups`).then(res => setGroups(res.data.data || []));
      api.get(`/projects/${projectId}/realLocations`).then(res => setAllLocations(res.data.data || []));
    }
    if (realLocation) {
      fetchContes();
    }
    // eslint-disable-next-line
  }, [realLocation, projectId]);

  // id -> name 매핑
  const locationMap = {};
  allLocations.forEach(loc => { locationMap[loc._id] = loc.name; });

  // 모든 Conte 불러오기
  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}/contes`).then(res => setAllContes(res.data.data?.contes || []));
    }
  }, [projectId]);

  const fetchContes = async () => {
    if (realLocation) {
      const res = await api.get(`/projects/${projectId}/contes`, { params: { realLocationId: realLocation._id } });
      setContes(res.data.data?.contes || []);
    }
  };

  const handleSave = async () => {
    await api.put(`/projects/${projectId}/realLocations/${realLocation._id}`, { name, groupId });
    onClose(true);
  };

  const handleRemoveConte = async (conte) => {
    await api.put(`/projects/${projectId}/contes/${conte.id}`, {
      ...conte,
      keywords: { ...conte.keywords, realLocationId: null }
    });
    fetchContes();
  };

  const handleAddContes = async () => {
    await Promise.all(selectedConteIds.map(conteId => {
      const conte = allContes.find(c => c.id === conteId);
      return api.put(`/projects/${projectId}/contes/${conteId}`, {
        keywords: { ...conte.keywords, realLocationId: realLocation._id }
      });
    }));
    setSelectedConteIds([]);
    fetchContes();
    // 추가: 전체 콘티 목록도 새로고침
    api.get(`/projects/${projectId}/contes`).then(res => setAllContes(res.data.data?.contes || []));
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>장소 상세 정보</DialogTitle>
      <DialogContent>
        <TextField
          label="장소 이름"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          select
          label="소속 그룹"
          value={groupId || ''}
          onChange={e => setGroupId(e.target.value)}
          fullWidth
          margin="normal"
        >
          <MenuItem value="">미분류</MenuItem>
          {groups.map(g => (
            <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>
          ))}
        </TextField>
        <Button variant="contained" onClick={handleSave}>저장</Button>
        <div style={{ marginTop: 24 }}>
          <Typography variant="subtitle1" gutterBottom>이 장소에서 촬영하는 씬(콘티)</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {contes.map(conte => (
              <Box key={conte.id} sx={{ position: 'relative', display: 'inline-block' }}>
                <Chip label={conte.title} sx={{ pr: 3, minWidth: 80 }} />
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    zIndex: 1,
                    background: '#333', // 더 어두운 배경
                    color: 'white',     // x 아이콘을 흰색으로
                    boxShadow: 1,
                    '&:hover': {
                      background: '#555',
                    }
                  }}
                  onClick={() => handleRemoveConte(conte)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            {contes.length === 0 && <Typography color="text.secondary">콘티가 없습니다.</Typography>}
          </Box>
        </div>
        {/* === Conte 추가 표 === */}
        <div style={{ marginTop: 32 }}>
          <Typography variant="subtitle1" gutterBottom>씬(콘티) 추가</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>제목</TableCell>
                <TableCell>현재 장소</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allContes.filter(c => !c.keywords?.realLocationId || c.keywords.realLocationId !== realLocation._id).map(conte => (
                <TableRow key={conte.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedConteIds.includes(conte.id)}
                      onChange={e => {
                        if (e.target.checked) setSelectedConteIds(ids => [...ids, conte.id]);
                        else setSelectedConteIds(ids => ids.filter(id => id !== conte.id));
                      }}
                    />
                  </TableCell>
                  <TableCell>{conte.title}</TableCell>
                  <TableCell>
                    {conte.keywords?.realLocationId
                      ? locationMap[conte.keywords.realLocationId] || conte.keywords.realLocationId
                      : '미지정'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outlined" sx={{ mt: 1 }} disabled={selectedConteIds.length === 0} onClick={handleAddContes}>선택 씬 추가</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RealLocationDetailModal; 