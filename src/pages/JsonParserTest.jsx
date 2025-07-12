import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Button, 
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material'
import { 
  ExpandMore,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Refresh
} from '@mui/icons-material'
import toast from 'react-hot-toast'

const JsonParserTest = () => {
  const [inputJson, setInputJson] = useState('')
  const [parsedData, setParsedData] = useState(null)
  const [parseMethod, setParseMethod] = useState('')
  const [parsingTime, setParsingTime] = useState(0)
  const [selectedScene, setSelectedScene] = useState(null)

  // JSON 파싱 함수
  const parseJson = (content) => {
    const startTime = performance.now()
    let conteList = []
    let method = ''

    try {
      // 1. 직접 JSON 파싱 시도
      let parsed = null
      
      console.log('🔍 원본 응답 분석:', {
        contentType: typeof content,
        contentLength: content.length,
        contentPreview: content.substring(0, 200) + '...'
      })
      
      try {
        parsed = JSON.parse(content)
        console.log('✅ 직접 JSON 파싱 성공')
        method = '직접 JSON 파싱'
      } catch (parseError) {
        console.log('❌ 직접 JSON 파싱 실패:', parseError.message)
        
        // 2. 키-값 쌍 파싱 시도
        console.log('🔍 개별 키-값 쌍 파싱 시도...')
        
        // 개선된 키-값 쌍 추출 함수
        const extractKeyValuePairs = (text) => {
          const keyValuePairs = {}
          
          // JSON 객체 내부의 키-값 쌍을 찾는 정규식
          const keyValueRegex = /"([^"]+)"\s*:\s*("([^"]*)"|(\{[^}]*\})|(\[[^\]]*\]))|"([^"]+)"\s*:\s*([^,}\]]+)/g
          
          let match
          while ((match = keyValueRegex.exec(text)) !== null) {
            const key = match[1] || match[6]
            let value = match[2] || match[7]
            
            // 문자열 값에서 따옴표 제거
            if (value && value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1)
            }
            
            // 쉼표 제거
            if (value && value.endsWith(',')) {
              value = value.slice(0, -1)
            }
            
            // 숫자 값 변환
            if (value === 'true') value = true
            else if (value === 'false') value = false
            else if (!isNaN(value) && value.trim() !== '') value = Number(value)
            
            // 객체나 배열인 경우 JSON 파싱 시도
            if (value && (value.startsWith('{') || value.startsWith('['))) {
              try {
                value = JSON.parse(value)
              } catch (e) {
                // 파싱 실패 시 문자열로 유지
                console.log(`⚠️ 객체 파싱 실패 (${key}):`, value)
              }
            }
            
            keyValuePairs[key] = value
          }
          
          return keyValuePairs
        }
        
        // content에서 키-값 쌍 추출
        const keyValuePairs = extractKeyValuePairs(content)
        console.log('🔍 추출된 키-값 쌍:', keyValuePairs)
        
        if (Object.keys(keyValuePairs).length > 0) {
          const requiredKeys = ['id', 'scene', 'title', 'description']
          const hasRequiredKeys = requiredKeys.some(key => keyValuePairs[key] !== undefined)
          
          if (hasRequiredKeys) {
            const cardObject = {
              id: keyValuePairs.id || 'scene_1',
              scene: keyValuePairs.scene || 1,
              title: keyValuePairs.title || '기본 씬',
              description: keyValuePairs.description || '설명 없음',
              dialogue: keyValuePairs.dialogue || '',
              cameraAngle: keyValuePairs.cameraAngle || '',
              cameraWork: keyValuePairs.cameraWork || '',
              characterLayout: keyValuePairs.characterLayout || '',
              props: keyValuePairs.props || '',
              weather: keyValuePairs.weather || '',
              lighting: keyValuePairs.lighting || '',
              visualDescription: keyValuePairs.visualDescription || '',
              transition: keyValuePairs.transition || '',
              lensSpecs: keyValuePairs.lensSpecs || '',
              visualEffects: keyValuePairs.visualEffects || '',
              type: keyValuePairs.type || 'live_action',
              estimatedDuration: keyValuePairs.estimatedDuration || '5분',
              keywords: keyValuePairs.keywords || {
                userInfo: '기본 사용자',
                location: '기본 장소',
                date: '2024-01-01',
                equipment: '기본 장비',
                cast: ['기본 배우'],
                props: ['기본 소품'],
                lighting: '기본 조명',
                weather: '맑음',
                timeOfDay: '주간',
                specialRequirements: []
              },
              weights: keyValuePairs.weights || {
                locationPriority: 1,
                equipmentPriority: 1,
                castPriority: 1,
                timePriority: 1,
                complexity: 1
              },
              canEdit: keyValuePairs.canEdit !== undefined ? keyValuePairs.canEdit : true,
              lastModified: keyValuePairs.lastModified || new Date().toISOString(),
              modifiedBy: keyValuePairs.modifiedBy || 'AI'
            }
            
            parsed = { conteList: [cardObject] }
            method = '키-값 쌍 파싱'
            console.log('✅ 키-값 쌍 파싱 성공:', cardObject)
          }
        }
      }
      
      // 파싱된 결과에서 conteList 추출
      if (parsed) {
        console.log('파싱된 객체 키들:', Object.keys(parsed))
        
        const possibleArrayKeys = ['conteList', 'scenes', 'cards', 'list', 'items']
        let foundArray = null
        let foundKey = null
        
        for (const key of possibleArrayKeys) {
          if (parsed[key] && Array.isArray(parsed[key])) {
            foundArray = parsed[key]
            foundKey = key
            break
          }
        }
        
        if (foundArray) {
          conteList = foundArray
          console.log(`✅ ${foundKey} 배열 사용:`, conteList.length)
        } else if (Array.isArray(parsed)) {
          conteList = parsed
          console.log('✅ 배열 형태 사용:', conteList.length)
        } else {
          conteList = [parsed]
          console.log('✅ 단일 객체를 배열로 변환:', conteList.length)
        }
      } else {
        console.log('❌ 파싱 실패, 기본 구조로 변환')
        conteList = [{
          id: 'scene_1',
          scene: 1,
          title: '기본 씬',
          description: content.length > 200 ? content.substring(0, 200) + '...' : content,
          dialogue: '',
          cameraAngle: '',
          cameraWork: '',
          characterLayout: '',
          props: '',
          weather: '',
          lighting: '',
          visualDescription: '',
          transition: '',
          lensSpecs: '',
          visualEffects: '',
          type: 'live_action',
          estimatedDuration: '5분',
          keywords: {
            userInfo: '기본 사용자',
            location: '기본 장소',
            date: '2024-01-01',
            equipment: '기본 장비',
            cast: ['기본 배우'],
            props: ['기본 소품'],
            lighting: '기본 조명',
            weather: '맑음',
            timeOfDay: '주간',
            specialRequirements: []
          },
          weights: {
            locationPriority: 1,
            equipmentPriority: 1,
            castPriority: 1,
            timePriority: 1,
            complexity: 1
          },
          canEdit: true,
          lastModified: new Date().toISOString(),
          modifiedBy: 'AI'
        }]
        method = '기본 구조 생성'
      }
    } catch (error) {
      console.error('파싱 오류:', error)
      conteList = []
      method = '파싱 실패'
    }

    const endTime = performance.now()
    const parsingTimeMs = endTime - startTime

    return { conteList, method, parsingTimeMs }
  }

  // 파싱 실행 함수
  const handleParse = () => {
    if (!inputJson.trim()) {
      toast.error('JSON 데이터를 입력해주세요.')
      return
    }

    const result = parseJson(inputJson)
    setParsedData(result.conteList)
    setParseMethod(result.method)
    setParsingTime(result.parsingTimeMs)
    
    toast.success(`${result.conteList.length}개의 씬을 파싱했습니다. (${result.method})`)
  }

  // 실제 API 응답 테스트 함수
  const handleApiTest = async () => {
    try {
      console.log('🧪 실제 API 응답 테스트 시작...')
      
      // 테스트용 JSON 데이터 (올바른 형태)
      const sampleJsonData = `{
        "conteList": [
          {
            "id": "scene_1",
            "scene": 1,
            "title": "삶의 의미를 찾는 이안",
            "description": "이안은 인공지능 개발팀의 리더로서 인간의 감정을 이해할 수 있는 인공지능을 개발하기 위해 고군분투한다. 그는 인간으로서의 정체성을 잃지 않으려는 의지와 인공지능의 가능성 사이에서 갈등을 겪고 있다.",
            "dialogue": "이안: '인공지능이 감정을 이해할 수 있다면, 우리는 무엇을 잃게 될까?'",
            "cameraAngle": "중앙에서 이안을 클로즈업으로 잡으며, 그의 심각한 표정을 강조한다.",
            "cameraWork": "카메라는 이안의 얼굴에서 그의 손이 타이핑하는 키보드로 천천히 이동한다.",
            "characterLayout": "이안은 책상에 앉아 있고, 주변에는 컴퓨터와 각종 장비들이 놓여 있다.",
            "props": "컴퓨터, 키보드, 노트, 필기구",
            "weather": "실내 장면으로 날씨는 고려하지 않음",
            "lighting": "부드러운 조명으로 이안의 얼굴에 집중되도록 설정",
            "visualDescription": "이안이 컴퓨터 화면을 응시하며 깊은 고민에 빠진 모습",
            "transition": "이안의 표정에서 컴퓨터 화면으로의 전환",
            "lensSpecs": "50mm 렌즈, f/1.8 조리개로 얕은 심도로 초점을 맞춤",
            "visualEffects": "컴퓨터 화면에 인공지능 관련 코드가 흐르는 그래픽",
            "type": "live_action",
            "estimatedDuration": "2분",
            "keywords": {
              "userInfo": "이안",
              "location": "이안의 사무실",
              "date": "미래, 특정 날짜 없음",
              "equipment": "카메라, 조명 장비",
              "cast": ["이안"],
              "props": ["컴퓨터", "키보드", "노트", "필기구"],
              "lighting": "부드러운 조명",
              "weather": "실내",
              "timeOfDay": "낮",
              "specialRequirements": ["프로그래밍 코드 그래픽"]
            },
            "weights": {
              "locationPriority": 1,
              "equipmentPriority": 1,
              "castPriority": 1,
              "timePriority": 1,
              "complexity": 1
            },
            "canEdit": true,
            "lastModified": "",
            "modifiedBy": ""
          }
        ]
      }`
      
      setInputJson(sampleJsonData)
      
      // 자동으로 파싱 테스트 실행
      setTimeout(() => {
        handleParse()
      }, 100)
      
    } catch (error) {
      console.error('API 테스트 오류:', error)
      toast.error('API 테스트에 실패했습니다.')
    }
  }

  // 씬 상세 정보 렌더링 함수
  const renderSceneDetails = (scene) => {
    const keyGroups = {
      '기본 정보': ['id', 'scene', 'title', 'description', 'type', 'estimatedDuration'],
      '촬영 정보': ['dialogue', 'cameraAngle', 'cameraWork', 'characterLayout', 'lensSpecs'],
      '장면 설정': ['props', 'weather', 'lighting', 'visualDescription', 'transition', 'visualEffects'],
      '키워드': ['keywords'],
      '가중치': ['weights'],
      '메타데이터': ['canEdit', 'lastModified', 'modifiedBy']
    }

    return (
      <Box>
        {Object.entries(keyGroups).map(([groupName, keys]) => (
          <Accordion key={groupName} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" color="primary">
                {groupName}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {keys.map(key => {
                  const value = scene[key]
                  if (value === undefined) return null
                  
                  return (
                    <Grid item xs={12} key={key}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                              {key}
                            </Typography>
                            <Chip 
                              label={typeof value} 
                              size="small" 
                              color={typeof value === 'object' ? 'secondary' : 'primary'}
                            />
                          </Box>
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: 'grey.50', 
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem'
                          }}>
                            {typeof value === 'object' ? (
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <Typography variant="body2">
                                {String(value)}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          JSON 파싱 테스트 페이지
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI 콘티 생성 응답의 JSON 파싱을 테스트합니다.
        </Typography>
      </Box>

      {/* 입력 영역 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              JSON 데이터 입력
            </Typography>
            <Box>
              <Button 
                variant="contained" 
                onClick={handleParse}
                sx={{ mr: 1 }}
              >
                파싱 테스트
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleApiTest}
              >
                API 응답 테스트
              </Button>
            </Box>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="JSON 데이터를 입력하세요..."
            variant="outlined"
            sx={{ fontFamily: 'monospace' }}
          />
        </CardContent>
      </Card>

      {/* 파싱 결과 */}
      {parsedData && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                파싱 결과
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label={`${parsedData.length}개 씬`} color="success" />
                <Chip label={parseMethod} color="primary" />
                <Chip label={`${parsingTime.toFixed(2)}ms`} color="secondary" />
              </Box>
            </Box>

            {/* 씬 목록 */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {parsedData.map((scene, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 }
                    }}
                    onClick={() => setSelectedScene(selectedScene === index ? null : index)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                          {scene.title || `씬 ${scene.scene || index + 1}`}
                        </Typography>
                        <Chip 
                          label={scene.type || 'unknown'} 
                          color={scene.type === 'live_action' ? 'warning' : 'success'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {scene.description || '설명 없음'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`ID: ${scene.id}`} size="small" />
                        <Chip label={`씬: ${scene.scene || index + 1}`} size="small" />
                        {scene.estimatedDuration && (
                          <Chip label={scene.estimatedDuration} size="small" />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* 선택된 씬 상세 정보 */}
            {selectedScene !== null && parsedData[selectedScene] && (
              <Box>
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  씬 {selectedScene + 1} 상세 정보
                </Typography>
                {renderSceneDetails(parsedData[selectedScene])}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default JsonParserTest 