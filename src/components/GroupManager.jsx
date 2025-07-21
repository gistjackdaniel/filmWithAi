import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, IconButton, Button, TextField, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import api from '../services/api';
import GroupDetailModal from './GroupDetailModal';

const GroupManager = ({ projectId }) => {
  const [groups, setGroups] = useState([]);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      console.log('[GroupManager] Fetching groups for project:', projectId);
      const res = await api.get(`/projects/${projectId}/groups`);
      console.log('[GroupManager] Fetched groups:', res.data.data);
      setGroups(res.data.data || []);
    } catch (e) {
      console.error('[GroupManager] Error fetching groups:', e);
      setGroups([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (projectId) fetchGroups();
  }, [projectId]);

  const handleAdd = async () => {
    if (!newName || !newAddress) return;
    await api.post(`/projects/${projectId}/groups`, { name: newName, address: newAddress });
    setNewName('');
    setNewAddress('');
    fetchGroups();
  };

  const handleDelete = async (id) => {
    await api.delete(`/projects/${projectId}/groups/${id}`);
    fetchGroups();
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>그룹 목록</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField size="small" label="이름" value={newName} onChange={e => setNewName(e.target.value)} />
        <TextField size="small" label="주소" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>추가</Button>
      </Box>
      <Divider sx={{ mb: 1 }} />
      <List dense>
        {groups.map(g => (
          <ListItem
            key={g._id}
            button
            onClick={() => setSelectedGroup(g)}
            secondaryAction={
              <IconButton edge="end" onClick={e => { e.stopPropagation(); handleDelete(g._id); }}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={g.name} secondary={g.address} />
          </ListItem>
        ))}
        {groups.length === 0 && <Typography color="text.secondary">그룹이 없습니다.</Typography>}
      </List>
      {selectedGroup && (
        <GroupDetailModal
          open={!!selectedGroup}
          onClose={changed => {
            setSelectedGroup(null);
            if (changed) fetchGroups();
          }}
          group={selectedGroup}
          projectId={projectId}
        />
      )}
    </Box>
  );
};

export default GroupManager; 