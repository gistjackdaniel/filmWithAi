import React, { useState, useCallback, useRef } from 'react'
import { Box, ToggleButton, ToggleButtonGroup, Typography, Chip } from '@mui/material'
import { 
  Movie,
  Image,
  Timeline,
  ViewColumn,
  ViewModule
} from '@mui/icons-material'
import TimelineV1 from './TimelineV1'
import TimelineV2 from './TimelineV2'
import { useTheme } from '@mui/material/styles'

/**
 * 이중 타임라인 뷰어 컴포넌트
 * V1/V2 타임라인을 통합하여 표시하고 전환 기능 제공
 */
const DualTimelineViewer = ({ 
  projectId, 
  onSceneSelect, 
  onSceneEdit,
  isEditing = false 
}) => {
  const theme = useTheme()
  const [timelineVersion, setTimelineVersion] = useState('v1') // 'v1' | 'v2' | 'dual'
  const [selectedSceneId, setSelectedSceneId] = useState(null)
  const [syncScroll, setSyncScroll] = useState(true)
  const [syncZoom, setSyncZoom] = useState(true)

  /**
   * 타임라인 버전 변경 핸들러
   */
  const handleTimelineVersionChange = useCallback((event, newVersion) => {
    if (newVersion !== null) {
      setTimelineVersion(newVersion)
    }
  }, [])

  /**
   * 씬 선택 핸들러
   */
  const handleSceneSelect = useCallback((sceneId) => {
    setSelectedSceneId(sceneId)
    if (onSceneSelect) {
      onSceneSelect(sceneId)
    }
  }, [onSceneSelect])

  /**
   * 씬 편집 핸들러
   */
  const handleSceneEdit = useCallback((sceneId) => {
    if (onSceneEdit) {
      onSceneEdit(sceneId)
    }
  }, [onSceneEdit])

  /**
   * 동기화 설정 토글
   */
  const handleSyncToggle = useCallback((type) => {
    if (type === 'scroll') {
      setSyncScroll(prev => !prev)
    } else if (type === 'zoom') {
      setSyncZoom(prev => !prev)
    }
  }, [])

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.grey[50]
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            타임라인 뷰어
          </Typography>
          
          <Chip
            label={timelineVersion === 'v1' ? '촬영 소스' : 
                   timelineVersion === 'v2' ? '스토리보드' : '이중 뷰'}
            size="small"
            color="primary"
            icon={timelineVersion === 'v1' ? <Movie /> : 
                  timelineVersion === 'v2' ? <Image /> : <Timeline />}
          />
        </Box>

        {/* 타임라인 버전 선택 */}
        <ToggleButtonGroup
          value={timelineVersion}
          exclusive
          onChange={handleTimelineVersionChange}
          size="small"
        >
          <ToggleButton value="v1" aria-label="촬영 소스">
            <Movie sx={{ mr: 1 }} />
            촬영 소스
          </ToggleButton>
          <ToggleButton value="v2" aria-label="스토리보드">
            <Image sx={{ mr: 1 }} />
            스토리보드
          </ToggleButton>
          <ToggleButton value="dual" aria-label="이중 뷰">
            <ViewColumn sx={{ mr: 1 }} />
            이중 뷰
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* 타임라인 컨텐츠 */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {timelineVersion === 'v1' && (
          <TimelineV1
            projectId={projectId}
            onSceneSelect={handleSceneSelect}
            onSceneEdit={handleSceneEdit}
            isEditing={isEditing}
          />
        )}

        {timelineVersion === 'v2' && (
          <TimelineV2
            projectId={projectId}
            onSceneSelect={handleSceneSelect}
            onSceneEdit={handleSceneEdit}
            isEditing={isEditing}
          />
        )}

        {timelineVersion === 'dual' && (
          <DualTimelineLayout
            projectId={projectId}
            onSceneSelect={handleSceneSelect}
            onSceneEdit={handleSceneEdit}
            isEditing={isEditing}
            syncScroll={syncScroll}
            syncZoom={syncZoom}
            onSyncToggle={handleSyncToggle}
          />
        )}
      </Box>
    </Box>
  )
}

/**
 * 이중 타임라인 레이아웃 컴포넌트
 */
const DualTimelineLayout = ({
  projectId,
  onSceneSelect,
  onSceneEdit,
  isEditing,
  syncScroll,
  syncZoom,
  onSyncToggle
}) => {
  const theme = useTheme()
  const v1Ref = useRef(null)
  const v2Ref = useRef(null)

  /**
   * 동기화된 스크롤 핸들러
   */
  const handleSyncScroll = useCallback((source, scrollTop) => {
    if (!syncScroll) return

    const targetRef = source === 'v1' ? v2Ref : v1Ref
    if (targetRef.current) {
      targetRef.current.scrollTop = scrollTop
    }
  }, [syncScroll])

  /**
   * 동기화된 줌 핸들러
   */
  const handleSyncZoom = useCallback((source, zoomLevel) => {
    if (!syncZoom) return

    const targetRef = source === 'v1' ? v2Ref : v1Ref
    if (targetRef.current) {
      // 줌 레벨 동기화 로직
      console.log(`Syncing zoom from ${source} to ${source === 'v1' ? 'v2' : 'v1'}: ${zoomLevel}`)
    }
  }, [syncZoom])

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* V1 타임라인 (촬영 소스) */}
      <Box
        ref={v1Ref}
        sx={{
          flex: 1,
          borderRight: `1px solid ${theme.palette.divider}`,
          position: 'relative'
        }}
      >
        <TimelineV1
          projectId={projectId}
          onSceneSelect={onSceneSelect}
          onSceneEdit={onSceneEdit}
          isEditing={isEditing}
          onScrollSync={(scrollTop) => handleSyncScroll('v1', scrollTop)}
          onZoomSync={(zoomLevel) => handleSyncZoom('v1', zoomLevel)}
        />
      </Box>

      {/* V2 타임라인 (스토리보드) */}
      <Box
        ref={v2Ref}
        sx={{
          flex: 1,
          position: 'relative'
        }}
      >
        <TimelineV2
          projectId={projectId}
          onSceneSelect={onSceneSelect}
          onSceneEdit={onSceneEdit}
          isEditing={isEditing}
          onScrollSync={(scrollTop) => handleSyncScroll('v2', scrollTop)}
          onZoomSync={(zoomLevel) => handleSyncZoom('v2', zoomLevel)}
        />
      </Box>

      {/* 동기화 컨트롤 오버레이 */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 10
        }}
      >
        <Chip
          label={`스크롤 ${syncScroll ? '동기화' : '해제'}`}
          size="small"
          color={syncScroll ? 'primary' : 'default'}
          onClick={() => onSyncToggle('scroll')}
          sx={{ cursor: 'pointer' }}
        />
        <Chip
          label={`줌 ${syncZoom ? '동기화' : '해제'}`}
          size="small"
          color={syncZoom ? 'primary' : 'default'}
          onClick={() => onSyncToggle('zoom')}
          sx={{ cursor: 'pointer' }}
        />
      </Box>
    </Box>
  )
}

export default DualTimelineViewer 