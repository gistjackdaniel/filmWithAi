import { Box, Typography, Button } from '@mui/material'

/**
 * 간단한 테스트 페이지
 * 라우팅이 제대로 작동하는지 확인하기 위한 페이지
 */
const SimpleTest = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 간단한 테스트 페이지
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        이 페이지가 보인다면 라우팅이 정상적으로 작동하고 있습니다.
      </Typography>
      <Button variant="contained" onClick={() => alert('테스트 성공!')}>
        테스트 버튼
      </Button>
    </Box>
  )
}

export default SimpleTest 