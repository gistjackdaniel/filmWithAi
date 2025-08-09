import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { sceneService, type SceneDraft } from '../services/sceneService';
import {
  Container,
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Divider,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


const SceneDraftDetailPage: React.FC = () => {
  const { projectId, sceneId } = useParams<{ projectId: string; sceneId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [scene, setScene] = useState<SceneDraft | null>(null);
  const [editData, setEditData] = useState<SceneDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // location.state에서 prop 받기
  const { draftScene, draftOrder } = location.state || {};

  useEffect(() => {
    loadScene();
  }, [projectId, sceneId]);

  // draft 업데이트 이벤트 리스너
  useEffect(() => {
    const handleDraftUpdated = (event: CustomEvent) => {
      if (event.detail.projectId === projectId && event.detail.draftOrder === draftOrder) {
        setScene(event.detail.updatedScene);
        setEditData(event.detail.updatedScene);
      }
    };

    window.addEventListener('draftUpdated', handleDraftUpdated as EventListener);
    
    return () => {
      window.removeEventListener('draftUpdated', handleDraftUpdated as EventListener);
    };
  }, [projectId, draftOrder]);

  const loadScene = async () => {
    if (!projectId || !sceneId) return;
    
    try {
      if (draftScene) {
        // prop으로 받은 draft 씬 사용
        setScene(draftScene);
        setEditData(draftScene);
      } else {
        alert('Draft 씬을 찾을 수 없습니다.');
        navigate(`/project/${projectId}`);
      }
    } catch (error) {
      console.error('Draft 씬 로드 실패:', error);
      alert('Draft 씬을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(scene);
    setIsEditing(false);
  };

  const handleSaveDraft = () => {
    if (!projectId || !editData || !sceneId) return;
    
    try {
      // state에서만 수정하고 편집 모드 종료
      setScene(editData);
      setIsEditing(false);
      
      // ProjectPage의 state 업데이트
      if (draftOrder !== undefined) {
        window.dispatchEvent(new CustomEvent('draftUpdated', {
          detail: { projectId, draftOrder, updatedScene: editData }
        }));
      }
      
      alert('편집이 완료되었습니다.');
    } catch (error) {
      console.error('편집 실패:', error);
      alert('편집에 실패했습니다.');
    }
  };

  const handleSaveToBackend = async () => {
    if (!projectId || !editData || !sceneId) return;
    
    try {
      // 백엔드에 씬 저장
      const savedScene = await sceneService.create(projectId, editData);
      
      // 성공했을 때만 localStorage에서 해당 draft 제거
      if (draftOrder !== undefined) {
        const draftKey = `scene_drafts_${projectId}`;
        const draftData = localStorage.getItem(draftKey);
        if (draftData) {
          try {
            const draftScenes = JSON.parse(draftData);
            const updatedDrafts = draftScenes.filter((draft: any) => draft.order !== draftOrder);
            localStorage.setItem(draftKey, JSON.stringify(updatedDrafts));
          } catch (error) {
            console.error('localStorage 업데이트 실패:', error);
          }
        }
      }
      
      // ProjectPage에 씬 저장 이벤트 발생
      window.dispatchEvent(new CustomEvent('sceneSaved', {
        detail: { 
          projectId, 
          savedScene: savedScene,
          draftOrder: draftOrder
        }
      }));
      
      alert('씬이 성공적으로 저장되었습니다.');
      
      // ProjectPage로 이동 (약간의 지연 후)
      setTimeout(() => {
        navigate(`/project/${projectId}`);
      }, 100);
    } catch (error) {
      console.error('씬 저장 실패:', error);
      alert('씬 저장에 실패했습니다.');
      // 실패 시에는 localStorage에서 draft를 지우지 않음
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionCollapsed = (sectionId: string) => {
    return collapsedSections.has(sectionId);
  };

  const handleInputChange = (field: keyof SceneDraft, value: any) => {
    setEditData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleNestedChange = (path: string, value: any) => {
    setEditData((prev) => {
      if (!prev) return prev;
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleArrayChange = (path: string, index: number, value: any) => {
    setEditData((prev) => {
      if (!prev) return prev;
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = [...current[keys[i]]];
        current = current[keys[i]];
      }
      
      current[index] = value;
      return newData;
    });
  };

  const addArrayItem = (path: string, defaultItem: any) => {
    setEditData((prev) => {
      if (!prev) return prev;
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      if (!current[lastKey] || !Array.isArray(current[lastKey])) {
        current[lastKey] = [];
      }
      current[lastKey] = [...current[lastKey]];
      current[lastKey].push(defaultItem);
      return newData;
    });
  };

  const removeArrayItem = (path: string, index: number) => {
    setEditData((prev) => {
      if (!prev) return prev;
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData as any;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      if (!current[lastKey]) {
        current[lastKey] = [];
      }
      current[lastKey] = [...current[lastKey]];
      current[lastKey].splice(index, 1);
      return newData;
    });
  };

  const handleBack = () => {
    navigate(`/project/${projectId}`);
  };

  // 단순화된 필드 렌더링 함수 (MUI 적용)
  const renderField = (
    label: string,
    value: any,
    field: string,
    type: string = 'text'
  ) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
        {label}
      </Typography>
      {isEditing ? (
        type === 'textarea' ? (
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={value || ''}
            onChange={(e) =>
              handleInputChange(field as keyof SceneDraft, e.target.value)
            }
            placeholder={`${label}을 입력하세요`}
          />
        ) : type === 'checkbox' ? (
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(value)}
                onChange={(e) =>
                  handleInputChange(
                    field as keyof SceneDraft,
                    e.target.checked
                  )
                }
              />
            }
            label={label}
          />
        ) : (
          <TextField
            fullWidth
            type={type}
            value={value || ''}
            onChange={(e) =>
              handleInputChange(field as keyof SceneDraft, e.target.value)
            }
            placeholder={`${label}을 입력하세요`}
          />
        )
      ) : (
        <Typography variant="body1">{value || '미정'}</Typography>
      )}
    </Box>
  );

  // 단순화된 배열 필드 렌더링 함수 (MUI 적용)
  const renderArrayField = (
    label: string,
    array: any[],
    path: string,
    itemFields: string[]
  ) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
        {label}
      </Typography>
      {isEditing ? (
        <Stack spacing={1}>
          {array?.map((item, index) => (
            <Paper
              key={`${path}_${index}_${JSON.stringify(item)}`}
              variant="outlined"
              sx={{ p: 1.5, bgcolor: 'background.paper' }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                {itemFields.map((field) => (
                  <TextField
                    key={field}
                    size="small"
                    label={field}
                    value={item[field] || ''}
                    onChange={(e) => {
                      const newItem = { ...item, [field]: e.target.value };
                      handleArrayChange(path, index, newItem);
                    }}
                  />
                ))}
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="text"
                  color="error"
                  onClick={() => removeArrayItem(path, index)}
                >
                  삭제
                </Button>
              </Stack>
            </Paper>
          ))}
          <Box>
            <Button
              variant="outlined"
              onClick={() => {
                const defaultItem = itemFields.reduce((acc, field) => {
                  (acc as any)[field] = '';
                  return acc;
                }, {} as any);
                addArrayItem(path, defaultItem);
              }}
            >
              + 추가
            </Button>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={1}>
          {array?.map((item, index) => (
            <Paper
              key={`${path}_${index}_${JSON.stringify(item)}`}
              variant="outlined"
              sx={{ p: 1.5, bgcolor: 'background.paper' }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {itemFields.map((field) => (
                  <Typography key={field} variant="body2">
                    {item[field] || '미정'}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );

  // 단순화된 중첩 필드 렌더링 함수 (MUI 적용)
  const renderNestedField = (
    label: string,
    value: any,
    path: string,
    type: string = 'text'
  ) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
        {label}
      </Typography>
      {isEditing ? (
        type === 'textarea' ? (
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={value || ''}
            onChange={(e) => handleNestedChange(path, e.target.value)}
            placeholder={`${label}을 입력하세요`}
          />
        ) : (
          <TextField
            fullWidth
            type={type}
            value={value || ''}
            onChange={(e) => handleNestedChange(path, e.target.value)}
            placeholder={`${label}을 입력하세요`}
          />
        )
      ) : (
        <Typography variant="body1">{value || '미정'}</Typography>
      )}
    </Box>
  );

  // 단순화된 크루 섹션 렌더링 함수 (MUI 적용)
  const renderCrewSection = (title: string, crewData: any, path: string) => (
    <Box sx={{ mb: 2 }}>
      {Object.entries(crewData || {}).map(([role, members]: [string, any]) => (
        <Paper key={role} variant="outlined" sx={{ p: 2, mb: 1 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>{role}</Typography>
          {isEditing ? (
            <Stack spacing={1}>
              {members?.map((member: any, index: number) => (
                <Stack
                  key={`${path}_${role}_${index}_${JSON.stringify(member)}`}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                >
                  <TextField
                    size="small"
                    label="역할"
                    value={member.role || ''}
                    onChange={(e) => {
                      const newMember = { ...member, role: e.target.value };
                      handleArrayChange(`${path}.${role}`, index, newMember);
                    }}
                  />
                  <TextField
                    size="small"
                    label="프로필 ID"
                    value={member.profileId || ''}
                    onChange={(e) => {
                      const newMember = { ...member, profileId: e.target.value };
                      handleArrayChange(`${path}.${role}`, index, newMember);
                    }}
                  />
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => removeArrayItem(`${path}.${role}`, index)}
                  >
                    삭제
                  </Button>
                </Stack>
              ))}
              <Box>
                <Button
                  variant="outlined"
                  onClick={() => {
                    addArrayItem(`${path}.${role}`, { role: '', profileId: '' });
                  }}
                >
                  + 추가
                </Button>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={1}>
              {members?.map((member: any, index: number) => (
                <Stack
                  key={`${path}_${role}_${index}_${JSON.stringify(member)}`}
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                >
                  <Typography variant="body2">{member.role || '미정'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.profileId || '미정'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      ))}
    </Box>
  );

  const renderEquipmentSection = (title: string, equipmentData: any, path: string) => (
    <Box sx={{ mb: 2 }}>
      {Object.entries(equipmentData || {}).map(([category, items]: [string, any]) => (
        <Paper key={category} variant="outlined" sx={{ p: 2, mb: 1 }}>
          <Typography variant="h3" sx={{ mb: 1 }}>{category}</Typography>
          {isEditing ? (
            <Box>
              {Array.isArray(items) ? (
                <Stack spacing={1}>
                  {items?.map((item: string, index: number) => (
                    <Stack key={`${path}_${category}_${index}_${item}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <TextField
                        size="small"
                        label="장비명"
                        value={item || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = e.target.value;
                          handleNestedChange(`${path}.${category}`, newItems);
                        }}
                      />
                      <Box sx={{ flex: 1 }} />
                      <Button
                        variant="text"
                        color="error"
                        onClick={() => {
                          const newItems = items.filter((_: any, i: number) => i !== index);
                          handleNestedChange(`${path}.${category}`, newItems);
                        }}
                      >
                        삭제
                      </Button>
                    </Stack>
                  ))}
                  <Box>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        const newItems = [...(items || []), ''];
                        handleNestedChange(`${path}.${category}`, newItems);
                      }}
                    >
                      + 추가
                    </Button>
                  </Box>
                </Stack>
              ) : (
                <Box>
                  {Object.entries(items || {}).map(([subCategory, subItems]: [string, any]) => (
                    <Paper key={subCategory} variant="outlined" sx={{ p: 2, mb: 1 }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>{subCategory}</Typography>
                      {Array.isArray(subItems) ? (
                        <Stack spacing={1}>
                          {subItems?.map((item: string, index: number) => (
                            <Stack key={`${path}_${category}_${subCategory}_${index}_${item}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                              <TextField
                                size="small"
                                label="장비명"
                                value={item || ''}
                                onChange={(e) => {
                                  const newSubItems = [...subItems];
                                  newSubItems[index] = e.target.value;
                                  handleNestedChange(`${path}.${category}.${subCategory}`, newSubItems);
                                }}
                              />
                              <Box sx={{ flex: 1 }} />
                              <Button
                                variant="text"
                                color="error"
                                onClick={() => {
                                  const newSubItems = subItems.filter((_: any, i: number) => i !== index);
                                  handleNestedChange(`${path}.${category}.${subCategory}`, newSubItems);
                                }}
                              >
                                삭제
                              </Button>
                            </Stack>
                          ))}
                          <Box>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                const newSubItems = [...(subItems || []), ''];
                                handleNestedChange(`${path}.${category}.${subCategory}`, newSubItems);
                              }}
                            >
                              + 추가
                            </Button>
                          </Box>
                        </Stack>
                      ) : (
                        <Typography variant="body2">{typeof subItems === 'string' ? subItems : '미정'}</Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              {Array.isArray(items) ? (
                <Stack spacing={1}>
                  {items?.map((item: string, index: number) => (
                    <Typography key={`${path}_${category}_${index}_${item}`} variant="body2">
                      {item || '미정'}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Box>
                  {Object.entries(items || {}).map(([subCategory, subItems]: [string, any]) => (
                    <Box key={subCategory} sx={{ mb: 1 }}>
                      <Typography variant="h4" sx={{ mb: 0.5 }}>{subCategory}</Typography>
                      {Array.isArray(subItems) ? (
                        <Stack spacing={0.5}>
                          {subItems?.map((item: string, index: number) => (
                            <Typography key={`${path}_${category}_${subCategory}_${index}_${item}`} variant="body2">
                              {item || '미정'}
                            </Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2">{typeof subItems === 'string' ? subItems : '미정'}</Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Paper>
      ))}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button variant="outlined" onClick={handleBack}>
            ← 뒤로가기
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h1">
              {isEditing ? '씬 초안 편집' : '씬 초안 상세'}
            </Typography>
          </Box>
          {isEditing ? (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" color="inherit" onClick={handleCancel}>
                취소
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveDraft}>
                저장
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handleEdit}>
                편집
              </Button>
              <Button variant="contained" color="secondary" onClick={handleSaveToBackend}>
                씬 저장
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {isLoading ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center' }}>
          <Typography>로딩 중...</Typography>
        </Paper>
      ) : !editData ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center' }}>
          <Typography>씬을 찾을 수 없습니다.</Typography>
        </Paper>
      ) : (
      <Box>
        {/* 기본 정보 */}
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => toggleSection('basic')}>
            <Typography variant="h2">기본 정보</Typography>
            {isSectionCollapsed('basic') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('basic') && editData && (
            <Box sx={{ mt: 2 }}>
              {renderField('순서', editData.order, 'order', 'number')}
              {renderField('제목', editData.title, 'title')}
              {renderField('설명', editData.description, 'description', 'textarea')}
              {renderField('예상 시간', editData.estimatedDuration, 'estimatedDuration')}
              {renderField('시간대', editData.timeOfDay, 'timeOfDay')}
              {renderField('씬 날짜/시간', editData.sceneDateTime, 'sceneDateTime')}
            </Box>
          )}
        </Paper>

        {/* 대사 */}
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => toggleSection('dialogues')}>
            <Typography variant="h2">대사</Typography>
            {isSectionCollapsed('dialogues') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('dialogues') && editData && (
            <Box sx={{ mt: 2 }}>
              {renderArrayField('대사', editData.dialogues, 'dialogues', ['character', 'text'])}
            </Box>
          )}
        </Paper>

        {/* 조명 */}
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => toggleSection('lighting')}>
            <Typography variant="h2">조명</Typography>
            {isSectionCollapsed('lighting') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('lighting') && editData && (
              <>
                <Box sx={{ mt: 2 }}>
                  {renderNestedField('조명 설명', editData.lighting?.description, 'lighting.description', 'textarea')}
                </Box>
                
            <Box sx={{ mt: 1 }}>
              <Typography variant="h3" sx={{ mb: 1 }}>조명 설정</Typography>
              
              {/* 키 라이트 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>키 라이트</Typography>
                    {renderNestedField('타입', editData.lighting?.setup?.keyLight?.type, 'lighting.setup.keyLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.keyLight?.equipment, 'lighting.setup.keyLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.keyLight?.intensity, 'lighting.setup.keyLight.intensity')}
              </Paper>

              {/* 필 라이트 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>필 라이트</Typography>
                    {renderNestedField('타입', editData.lighting?.setup?.fillLight?.type, 'lighting.setup.fillLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.fillLight?.equipment, 'lighting.setup.fillLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.fillLight?.intensity, 'lighting.setup.fillLight.intensity')}
              </Paper>

              {/* 백 라이트 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>백 라이트</Typography>
                    {renderNestedField('타입', editData.lighting?.setup?.backLight?.type, 'lighting.setup.backLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.backLight?.equipment, 'lighting.setup.backLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.backLight?.intensity, 'lighting.setup.backLight.intensity')}
              </Paper>

              {/* 배경 라이트 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>배경 라이트</Typography>
                    {renderNestedField('타입', editData.lighting?.setup?.backgroundLight?.type, 'lighting.setup.backgroundLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.backgroundLight?.equipment, 'lighting.setup.backgroundLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.backgroundLight?.intensity, 'lighting.setup.backgroundLight.intensity')}
              </Paper>

              {/* 특수 효과 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>특수 효과</Typography>
                    {renderNestedField('타입', editData.lighting?.setup?.specialEffects?.type, 'lighting.setup.specialEffects.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.specialEffects?.equipment, 'lighting.setup.specialEffects.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.specialEffects?.intensity, 'lighting.setup.specialEffects.intensity')}
              </Paper>

              {/* 소프트 라이트 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>소프트 라이트</Typography>
                    {renderNestedField('타입', editData.lighting?.setup?.softLight?.type, 'lighting.setup.softLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.softLight?.equipment, 'lighting.setup.softLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.softLight?.intensity, 'lighting.setup.softLight.intensity')}
              </Paper>

              {/* 전체 설정 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>전체 설정</Typography>
                    {renderNestedField('색온도', editData.lighting?.setup?.overall?.colorTemperature, 'lighting.setup.overall.colorTemperature')}
                    {renderNestedField('분위기', editData.lighting?.setup?.overall?.mood, 'lighting.setup.overall.mood')}
              </Paper>

              {/* Grip 수정자 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>Grip 수정자</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Flags</Typography>
                  {isEditing ? (
                    <Stack spacing={1}>
                      {editData.lighting?.setup?.gripModifier?.flags?.map((flag: string, index: number) => (
                        <Stack key={`flags_${index}_${flag}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            value={flag || ''}
                            onChange={(e) => {
                              const newFlags = [...(editData.lighting?.setup?.gripModifier?.flags || [])];
                              newFlags[index] = e.target.value;
                              handleNestedChange('lighting.setup.gripModifier.flags', newFlags);
                            }}
                            placeholder="Flag를 입력하세요"
                          />
                          <Box sx={{ flex: 1 }} />
                          <Button
                            variant="text"
                            color="error"
                            onClick={() => {
                              const newFlags = editData.lighting?.setup?.gripModifier?.flags.filter((_: any, i: number) => i !== index);
                              handleNestedChange('lighting.setup.gripModifier.flags', newFlags);
                            }}
                          >
                            삭제
                          </Button>
                        </Stack>
                      ))}
                      <Box>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const newFlags = [...(editData.lighting?.setup?.gripModifier?.flags || []), ''];
                            handleNestedChange('lighting.setup.gripModifier.flags', newFlags);
                          }}
                        >
                          + 추가
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    <Stack spacing={0.5}>
                      {editData.lighting?.setup?.gripModifier?.flags?.map((flag: string, index: number) => (
                        <Typography key={`flags_${index}_${flag}`} variant="body2">{flag || '미정'}</Typography>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Diffusion</Typography>
                  {isEditing ? (
                    <Stack spacing={1}>
                      {editData.lighting?.setup?.gripModifier?.diffusion?.map((diff: string, index: number) => (
                        <Stack key={`diffusion_${index}_${diff}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            value={diff || ''}
                            onChange={(e) => {
                              const newDiffusion = [...(editData.lighting?.setup?.gripModifier?.diffusion || [])];
                              newDiffusion[index] = e.target.value;
                              handleNestedChange('lighting.setup.gripModifier.diffusion', newDiffusion);
                            }}
                            placeholder="Diffusion을 입력하세요"
                          />
                          <Box sx={{ flex: 1 }} />
                          <Button
                            variant="text"
                            color="error"
                            onClick={() => {
                              const newDiffusion = editData.lighting?.setup?.gripModifier?.diffusion.filter((_: any, i: number) => i !== index);
                              handleNestedChange('lighting.setup.gripModifier.diffusion', newDiffusion);
                            }}
                          >
                            삭제
                          </Button>
                        </Stack>
                      ))}
                      <Box>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const newDiffusion = [...(editData.lighting?.setup?.gripModifier?.diffusion || []), ''];
                            handleNestedChange('lighting.setup.gripModifier.diffusion', newDiffusion);
                          }}
                        >
                          + 추가
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    <Stack spacing={0.5}>
                      {editData.lighting?.setup?.gripModifier?.diffusion?.map((diff: string, index: number) => (
                        <Typography key={`diffusion_${index}_${diff}`} variant="body2">{diff || '미정'}</Typography>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Reflectors</Typography>
                  {isEditing ? (
                    <Stack spacing={1}>
                      {editData.lighting?.setup?.gripModifier?.reflectors?.map((reflector: string, index: number) => (
                        <Stack key={`reflectors_${index}_${reflector}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            value={reflector || ''}
                            onChange={(e) => {
                              const newReflectors = [...(editData.lighting?.setup?.gripModifier?.reflectors || [])];
                              newReflectors[index] = e.target.value;
                              handleNestedChange('lighting.setup.gripModifier.reflectors', newReflectors);
                            }}
                            placeholder="Reflector를 입력하세요"
                          />
                          <Box sx={{ flex: 1 }} />
                          <Button
                            variant="text"
                            color="error"
                            onClick={() => {
                              const newReflectors = editData.lighting?.setup?.gripModifier?.reflectors.filter((_: any, i: number) => i !== index);
                              handleNestedChange('lighting.setup.gripModifier.reflectors', newReflectors);
                            }}
                          >
                            삭제
                          </Button>
                        </Stack>
                      ))}
                      <Box>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const newReflectors = [...(editData.lighting?.setup?.gripModifier?.reflectors || []), ''];
                            handleNestedChange('lighting.setup.gripModifier.reflectors', newReflectors);
                          }}
                        >
                          + 추가
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    <Stack spacing={0.5}>
                      {editData.lighting?.setup?.gripModifier?.reflectors?.map((reflector: string, index: number) => (
                        <Typography key={`reflectors_${index}_${reflector}`} variant="body2">{reflector || '미정'}</Typography>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>Color Gels</Typography>
                  {isEditing ? (
                    <Stack spacing={1}>
                      {editData.lighting?.setup?.gripModifier?.colorGels?.map((gel: string, index: number) => (
                        <Stack key={`colorGels_${index}_${gel}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <TextField
                            size="small"
                            value={gel || ''}
                            onChange={(e) => {
                              const newColorGels = [...(editData.lighting?.setup?.gripModifier?.colorGels || [])];
                              newColorGels[index] = e.target.value;
                              handleNestedChange('lighting.setup.gripModifier.colorGels', newColorGels);
                            }}
                            placeholder="Color Gel을 입력하세요"
                          />
                          <Box sx={{ flex: 1 }} />
                          <Button
                            variant="text"
                            color="error"
                            onClick={() => {
                              const newColorGels = editData.lighting?.setup?.gripModifier?.colorGels.filter((_: any, i: number) => i !== index);
                              handleNestedChange('lighting.setup.gripModifier.colorGels', newColorGels);
                            }}
                          >
                            삭제
                          </Button>
                        </Stack>
                      ))}
                      <Box>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const newColorGels = [...(editData.lighting?.setup?.gripModifier?.colorGels || []), ''];
                            handleNestedChange('lighting.setup.gripModifier.colorGels', newColorGels);
                          }}
                        >
                          + 추가
                        </Button>
                      </Box>
                    </Stack>
                  ) : (
                    <Stack spacing={0.5}>
                      {editData.lighting?.setup?.gripModifier?.colorGels?.map((gel: string, index: number) => (
                        <Typography key={`colorGels_${index}_${gel}`} variant="body2">{gel || '미정'}</Typography>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Box>
              </>
            )}
        </Paper>

          {/* 위치 */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => toggleSection('location')}>
              <Typography variant="h2">위치</Typography>
              {isSectionCollapsed('location') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </Stack>
            {!isSectionCollapsed('location') && editData && (
              <Box sx={{ mt: 2 }}>
                {renderField('씬 장소', editData.scenePlace, 'scenePlace')}
                {renderNestedField('위치 이름', editData.location?.name, 'location.name')}
                {renderNestedField('주소', editData.location?.address, 'location.address')}
                {renderNestedField('그룹명', editData.location?.group_name, 'location.group_name')}
              </Box>
            )}
          </Paper>

          {/* 환경 */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => toggleSection('environment')}>
              <Typography variant="h2">환경</Typography>
              {isSectionCollapsed('environment') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </Stack>
            {!isSectionCollapsed('environment') && editData && (
              <Box sx={{ mt: 2 }}>
                {renderField('날씨', editData.weather, 'weather')}
                {renderField('시각적 설명', editData.visualDescription, 'visualDescription', 'textarea')}
                {renderField('VFX 필요', editData.vfxRequired, 'vfxRequired', 'checkbox')}
                {renderField('SFX 필요', editData.sfxRequired, 'sfxRequired', 'checkbox')}
              </Box>
            )}
          </Paper>

          {/* 특별 요구사항 */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => toggleSection('specialRequirements')}>
              <Typography variant="h2">특별 요구사항</Typography>
              {isSectionCollapsed('specialRequirements') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </Stack>
            {!isSectionCollapsed('specialRequirements') && editData && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>특별 요구사항</Typography>
                {isEditing ? (
                  <Stack spacing={1}>
                    {editData.specialRequirements?.map((requirement: string, index: number) => (
                      <Stack key={`specialRequirements_${index}_${requirement}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          fullWidth
                          size="small"
                          value={requirement || ''}
                          onChange={(e) => {
                            const newRequirements = [...(editData.specialRequirements || [])];
                            newRequirements[index] = e.target.value;
                            handleInputChange('specialRequirements', newRequirements);
                          }}
                          placeholder="특별 요구사항을 입력하세요"
                        />
                        <Box sx={{ flex: 1 }} />
                        <Button
                          variant="text"
                          color="error"
                          onClick={() => {
                            const newRequirements = editData.specialRequirements.filter((_: any, i: number) => i !== index);
                            handleInputChange('specialRequirements', newRequirements);
                          }}
                        >
                          삭제
                        </Button>
                      </Stack>
                    ))}
                    <Box>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          const newRequirements = [...(editData.specialRequirements || []), ''];
                          handleInputChange('specialRequirements', newRequirements);
                        }}
                      >
                        + 추가
                      </Button>
                    </Box>
                  </Stack>
                ) : (
                  <Stack spacing={0.5}>
                    {editData.specialRequirements?.map((requirement: string, index: number) => (
                      <Typography key={`specialRequirements_${index}_${requirement}`} variant="body2">
                        {requirement || '미정'}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Paper>

          {/* 출연진 */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => toggleSection('cast')}>
              <Typography variant="h2">출연진</Typography>
              {isSectionCollapsed('cast') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </Stack>
            {!isSectionCollapsed('cast') && editData && (
              <Box sx={{ mt: 2 }}>
                {renderArrayField('주연', editData.cast, 'cast', ['role', 'name'])}
                {renderArrayField('엑스트라', editData.extra, 'extra', ['role', 'number'])}
              </Box>
            )}
          </Paper>

          {/* 스태프 */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => toggleSection('staff')}>
              <Typography variant="h2">스태프</Typography>
              {isSectionCollapsed('staff') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </Stack>
            {!isSectionCollapsed('staff') && editData && (
              <Box sx={{ mt: 2 }}>
                {renderCrewSection('연출팀', editData.crew?.direction, 'crew.direction')}
                {renderCrewSection('제작팀', editData.crew?.production, 'crew.production')}
                {renderCrewSection('촬영팀', editData.crew?.cinematography, 'crew.cinematography')}
                {renderCrewSection('조명팀', editData.crew?.lighting, 'crew.lighting')}
                {renderCrewSection('음향팀', editData.crew?.sound, 'crew.sound')}
                {renderCrewSection('미술팀', editData.crew?.art, 'crew.art')}
              </Box>
            )}
          </Paper>

          {/* 장비 */}
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => toggleSection('equipment')}>
              <Typography variant="h2">장비</Typography>
              {isSectionCollapsed('equipment') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </Stack>
            {!isSectionCollapsed('equipment') && editData && (
              <Box sx={{ mt: 2 }}>
                {renderEquipmentSection('연출 장비', editData.equipment?.direction, 'equipment.direction')}
                {renderEquipmentSection('제작 장비', editData.equipment?.production, 'equipment.production')}
                {renderEquipmentSection('촬영 장비', editData.equipment?.cinematography, 'equipment.cinematography')}
                {renderEquipmentSection('조명 장비', editData.equipment?.lighting, 'equipment.lighting')}
                {renderEquipmentSection('음향 장비', editData.equipment?.sound, 'equipment.sound')}
                {renderEquipmentSection('미술 장비', editData.equipment?.art, 'equipment.art')}
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default SceneDraftDetailPage; 