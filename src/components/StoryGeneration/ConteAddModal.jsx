import { useState } from 'react';
import { Modal, Box, Typography, TextField, Button } from '@mui/material';

const ConteAddModal = ({ open, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!title.trim() || !description.trim()) {
      setError('제목과 설명을 모두 입력해주세요.');
      return;
    }
    onAdd({
      title: title.trim(),
      description: description.trim(),
      // 기본값들 추가 가능
    });
    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 2,
        minWidth: 340,
        maxWidth: 400
      }}>
        <Typography variant="h6" sx={{ mb: 2 }}>새 콘티 추가</Typography>
        <TextField
          label="제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="설명"
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={3}
          sx={{ mb: 2 }}
        />
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={handleClose} color="secondary">취소</Button>
          <Button onClick={handleAdd} variant="contained" color="primary">추가</Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ConteAddModal; 