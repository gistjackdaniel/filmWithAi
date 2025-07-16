import React, { useState } from 'react'
import { 
  Box, 
  Typography, 
  Chip, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material'
import { 
  FilterList, 
  Clear, 
  Search,
  VideoLibrary,
  CameraAlt
} from '@mui/icons-material'
import { CaptionCardType } from '../../../types/timeline'

/**
 * 타임라인 필터링 컴포넌트
 * 씬 필터링 및 검색 기능을 제공
 */
const TimelineFilters = ({
  filters = {},
  onFilterChange,
  onClearFilters,
  totalScenes = 0,
  filteredCount = 0,
  showAdvancedFilters = false,
  onToggleAdvancedFilters
}) => {
  const [searchText, setSearchText] = useState(filters.search || '')
  const [typeFilter, setTypeFilter] = useState(filters.type || '')
  const [sceneNumberFilter, setSceneNumberFilter] = useState(filters.sceneNumber || '')

  // 검색 텍스트 변경 핸들러
  const handleSearchChange = (event) => {
    const value = event.target.value
    setSearchText(value)
    onFilterChange({ ...filters, search: value })
  }

  // 타입 필터 변경 핸들러
  const handleTypeChange = (event) => {
    const value = event.target.value
    setTypeFilter(value)
    onFilterChange({ ...filters, type: value })
  }

  // 씬 번호 필터 변경 핸들러
  const handleSceneNumberChange = (event) => {
    const value = event.target.value
    setSceneNumberFilter(value)
    onFilterChange({ ...filters, sceneNumber: value })
  }

  // 모든 필터 초기화
  const handleClearAll = () => {
    setSearchText('')
    setTypeFilter('')
    setSceneNumberFilter('')
    onClearFilters()
  }

  // 활성 필터 개수 계산
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== null && value !== undefined && value !== ''
  ).length

  return (
    <Box
      sx={{
        backgroundColor: 'var(--color-card-bg)',
        borderRadius: 'var(--spacing-border-radius)',
        padding: 'var(--spacing-component-padding)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flex: 1
      }}
    >
      {/* 필터 헤더 - 컴팩트 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterList sx={{ color: 'var(--color-accent)', fontSize: '18px' }} />
        <Typography 
          variant="body2" 
          sx={{ 
            font: 'var(--font-body-2)',
            color: 'var(--color-text-secondary)',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          필터
        </Typography>
        {activeFiltersCount > 0 && (
          <Chip 
            label={`${activeFiltersCount}`}
            size="small"
            sx={{ 
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-text-primary)',
              height: '20px',
              fontSize: '12px'
            }}
          />
        )}
      </Box>

      {/* 기본 필터 - 한 행에 배치 */}
      <Box sx={{ display: 'flex', gap: 1, flex: 1, alignItems: 'center' }}>
        {/* 검색 필터 */}
        <TextField
          size="small"
          placeholder="검색..."
          value={searchText}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <Search sx={{ color: 'var(--color-text-secondary)', mr: 0.5, fontSize: '18px' }} />
          }}
          sx={{
            minWidth: 120,
            '& .MuiOutlinedInput-root': {
              color: 'var(--color-text-primary)',
              height: '36px',
              fontSize: '14px',
              '& fieldset': {
                borderColor: 'var(--color-border)',
              },
              '&:hover fieldset': {
                borderColor: 'var(--color-accent)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--color-accent)',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'var(--color-text-secondary)',
              opacity: 1,
              fontSize: '14px',
            },
          }}
        />

        {/* 타입 필터 */}
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel 
            sx={{ 
              color: 'var(--color-text-secondary)',
              fontSize: '14px',
              '&.Mui-focused': {
                color: 'var(--color-accent)',
              }
            }}
          >
            타입
          </InputLabel>
          <Select
            value={typeFilter}
            onChange={handleTypeChange}
            label="타입"
            sx={{
              color: 'var(--color-text-primary)',
              height: '36px',
              fontSize: '14px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--color-border)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--color-accent)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--color-accent)',
              },
            }}
          >
            <MenuItem value="">모든 타입</MenuItem>
            <MenuItem value={CaptionCardType.GENERATED_VIDEO}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VideoLibrary fontSize="small" />
                AI 비디오
              </Box>
            </MenuItem>
            <MenuItem value={CaptionCardType.LIVE_ACTION}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CameraAlt fontSize="small" />
                실사 촬영
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* 씬 번호 필터 */}
        <TextField
          size="small"
          placeholder="씬 번호"
          value={sceneNumberFilter}
          onChange={handleSceneNumberChange}
          type="number"
          sx={{
            minWidth: 80,
            '& .MuiOutlinedInput-root': {
              color: 'var(--color-text-primary)',
              height: '36px',
              fontSize: '14px',
              '& fieldset': {
                borderColor: 'var(--color-border)',
              },
              '&:hover fieldset': {
                borderColor: 'var(--color-accent)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'var(--color-accent)',
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: 'var(--color-text-secondary)',
              opacity: 1,
              fontSize: '14px',
            },
          }}
        />
      </Box>

      {/* 필터 초기화 버튼 */}
      {activeFiltersCount > 0 && (
        <Tooltip title="모든 필터 초기화">
          <IconButton
            size="small"
            onClick={handleClearAll}
            sx={{
              color: 'var(--color-text-secondary)',
              '&:hover': {
                color: 'var(--color-danger)',
              }
            }}
          >
            <Clear fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}

export default TimelineFilters 