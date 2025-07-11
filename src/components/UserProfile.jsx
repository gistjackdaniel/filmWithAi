import { useState } from 'react'
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material'
import {
  AccountCircle,
  Edit,
  Logout,
  Settings,
  Person,
  Email,
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

/**
 * 사용자 프로필 컴포넌트
 * 사용자 아바타, 이름, 이메일을 표시하고 프로필 편집 기능 제공
 */
const UserProfile = () => {
  // 로컬 상태 관리
  const [anchorEl, setAnchorEl] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  })
  const [isEditing, setIsEditing] = useState(false)

  // Zustand 스토어에서 사용자 정보와 로그아웃 함수 가져오기
  const { user, logout } = useAuthStore()

  /**
   * 메뉴 열기
   */
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  /**
   * 메뉴 닫기
   */
  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  /**
   * 프로필 편집 다이얼로그 열기
   */
  const handleEditProfile = () => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
    })
    setEditDialogOpen(true)
    handleMenuClose()
  }

  /**
   * 프로필 편집 다이얼로그 닫기
   */
  const handleEditDialogClose = () => {
    setEditDialogOpen(false)
    setEditForm({ name: '', email: '' })
    setIsEditing(false)
  }

  /**
   * 폼 입력 처리
   */
  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  /**
   * 프로필 업데이트 처리
   */
  const handleUpdateProfile = async () => {
    try {
      setIsEditing(true)
      
      // 실제 구현에서는 API 호출
      // await api.put('/user/profile', editForm)
      
      // 임시로 성공 메시지만 표시
      toast.success('프로필이 업데이트되었습니다!')
      handleEditDialogClose()
    } catch (error) {
      toast.error('프로필 업데이트에 실패했습니다.')
    } finally {
      setIsEditing(false)
    }
  }

  /**
   * 로그아웃 처리
   */
  const handleLogout = () => {
    handleMenuClose()
    logout()
    toast.success('로그아웃되었습니다.')
  }

  // 사용자 이니셜 생성 (이름의 첫 글자들)
  const getUserInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // 사용자 아바타 색상 생성
  const getAvatarColor = (name) => {
    if (!name) return '#2E3A59'
    const colors = ['#2E3A59', '#D4AF37', '#2ECC71', '#E74C3C', '#9B59B6']
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <>
      {/* 사용자 아바타 버튼 */}
      <IconButton
        onClick={handleMenuOpen}
        aria-label="사용자 메뉴 열기"
        aria-expanded={Boolean(anchorEl)}
        aria-haspopup="true"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleMenuOpen(e)
          }
        }}
        sx={{
          p: 1,
          border: '2px solid transparent',
          '&:hover': {
            border: '2px solid #D4AF37',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <Avatar
          sx={{
            bgcolor: getAvatarColor(user?.name),
            color: '#F5F5F5',
            fontWeight: 600,
            width: 40,
            height: 40,
          }}
        >
          {user?.picture ? (
            <img 
              src={user.picture} 
              alt={user.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            getUserInitials(user?.name)
          )}
        </Avatar>
      </IconButton>

      {/* 사용자 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            backgroundColor: '#2F2F37',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            '& .MuiMenuItem-root': {
              color: '#F5F5F5',
              '&:hover': {
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* 사용자 정보 헤더 */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#F5F5F5' }}>
            {user?.name || '사용자'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#A0A3B1' }}>
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>

        <Divider sx={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }} />

        {/* 메뉴 아이템들 */}
        <MenuItem onClick={handleEditProfile}>
          <ListItemIcon>
            <Edit sx={{ color: '#D4AF37' }} />
          </ListItemIcon>
          <ListItemText>프로필 편집</ListItemText>
        </MenuItem>

        <MenuItem>
          <ListItemIcon>
            <Settings sx={{ color: '#D4AF37' }} />
          </ListItemIcon>
          <ListItemText>설정</ListItemText>
        </MenuItem>

        <Divider sx={{ backgroundColor: 'rgba(212, 175, 55, 0.2)' }} />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout sx={{ color: '#E74C3C' }} />
          </ListItemIcon>
          <ListItemText>로그아웃</ListItemText>
        </MenuItem>
      </Menu>

      {/* 프로필 편집 다이얼로그 */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#2F2F37',
            color: '#F5F5F5',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
          프로필 편집
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, color: '#A0A3B1' }}>
              프로필 정보를 수정할 수 있습니다.
            </Typography>
            
            <TextField
              fullWidth
              label="이름"
              value={editForm.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#F5F5F5',
                  '& fieldset': {
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#D4AF37',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#D4AF37',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#A0A3B1',
                  '&.Mui-focused': {
                    color: '#D4AF37',
                  },
                },
              }}
            />
            
            <TextField
              fullWidth
              label="이메일"
              value={editForm.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#F5F5F5',
                  '& fieldset': {
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#D4AF37',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#D4AF37',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#A0A3B1',
                  '&.Mui-focused': {
                    color: '#D4AF37',
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={handleEditDialogClose}
            sx={{ color: '#A0A3B1' }}
          >
            취소
          </Button>
          <Button
            onClick={handleUpdateProfile}
            disabled={isEditing}
            sx={{
              backgroundColor: '#D4AF37',
              color: '#1B1B1E',
              '&:hover': {
                backgroundColor: '#E6C866',
              },
              '&:disabled': {
                backgroundColor: 'rgba(212, 175, 55, 0.3)',
                color: 'rgba(27, 27, 30, 0.5)',
              },
            }}
          >
            {isEditing ? '업데이트 중...' : '업데이트'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default UserProfile 