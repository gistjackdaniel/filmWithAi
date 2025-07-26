import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Tabs, Tab, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupManager from './GroupManager';
import RealLocationManager from './RealLocationManager';

const LocationManagerModal = ({ open, onClose, projectId }) => {
  const [tab, setTab] = useState(0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        위치 관리
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Group 관리" />
          <Tab label="RealLocation 관리" />
        </Tabs>
        {tab === 0 && <GroupManager projectId={projectId} />}
        {tab === 1 && <RealLocationManager projectId={projectId} />}
      </DialogContent>
    </Dialog>
  );
};

export default LocationManagerModal; 