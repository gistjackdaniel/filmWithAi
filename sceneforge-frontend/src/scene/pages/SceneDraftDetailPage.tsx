import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Tabs,
  Tab,
  MenuItem,
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
  const [activeCrewDept, setActiveCrewDept] = useState<string>('direction');
  const [activeEquipDept, setActiveEquipDept] = useState<string>('direction');

  const crewDepartments: Array<{ key: keyof NonNullable<SceneDraft['crew']>; label: string }> = [
    { key: 'direction', label: '연출팀' },
    { key: 'production', label: '제작팀' },
    { key: 'cinematography', label: '촬영팀' },
    { key: 'lighting', label: '조명팀' },
    { key: 'sound', label: '음향팀' },
    { key: 'art', label: '미술팀' },
  ];

  const equipmentDepartments: Array<{ key: keyof NonNullable<SceneDraft['equipment']>; label: string }> = [
    { key: 'direction', label: '연출 장비' },
    { key: 'production', label: '제작 장비' },
    { key: 'cinematography', label: '촬영 장비' },
    { key: 'lighting', label: '조명 장비' },
    { key: 'sound', label: '음향 장비' },
    { key: 'art', label: '미술 장비' },
  ];

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
    // 편집 모드 시작
    setIsEditing(true);
  };

  const handleCancel = () => {
    // 원본 씬 데이터로 복원
    setEditData(scene);
    setIsEditing(false);
  };

  const handleSaveDraft = () => {
    if (!projectId || !editData || !sceneId) return;
    
    try {
      // 로컬 상태에서만 수정하고 편집 모드 종료
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
      // MongoDB 내부 필드들을 제외하고 저장할 데이터만 추출
      const createData = { ...editData };
      
      // 내부 필드들 제거 (타입 안전성을 위해 개별적으로 처리)
      delete (createData as any)._id;
      delete (createData as any).projectId;
      delete (createData as any).isDeleted;
      delete (createData as any).createdAt;
      delete (createData as any).updatedAt;
      delete (createData as any).__v;
      delete (createData as any).id;

      // 중첩된 객체에서도 내부 필드들 제거 및 number 필드 숫자 변환
      const cleanCreateData = JSON.parse(JSON.stringify(createData));
      
      // 중첩된 객체들의 _id, id 필드 제거 및 number 필드 숫자 변환
      const processData = (obj: any) => {
        if (obj && typeof obj === 'object') {
          delete obj._id;
          delete obj.id;
          
          // number 필드를 숫자로 변환
          if (obj.number && typeof obj.number === 'string') {
            obj.number = parseInt(obj.number) || 1;
          }
          
          Object.values(obj).forEach(value => {
            if (value && typeof value === 'object') {
              processData(value);
            }
          });
        }
      };
      
      processData(cleanCreateData);

      // 필수 필드 정규화: timeOfDay enum 매핑 및 기본값, 불리언/리스트 기본값
      const allowedTimeOfDay = ['새벽', '아침', '점심', '저녁', '밤'];
      const normalizeTimeOfDay = (v: any) => (v === '오후' ? '점심' : v);
      if (!cleanCreateData.timeOfDay) {
        cleanCreateData.timeOfDay = '아침';
      } else {
        cleanCreateData.timeOfDay = normalizeTimeOfDay(cleanCreateData.timeOfDay);
        if (!allowedTimeOfDay.includes(cleanCreateData.timeOfDay)) {
          cleanCreateData.timeOfDay = '아침';
        }
      }
      if (typeof cleanCreateData.vfxRequired !== 'boolean') cleanCreateData.vfxRequired = false;
      if (typeof cleanCreateData.sfxRequired !== 'boolean') cleanCreateData.sfxRequired = false;
      if (!Array.isArray(cleanCreateData.specialRequirements)) cleanCreateData.specialRequirements = [];
      if (typeof cleanCreateData.order !== 'number') cleanCreateData.order = (typeof draftOrder === 'number' ? draftOrder : 1);

      // crew 데이터 변환 로직 개선 - 백엔드 DTO 구조에 맞게 처리
      if (cleanCreateData.crew) {
        console.log('Frontend - Before crew transformation:', JSON.stringify(cleanCreateData.crew, null, 2));
        
        Object.keys(cleanCreateData.crew).forEach(department => {
          const departmentData = cleanCreateData.crew[department];
          if (departmentData && typeof departmentData === 'object') {
            Object.keys(departmentData).forEach(role => {
              const roleData = departmentData[role];
              console.log(`Processing ${department}.${role}:`, roleData);
              
              // roleData가 배열이 아닌 경우 배열로 변환
              if (!Array.isArray(roleData)) {
                if (roleData && typeof roleData === 'object') {
                  // 중첩된 객체 구조인 경우 (예: { "0": [{ ... }] })
                  const members: any[] = [];
                  Object.values(roleData).forEach(value => {
                    if (Array.isArray(value)) {
                      members.push(...value);
                    } else if (value && typeof value === 'object' && (value as any).role !== undefined) {
                      members.push(value);
                    }
                  });
                  departmentData[role] = members;
                  console.log(`Converted ${department}.${role} to array:`, members);
                } else {
                  departmentData[role] = [];
                  console.log(`Set ${department}.${role} to empty array`);
                }
              }
              
              // 각 멤버의 유효성 검사 및 필드 정리
              if (Array.isArray(departmentData[role])) {
                const beforeFilter = [...departmentData[role]];
                departmentData[role] = departmentData[role].filter((member: any) => {
                  if (!member || typeof member !== 'object') {
                    console.log(`Filtered out invalid member:`, member);
                    return false;
                  }
                  
                  // role이 완전히 비어있는 경우만 제거 (공백은 허용)
                  if (member.role === undefined || member.role === null || member.role === '') {
                    console.log(`Filtered out member with empty role:`, member);
                    return false;
                  }
                  
                  // 빈 필드들 정리
                  if (member.profileId === '') {
                    delete member.profileId;
                    console.log(`Removed empty profileId from member:`, member);
                  }
                  if (member.contact === '') {
                    delete member.contact;
                    console.log(`Removed empty contact from member:`, member);
                  }
                  
                  console.log(`Kept member:`, member);
                  return true;
                });
                
                if (beforeFilter.length !== departmentData[role].length) {
                  console.log(`Filtered ${department}.${role}: ${beforeFilter.length} -> ${departmentData[role].length}`);
                }
              }
            });
          }
        });
        
        console.log('Frontend - After crew transformation:', JSON.stringify(cleanCreateData.crew, null, 2));
      }
      
      // sceneService.create를 사용하여 백엔드에 씬 저장
      const savedScene = await sceneService.create(projectId, cleanCreateData);
      
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
      
      // ProjectPage로 이동
      navigate(`/project/${projectId}`);
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

  const handleArrayChange = useCallback((path: string, index: number, field: string, value: any) => {
    setEditData((prev) => {
      if (!prev) return prev;
      const keys = path.split('.');
      const newData = { ...prev } as any;
      let current = newData as any;

      // 중간 경로는 객체로 안전하게 생성/복사
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      // 마지막 키는 배열로 보장하고 요소 업데이트
      const lastKey = keys[keys.length - 1];
      if (!current[lastKey] || !Array.isArray(current[lastKey])) {
        current[lastKey] = [];
      }
      const arr = [...current[lastKey]];
      arr[index] = { ...(arr[index] || {}), [field]: value };
      current[lastKey] = arr;

      return newData;
    });
  }, []);

  const addArrayItem = useCallback((path: string, defaultItem: any) => {
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
  }, []);

  const removeArrayItem = useCallback((path: string, index: number) => {
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
  }, []);

  const handleBack = () => {
    // 프로젝트 페이지로 돌아가기
    navigate(`/project/${projectId}`);
  };

  // 단순화된 필드 렌더링 함수 (MUI 적용)
  const renderField = (
    label: string,
    value: any,
    field: string,
    type: string = 'text',
    options?: string[]
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
        ) : type === 'select' && options ? (
          <TextField
            fullWidth
            select
            value={value || ''}
            onChange={(e) =>
              handleInputChange(field as keyof SceneDraft, e.target.value)
            }
            placeholder={`${label}을 선택하세요`}
          >
            {options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
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
  ) => {
    // 안정적인 key를 사용하여 재렌더링 방지
    const getStableKey = (index: number) => `${path}_${index}`;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          {label}
        </Typography>
        {isEditing ? (
          <Stack spacing={1}>
            {array?.map((item, index) => (
              <Paper
                key={getStableKey(index)}
                variant="outlined"
                sx={{ p: 1.5, bgcolor: 'background.paper' }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  {itemFields.map((field) => (
                    <TextField
                      key={`${getStableKey(index)}_${field}`}
                      size="small"
                      label={field}
                      value={item[field] || ''}
                      onChange={(e) => {
                        const newItem = { ...item, [field]: e.target.value };
                        handleArrayChange(path, index, field, newItem[field]);
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
                    // number 필드는 숫자로 초기화
                    if (field === 'number') {
                      (acc as any)[field] = 1;
                    } else {
                      (acc as any)[field] = '';
                    }
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
                key={getStableKey(index)}
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
  };

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
      <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>{title}</Typography>
        {Object.entries(crewData || {}).map(([role, members]: [string, any]) => {
          const isCrewMemberObject = (obj: any) =>
            obj && typeof obj === 'object' && (
              Object.prototype.hasOwnProperty.call(obj, 'role') ||
              Object.prototype.hasOwnProperty.call(obj, 'contact') ||
              Object.prototype.hasOwnProperty.call(obj, 'profileId')
            );

          const toArray = (input: any): any[] => {
            if (Array.isArray(input)) return input;
            if (isCrewMemberObject(input)) return [input];
            if (input && typeof input === 'object') {
              const result: any[] = [];
              Object.values(input).forEach((value) => {
                const normalized = toArray(value);
                normalized.forEach((item) => {
                  if (isCrewMemberObject(item)) {
                    result.push(item);
                  }
                });
              });
              return result;
            }
            return [];
          };

          let memberArray: any[] = toArray(members);
          // 읽기 모드에서는 빈 배열일 때 placeholder를 생성하지 않습니다.
 
          return (
            <Box key={role} sx={{ mb: 2 }}>
              <Typography variant="h4" sx={{ mb: 1, color: 'text.secondary' }}>
                ({memberArray.length}명)
              </Typography>
              {isEditing ? (
                <Stack spacing={1}>
                  {memberArray.map((member: any, index: number) => (
                    <Paper
                      key={`${path}_${role}_${index}`}
                      variant="outlined"
                      sx={{ p: 1.5, bgcolor: 'background.default' }}
                    >
                      <Stack spacing={2}>
                        <TextField
                          label="역할"
                          value={member.role || ''}
                          onChange={(e) => handleArrayChange(`${path}.${role}`, index, 'role', e.target.value)}
                          placeholder={getRoleName(role)}
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="연락처"
                          value={member.contact || ''}
                          onChange={(e) => handleArrayChange(`${path}.${role}`, index, 'contact', e.target.value)}
                          placeholder="010-1234-5678"
                          size="small"
                          fullWidth
                        />
                        <TextField
                          label="프로필 ID"
                          value={member.profileId || ''}
                          onChange={(e) => handleArrayChange(`${path}.${role}`, index, 'profileId', e.target.value)}
                          placeholder="프로필 ID (선택사항)"
                          size="small"
                          fullWidth
                        />
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => removeArrayItem(`${path}.${role}`, index)}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          제거
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={() => addArrayItem(`${path}.${role}`, { role: '', contact: '', profileId: '' })}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    + 추가
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  {memberArray.length > 0 ? (
                    memberArray.map((member: any, index: number) => {
                      if (!member || typeof member !== 'object') {
                        return null;
                      }

                      return (
                        <Paper
                          key={`${path}_${role}_${index}`}
                          variant="outlined"
                          sx={{ p: 1.5, bgcolor: 'background.default' }}
                        >
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={2}
                            alignItems={{ sm: 'center' }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 'medium', minWidth: '80px' }}>
                              {member.role || getRoleName(role)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '120px' }}>
                              {member.contact || '연락처 미정'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                              {member.profileId || '프로필 미정'}
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    }).filter(Boolean)
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      정보가 없습니다
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          );
        })}
      </Paper>
    </Box>
  );

  // 부서명을 한글로 변환하는 함수
  const getDepartmentName = (department: string) => {
    const departmentNames: { [key: string]: string } = {
      direction: '연출',
      production: '제작',
      cinematography: '촬영',
      lighting: '조명',
      sound: '사운드',
      art: '아트'
    };
    return departmentNames[department] || department;
  };

  // 역할명을 한글로 변환하는 함수
  const getRoleName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      director: '감독',
      assistantDirector: '부감독',
      scriptSupervisor: '스크립트 감독',
      continuity: '연속성 감독',
      producer: '제작자',
      lineProducer: '라인 제작자',
      productionManager: '제작 관리자',
      productionAssistant: '제작 어시스턴트',
      cinematographer: '촬영감독',
      cameraOperator: '카메라 오퍼레이터',
      firstAssistant: '퍼스트 어시스턴트',
      secondAssistant: '세컨드 어시스턴트',
      dollyGrip: '돌리 그립',
      gaffer: '개퍼',
      bestBoy: '베스트 보이',
      electrician: '일렉트리션',
      generatorOperator: '제너레이터 오퍼레이터',
      soundMixer: '사운드 믹서',
      boomOperator: '붐 오퍼레이터',
      soundAssistant: '사운드 어시스턴트',
      utility: '유틸리티',
      productionDesigner: '프로덕션 디자이너',
      artDirector: '아트 디렉터',
      setDecorator: '세트 데코레이터',
      propMaster: '소품 마스터',
      makeupArtist: '메이크업 아티스트',
      costumeDesigner: '코스튬 디자이너',
      hairStylist: '헤어 스타일리스트'
    };
    return roleNames[role] || role;
  };

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
                    <Stack key={`${path}_${category}_${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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
                            <Stack key={`${path}_${category}_${subCategory}_${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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
                                            <Typography key={`${path}_${category}_${index}`} variant="body2">
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
                            <Typography key={`${path}_${category}_${subCategory}_${index}`} variant="body2">
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
              {renderField('시간대', editData.timeOfDay, 'timeOfDay', 'select', ['새벽', '아침', '점심', '저녁', '밤'])}
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
                      <Stack key={`specialRequirements_${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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
                      <Typography key={`specialRequirements_${index}`} variant="body2">
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
                <Tabs
                  value={activeCrewDept}
                  onChange={(_, v) => setActiveCrewDept(v)}
                  variant="scrollable"
                  scrollButtons
                  allowScrollButtonsMobile
                  sx={{ mb: 2 }}
                >
                  {crewDepartments.map((d) => (
                    <Tab key={d.key as string} value={d.key} label={d.label} />
                  ))}
                </Tabs>

                {(() => {
                  const selected = crewDepartments.find((d) => d.key === (activeCrewDept as any));
                  return selected
                    ? renderCrewSection(
                        selected.label,
                        editData.crew?.[selected.key] as any,
                        `crew.${String(selected.key)}`,
                      )
                    : null;
                })()}
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
                <Tabs
                  value={activeEquipDept}
                  onChange={(_, v) => setActiveEquipDept(v)}
                  variant="scrollable"
                  scrollButtons
                  allowScrollButtonsMobile
                  sx={{ mb: 2 }}
                >
                  {equipmentDepartments.map((d) => (
                    <Tab key={d.key as string} value={d.key} label={d.label} />
                  ))}
                </Tabs>

                {(() => {
                  const selected = equipmentDepartments.find((d) => d.key === (activeEquipDept as any));
                  return selected
                    ? renderEquipmentSection(
                        selected.label,
                        editData.equipment?.[selected.key] as any,
                        `equipment.${String(selected.key)}`,
                      )
                    : null;
                })()}
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default SceneDraftDetailPage; 