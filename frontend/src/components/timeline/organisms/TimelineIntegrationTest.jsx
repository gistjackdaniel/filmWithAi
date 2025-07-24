import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  List, 
  ListItem, 
  ListItemText,
  Divider,
  Chip
} from '@mui/material'
import { CheckCircle, Error, Warning, Info } from '@mui/icons-material'
import TimelineViewer from './TimelineViewer'
import useTimelineStore from '../../../stores/timelineStore'

/**
 * 타임라인 통합 테스트 컴포넌트
 * 모든 타임라인 기능이 정상 작동하는지 확인
 */
const TimelineIntegrationTest = () => {
  const [testResults, setTestResults] = useState([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState('')
  
  const {
    scenes,
    loading,
    error,
    selectedSceneId,
    modalOpen,
    currentScene,
    setScenes,
    selectScene,
    openModal,
    closeModal,
    setLoading,
    setError
  } = useTimelineStore()

  // 테스트 케이스 정의
  const testCases = [
    {
      name: '기본 렌더링 테스트',
      description: '타임라인이 올바르게 렌더링되는지 확인',
      test: () => {
        return scenes.length >= 0 && !loading
      }
    },
    {
      name: '씬 카드 클릭 테스트',
      description: '씬 카드를 클릭했을 때 선택 상태가 변경되는지 확인',
      test: () => {
        if (scenes.length === 0) return true
        const firstScene = scenes[0]
        selectScene(firstScene.id)
        return selectedSceneId === firstScene.id
      }
    },
    {
      name: '모달 열기/닫기 테스트',
      description: '씬 상세 모달이 올바르게 열리고 닫히는지 확인',
      test: () => {
        if (scenes.length === 0) return true
        const firstScene = scenes[0]
        openModal(firstScene)
        const modalOpened = modalOpen && currentScene?.id === firstScene.id
        
        closeModal()
        const modalClosed = !modalOpen && !currentScene
        
        return modalOpened && modalClosed
      }
    },
    {
      name: '로딩 상태 테스트',
      description: '로딩 상태가 올바르게 표시되는지 확인',
      test: () => {
        setLoading(true)
        const loadingStarted = loading
        
        setTimeout(() => setLoading(false), 100)
        return loadingStarted
      }
    },
    {
      name: '에러 상태 테스트',
      description: '에러 상태가 올바르게 처리되는지 확인',
      test: () => {
        const testError = '테스트 에러 메시지'
        setError(testError)
        return error === testError
      }
    },
    {
      name: '빈 상태 테스트',
      description: '씬이 없을 때 빈 상태가 올바르게 표시되는지 확인',
      test: () => {
        setScenes([])
        return scenes.length === 0
      }
    },
    {
      name: '데이터 로드 테스트',
      description: '샘플 데이터가 올바르게 로드되는지 확인',
      test: () => {
        const sampleScenes = [
          {
            id: 'test-1',
            scene: 1,
            type: 'generated_video',
            description: '테스트 씬 1 - AI 비디오 생성',
            duration: 30,
            createdAt: new Date()
          },
          {
            id: 'test-2',
            scene: 2,
            type: 'live_action',
            description: '테스트 씬 2 - 실사 촬영',
            duration: 45,
            createdAt: new Date()
          }
        ]
        setScenes(sampleScenes)
        return scenes.length === 2
      }
    }
  ]

  // 테스트 실행
  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const results = []
    
    for (const testCase of testCases) {
      setCurrentTest(testCase.name)
      
      try {
        const passed = await testCase.test()
        results.push({
          name: testCase.name,
          description: testCase.description,
          passed,
          error: null
        })
      } catch (error) {
        results.push({
          name: testCase.name,
          description: testCase.description,
          passed: false,
          error: error.message
        })
      }
      
      // 테스트 간 간격
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setTestResults(results)
    setIsRunning(false)
    setCurrentTest('')
  }

  // 테스트 결과 요약
  const passedTests = testResults.filter(result => result.passed).length
  const totalTests = testResults.length
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        타임라인 통합 테스트
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, color: 'var(--color-text-secondary)' }}>
        타임라인의 모든 기능이 정상 작동하는지 확인합니다.
      </Typography>

      {/* 테스트 컨트롤 */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={runTests}
          disabled={isRunning}
          sx={{ mr: 2 }}
        >
          {isRunning ? '테스트 실행 중...' : '테스트 실행'}
        </Button>
        
        {isRunning && (
          <Typography variant="body2" sx={{ color: 'var(--color-accent)' }}>
            현재 테스트: {currentTest}
          </Typography>
        )}
      </Box>

      {/* 테스트 결과 요약 */}
      {testResults.length > 0 && (
        <Alert 
          severity={successRate === 100 ? 'success' : successRate >= 80 ? 'warning' : 'error'}
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">
            테스트 결과: {passedTests}/{totalTests} 통과 ({successRate.toFixed(1)}%)
          </Typography>
        </Alert>
      )}

      {/* 테스트 결과 상세 */}
      {testResults.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            테스트 결과 상세
          </Typography>
          <List>
            {testResults.map((result, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {result.passed ? (
                      <CheckCircle sx={{ color: 'var(--color-success)', mr: 1 }} />
                    ) : (
                      <Error sx={{ color: 'var(--color-danger)', mr: 1 }} />
                    )}
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {result.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
                        {result.description}
                      </Typography>
                      {result.error && (
                        <Typography variant="caption" sx={{ color: 'var(--color-danger)' }}>
                          에러: {result.error}
                        </Typography>
                      )}
                    </Box>
                    
                    <Chip
                      label={result.passed ? '통과' : '실패'}
                      color={result.passed ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </ListItem>
                {index < testResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* 타임라인 뷰어 (테스트용) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          타임라인 뷰어 테스트
        </Typography>
        <TimelineViewer
          scenes={scenes}
          loading={loading}
          selectedSceneId={selectedSceneId}
          onSceneClick={(scene) => {
            selectScene(scene.id)
            openModal(scene)
          }}
          onSceneEdit={(scene) => {
            console.log('씬 편집:', scene)
          }}
          onSceneInfo={(scene) => {
            openModal(scene)
          }}
          emptyMessage="테스트를 위해 샘플 데이터를 로드해주세요."
        />
      </Box>

      {/* 현재 상태 정보 */}
      <Box sx={{ 
        backgroundColor: 'var(--color-card-bg)', 
        p: 2, 
        borderRadius: 'var(--spacing-border-radius)',
        border: '1px solid var(--color-border)'
      }}>
        <Typography variant="h6" gutterBottom>
          현재 상태
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="씬 개수" 
              secondary={scenes.length} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="로딩 상태" 
              secondary={loading ? '로딩 중' : '완료'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="선택된 씬" 
              secondary={selectedSceneId || '없음'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="모달 상태" 
              secondary={modalOpen ? '열림' : '닫힘'} 
            />
          </ListItem>
          {error && (
            <ListItem>
              <ListItemText 
                primary="에러" 
                secondary={error} 
                sx={{ color: 'var(--color-danger)' }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    </Box>
  )
}

export default TimelineIntegrationTest 