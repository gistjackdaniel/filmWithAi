import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, IconButton, Button, TextField, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../../services/api';
import RealLocationDetailModal from './RealLocationDetailModal';

const RealLocationManager = ({ projectId }) => {
  const [locations, setLocations] = useState([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [groups, setGroups] = useState([]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      console.log('[RealLocationManager] Fetching locations for project:', projectId);
      const res = await api.get(`/projects/${projectId}/realLocations`);
      console.log('[RealLocationManager] Fetched locations:', res.data.data);
      setLocations(res.data.data || []);
    } catch (e) {
      console.error('[RealLocationManager] Error fetching locations:', e);
      setLocations([]);
    }
    setLoading(false);
  };

  const fetchGroups = async () => {
    if (projectId) {
      const res = await api.get(`/projects/${projectId}/groups`);
      setGroups(res.data.data || []);
    }
  };

  useEffect(() => {
    if (projectId) fetchLocations();
  }, [projectId]);

  useEffect(() => {
    fetchGroups();
  }, [projectId]);

  const handleAdd = async () => {
    if (!newName) return;
    await api.post(`/projects/${projectId}/realLocations`, { name: newName });
    setNewName('');
    fetchLocations();
  };

  const handleDelete = async (id) => {
    await api.delete(`/projects/${projectId}/realLocations/${id}`);
    fetchLocations();
  };

  // groupId -> name 매핑
  const groupMap = {};
  groups.forEach(g => { groupMap[g._id] = g.name; });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>장소 목록</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField size="small" label="장소 이름" value={newName} onChange={e => setNewName(e.target.value)} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>추가</Button>
      </Box>
      <Divider sx={{ mb: 1 }} />
      <List dense>
        {locations.map(l => (
          <ListItem
            key={l._id}
            button
            onClick={() => setSelectedLocation(l)}
            secondaryAction={
              <IconButton edge="end" onClick={e => { e.stopPropagation(); handleDelete(l._id); }}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={l.name} secondary={l.groupId ? `Group: ${groupMap[l.groupId] || l.groupId}` : '미분류'} />
          </ListItem>
        ))}
        {locations.length === 0 && <Typography color="text.secondary">장소가 없습니다.</Typography>}
      </List>
      {selectedLocation && (
        <RealLocationDetailModal
          open={!!selectedLocation}
          onClose={changed => { setSelectedLocation(null); if (changed) fetchLocations(); }}
          realLocation={selectedLocation}
          projectId={projectId}
        />
      )}
    </Box>
  );
};
export default RealLocationManager; 