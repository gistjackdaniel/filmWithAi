import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { sceneService, type Scene } from '../services/sceneService';
import { cutService, type Cut, type CutDraft, isCut, isCutDraft } from '../../cut/services/cutService';
import CutGenerationModal from '../../cut/components/CutGenerationModal';
import CutList from '../../cut/components/CutList';
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
  Tabs,
  Tab,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';

const SceneDetailPage: React.FC = () => {
  const { projectId, sceneId } = useParams<{ projectId: string; sceneId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [scene, setScene] = useState<Scene | null>(null);
  const [editData, setEditData] = useState<Scene | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [draftCuts, setDraftCuts] = useState<CutDraft[]>([]);
  const [isCutModalOpen, setIsCutModalOpen] = useState(false);
  const [isGeneratingCuts, setIsGeneratingCuts] = useState(false);
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set());
  const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
  const [activeCrewDept, setActiveCrewDept] = useState<string>('direction');
  const [activeEquipDept, setActiveEquipDept] = useState<string>('direction');

  const crewDepartments = [
    { key: 'direction', label: '연출팀' },
    { key: 'production', label: '제작팀' },
    { key: 'cinematography', label: '촬영팀' },
    { key: 'lighting', label: '조명팀' },
    { key: 'sound', label: '음향팀' },
    { key: 'art', label: '미술팀' },
  ] as const;

  const equipmentDepartments = [
    { key: 'direction', label: '연출 장비' },
    { key: 'production', label: '제작 장비' },
    { key: 'cinematography', label: '촬영 장비' },
    { key: 'lighting', label: '조명 장비' },
    { key: 'sound', label: '음향 장비' },
    { key: 'art', label: '미술 장비' },
  ] as const;

  const loadScene = useCallback(async () => {
    if (!projectId || !sceneId) return;

    try {
      // sceneService.getScene을 사용하여 씬 로드
      const fetchedScene = await sceneService.getScene(projectId, sceneId);
      setScene(fetchedScene);
      setEditData(fetchedScene);
    } catch (error) {
      console.error('씬 로드 실패:', error);
      alert('씬을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sceneId]);

  const loadCuts = useCallback(async () => {
    if (!projectId || !sceneId) return;

    try {
      const savedCuts = await cutService.findBySceneId(projectId, sceneId);
      setCuts(savedCuts);

      const draftKey = `cut_drafts_${projectId}_${sceneId}`;
      const draftData = localStorage.getItem(draftKey);
      let draftCuts: CutDraft[] = [];

      if (draftData) {
        try {
          draftCuts = JSON.parse(draftData);
        } catch (error) {
          console.error('Draft cuts 파싱 실패:', error);
          draftCuts = [];
        }
      }

      setDraftCuts(draftCuts);
    } catch (error) {
      console.error('컷 로드 실패:', error);
    }
  }, [projectId, sceneId]);
  
  useEffect(() => {
    loadScene();
    loadCuts();
  }, [projectId, sceneId]);

  useEffect(() => {
    if (location.state?.refresh && projectId && sceneId) {
      loadScene();
      loadCuts();
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.refresh, projectId, sceneId, loadScene, loadCuts, navigate, location.pathname]);

  useEffect(() => {
    const handleCutDraftUpdated = (event: CustomEvent) => {
      if (event.detail.projectId === projectId && event.detail.sceneId === sceneId) {
        const { draftOrder, updatedCut } = event.detail;
        const draftKey = `cut_drafts_${projectId}_${sceneId}`;

        if (updatedCut === null) {
          // 드래프트 삭제: draftCuts에서 제거하고 localStorage 반영
          setDraftCuts(prev => {
            const next = prev.filter(d => d.order !== draftOrder);
            localStorage.setItem(draftKey, JSON.stringify(next));
            return next;
          });
        } else {
          // 드래프트 업데이트: draftCuts 내 해당 order 교체
          setDraftCuts(prev => {
            const next = prev.map(d => (d.order === draftOrder ? updatedCut : d));
            localStorage.setItem(draftKey, JSON.stringify(next));
            return next;
          });
        }
      }
    };

    window.addEventListener('cutDraftUpdated', handleCutDraftUpdated as EventListener);
    return () => {
      window.removeEventListener('cutDraftUpdated', handleCutDraftUpdated as EventListener);
    };
  }, [projectId, sceneId]);

  const handleEdit = () => {
    // 편집 모드 시작
    setIsEditing(true);
  };

  const handleCancel = () => {
    // 원본 씬 데이터로 복원
    setEditData(scene);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!projectId || !sceneId || !editData) return;
    
    try {
      // MongoDB 내부 필드들을 제외하고 업데이트할 데이터만 추출
      const updateData = { ...editData };
      
      // 내부 필드들 제거 (타입 안전성을 위해 개별적으로 처리)
      delete (updateData as any)._id;
      delete (updateData as any).projectId;
      delete (updateData as any).isDeleted;
      delete (updateData as any).createdAt;
      delete (updateData as any).updatedAt;
      delete (updateData as any).__v;
      delete (updateData as any).id;

      // 중첩된 객체에서도 내부 필드들 제거
      const cleanUpdateData = JSON.parse(JSON.stringify(updateData));
      
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
      
      processData(cleanUpdateData);

      // crew 데이터 변환 로직 개선 - 백엔드 DTO 구조에 맞게 처리
      if (cleanUpdateData.crew) {
        console.log('Frontend - Before crew transformation:', JSON.stringify(cleanUpdateData.crew, null, 2));
        
        Object.keys(cleanUpdateData.crew).forEach(department => {
          const departmentData = cleanUpdateData.crew[department];
          if (departmentData && typeof departmentData === 'object') {
            Object.keys(departmentData).forEach(role => {
              const roleData = departmentData[role];
              console.log(`Processing ${department}.${role}:`, roleData);

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

              // 어떤 형태든 배열로 정규화
              departmentData[role] = toArray(roleData);
              console.log(`Normalized ${department}.${role} to array:`, departmentData[role]);
              
              // 각 멤버의 유효성 검사 및 필드 정리
              if (Array.isArray(departmentData[role])) {
                const beforeFilter = [...departmentData[role]];
                departmentData[role] = departmentData[role].filter((member: any) => {
                  if (!member || typeof member !== 'object') {
                    console.log(`Filtered out invalid member:`, member);
                    return false;
                  }

                  const roleVal = (member.role ?? '').toString().trim();
                  const contactVal = (member.contact ?? '').toString().trim();
                  const profileIdVal = (member.profileId ?? '').toString().trim();

                  // 빈/무효 profileId는 필드만 제거하고 멤버는 유지
                  if (!profileIdVal) {
                    delete member.profileId;
                  }
                  // 빈 연락처는 필드만 제거
                  if (!contactVal) {
                    delete member.contact;
                  }

                  const isAllEmpty = !roleVal && !contactVal && !profileIdVal;
                  if (isAllEmpty) {
                    console.log(`Filtered out member with all fields empty:`, member);
                    return false;
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
        
        console.log('Frontend - After crew transformation:', JSON.stringify(cleanUpdateData.crew, null, 2));
      }
      

      
      // sceneService.update를 사용하여 씬 업데이트
      const updatedScene = await sceneService.update(projectId, sceneId, cleanUpdateData);
      
      // 로컬 상태 업데이트
      setScene(updatedScene);
      setEditData(updatedScene);
      setIsEditing(false);
      
      // ProjectPage의 씬 목록을 새로고침하기 위해 이벤트 발생
      window.dispatchEvent(
        new CustomEvent('sceneSaved', {
          detail: { projectId, savedScene: updatedScene },
        }),
      );
      
      alert('씬이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('씬 업데이트 실패:', error);
      alert('씬 업데이트에 실패했습니다.');
    }
  };

  const handleGenerateCuts = async (options: { maxCuts: number }) => {
    if (!projectId || !sceneId) return;
    
    setIsGeneratingCuts(true);
    try {
      const savedCuts = cuts.filter(cut => isCut(cut));
      for (const cut of savedCuts) {
        await cutService.delete(projectId, sceneId, cut._id);
      }
      
      const draftKey = `cut_drafts_${projectId}_${sceneId}`;
      localStorage.removeItem(draftKey);
      
      setCuts([]);
      setDraftCuts([]);
      
      const generatedCuts = await cutService.createDraft(projectId, sceneId, options);
      localStorage.setItem(draftKey, JSON.stringify(generatedCuts));
      setDraftCuts(generatedCuts);
    } catch (error) {
      console.error('컷 생성 실패:', error);
      alert('컷 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingCuts(false);
    }
  };

  const handleBack = () => {
    // 프로젝트 페이지로 돌아가기
    navigate(`/project/${projectId}`);
  };

  const handleGenerateImage = async (cutId: string) => {
    if (!projectId || !sceneId) return;

    setGeneratingImages(prev => new Set(prev).add(cutId));

    try {
      await cutService.generateImage(projectId, sceneId, cutId);
      await loadCuts();
      alert('이미지가 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      alert('이미지 생성에 실패했습니다.');
    } finally {
      setGeneratingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(cutId);
        return newSet;
      });
    }
  };

  const handleCutRowClick = (cut: Cut | CutDraft) => {
    if (!projectId || !sceneId) return;
    cutService.navigateToCut(navigate, projectId, sceneId, cut);
  };

  const handleDeleteCut = async (cut: Cut | CutDraft, e?: React.MouseEvent) => {
    e?.stopPropagation?.();
    if (!projectId || !sceneId) return;

    const saved = isCut(cut);
    const key = saved ? `saved:${(cut as Cut)._id}` : `draft:${(cut as CutDraft).order}`;
    const confirmMsg = saved ? '이 컷을 삭제하시겠습니까? (되돌릴 수 없습니다)' : '이 드래프트 컷을 삭제하시겠습니까?';
    if (!window.confirm(confirmMsg)) return;

    setDeletingKeys(prev => new Set(prev).add(key));
    try {
      if (saved) {
        await cutService.delete(projectId, sceneId, (cut as Cut)._id);
        // 낙관적 업데이트: 재조회 없이 즉시 목록에서 제거
        setCuts(prev => prev.filter(c => c._id !== (cut as Cut)._id));
      } else {
        setDraftCuts(prev => {
          const next = prev.filter(d => d.order !== (cut as CutDraft).order);
          const draftKey = `cut_drafts_${projectId}_${sceneId}`;
          localStorage.setItem(draftKey, JSON.stringify(next));
          return next;
        });
      }
      alert('삭제되었습니다.');
    } catch (error) {
      console.error('컷 삭제 실패:', error);
      alert('컷 삭제에 실패했습니다.');
    } finally {
      setDeletingKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
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

  const isSectionCollapsed = (sectionId: string) => collapsedSections.has(sectionId);

  const handleInputChange = (field: keyof Scene, value: any) => {
    setEditData(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleNestedChange = (path: string, value: any) => {
    setEditData(prev => {
      if (!prev) return prev as any;
      const keys = path.split('.');
      const newData: any = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...(current[keys[i]] || {}) };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData as Scene;
    });
  };

  const handleArrayChange = useCallback((path: string, index: number, field: string, value: any) => {
    setEditData(prev => {
      if (!prev) return prev as any;
      const keys = path.split('.');
      const newData: any = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = Array.isArray(current[keys[i]]) ? [...current[keys[i]]] : { ...current[keys[i]] };
        current = current[keys[i]];
      }
      const lastKey = keys[keys.length - 1];
      const arr = Array.isArray(current[lastKey]) ? [...current[lastKey]] : [];
      arr[index] = { ...arr[index], [field]: value };
      current[lastKey] = arr;
      return newData as Scene;
    });
  }, []);

  const addArrayItem = useCallback((path: string, defaultItem: any) => {
    setEditData(prev => {
      if (!prev) return prev as any;
      const keys = path.split('.');
      const newData: any = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      const lastKey = keys[keys.length - 1];
      if (!current[lastKey] || !Array.isArray(current[lastKey])) current[lastKey] = [];
      current[lastKey] = [...current[lastKey], defaultItem];
      return newData as Scene;
    });
  }, []);

  const removeArrayItem = useCallback((path: string, index: number) => {
    setEditData(prev => {
      if (!prev) return prev as any;
      const keys = path.split('.');
      const newData: any = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      const lastKey = keys[keys.length - 1];
      const array = Array.isArray(current[lastKey]) ? [...current[lastKey]] : [];
      array.splice(index, 1);
      current[lastKey] = array;
      return newData as Scene;
    });
  }, []);

  const renderField = (label: string, value: any, field: string, type: string = 'text', options?: string[]) => (
    <Box sx={{ mb: 2 }}>
      {type !== 'checkbox' && (
        <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
          {label}
        </Typography>
      )}
      {isEditing ? (
        type === 'textarea' ? (
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof Scene, e.target.value)}
            placeholder={`${label}을 입력하세요`}
          />
        ) : type === 'checkbox' ? (
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(value)}
            onChange={(e) => handleInputChange(field as keyof Scene, e.target.checked)}
              />
            }
            label={label}
          />
        ) : type === 'select' && options ? (
          <TextField
            fullWidth
            select
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof Scene, e.target.value)}
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
            onChange={(e) => handleInputChange(field as keyof Scene, e.target.value)}
            placeholder={`${label}을 입력하세요`}
          />
        )
      ) : (
        <Typography variant="body1">{value || '미정'}</Typography>
      )}
    </Box>
  );

  const renderArrayField = (label: string, array: any[], path: string, itemFields: string[]) => {
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
                  <Button variant="text" color="error" onClick={() => removeArrayItem(path, index)}>
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

  const renderNestedField = (label: string, value: any, path: string, type: string = 'text') => (
    <Box sx={{ mb: 2 }}>
      {type !== 'checkbox' && (
        <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
          {label}
        </Typography>
      )}
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

  // AI가 추천하는 기본 크루 멤버 수를 정의
  // 제거됨: getDefaultCrewCount, createDefaultCrewMembers (LLM이 백엔드에서 보완)
  
  // LLM이 제공한 권장 인원수를 기반으로 placeholder 개수를 계산
  const getSuggestedCrewCount = (path: string, role: string): number => {
    try {
      const deptKey = path.split('.').pop() || '';
      // editData에 crewCounts가 있다고 가정하고 사용 (없으면 0)
      const counts: any = (editData as any)?.crewCounts;
      if (!counts) return 0;
      const deptCounts = counts[deptKey];
      if (!deptCounts) return 0;
      const roleCount = deptCounts[role];
      const n = typeof roleCount === 'number' ? roleCount : parseInt(String(roleCount));
      return Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
      return 0;
    }
  };

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

          // 편집 모드에서만 LLM 권장 인원수 기반 placeholder 생성
          if (isEditing && memberArray.length === 0) {
            const count = getSuggestedCrewCount(path, role);
            if (count > 0) {
              memberArray = Array.from({ length: count }, () => ({ role: '', contact: '', profileId: '' }));
            }
          }

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

  if (isLoading) {
  return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center' }}>
          <Typography>로딩 중...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!scene || !editData) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center' }}>
          <Typography>씬을 찾을 수 없습니다.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={isGeneratingCuts || generatingImages.size > 0}
          >
          ← 뒤로가기
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h1">{isEditing ? '씬 편집' : '씬 상세'}</Typography>
          </Box>
          {isEditing ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleCancel}
                disabled={isGeneratingCuts || generatingImages.size > 0}
              >
                취소
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={isGeneratingCuts || generatingImages.size > 0}
              >
                저장
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => setIsCutModalOpen(true)}
                disabled={isGeneratingCuts || generatingImages.size > 0}
              >
                컷 생성
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleEdit}
                disabled={isGeneratingCuts || generatingImages.size > 0}
              >
                편집
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <TableContainer>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'black' }}>
                <TableCell sx={{ color: 'white', width: 64 }}>Cut</TableCell>
                <TableCell sx={{ color: 'white', width: '45%' }}>Video</TableCell>
                <TableCell sx={{ color: 'white', width: '35%' }}>Context</TableCell>
                <TableCell sx={{ color: 'white', width: 100 }}>Audio</TableCell>
                <TableCell sx={{ color: 'white', width: 80 }}>Time</TableCell>
                <TableCell sx={{ color: 'white', width: 80, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...cuts, ...draftCuts].map((cut, idx) => (
                <TableRow key={`cut_row_${idx}`} hover sx={{ cursor: 'pointer' }} onClick={() => handleCutRowClick(cut as any)}>
                  <TableCell>{cut.order}</TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">{cut.title || '-'}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {cut.cameraSetup?.shotSize ? `샷: ${cut.cameraSetup.shotSize}` : '-'}
                      </Typography>
                      {('imageUrl' in cut) && (cut as any).imageUrl && (
                        <Box sx={{ mt: 1, maxWidth: 160 }}>
                          <img
                            src={`http://localhost:5001${(cut as any).imageUrl}`}
                            alt={`컷 ${cut.order}`}
                            style={{ width: '100%', height: 100, objectFit: 'contain', borderRadius: 4 }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {cut.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {cut.soundEffects || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cut.estimatedDuration || 5}s</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      startIcon={<DeleteIcon />}
                      onClick={(e) => handleDeleteCut(cut as any, e)}
                      disabled={deletingKeys.has(isCut(cut as any) ? `saved:${(cut as any)._id}` : `draft:${(cut as any).order}`) || isGeneratingCuts || generatingImages.size > 0}
                    >
                      삭제
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box>
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleSection('basic')}
          >
            <Typography variant="h2">기본 정보</Typography>
            {isSectionCollapsed('basic') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('basic') && (
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

        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleSection('dialogues')}
          >
            <Typography variant="h2">대사</Typography>
            {isSectionCollapsed('dialogues') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('dialogues') && (
            <Box sx={{ mt: 2 }}>
              {renderArrayField('대사', editData.dialogues, 'dialogues', ['character', 'text'])}
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleSection('lighting')}
          >
            <Typography variant="h2">조명</Typography>
            {isSectionCollapsed('lighting') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('lighting') && (
            <>
              <Box sx={{ mt: 2 }}>
              {renderNestedField('조명 설명', editData.lighting?.description, 'lighting.description', 'textarea')}
              </Box>

              <Box sx={{ mt: 1 }}>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  조명 설정
                </Typography>
              
                <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    키 라이트
                  </Typography>
                  {renderNestedField('타입', editData.lighting?.setup?.keyLight?.type, 'lighting.setup.keyLight.type')}
                  {renderNestedField('장비', editData.lighting?.setup?.keyLight?.equipment, 'lighting.setup.keyLight.equipment')}
                  {renderNestedField('강도', editData.lighting?.setup?.keyLight?.intensity, 'lighting.setup.keyLight.intensity')}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    필 라이트
                  </Typography>
                  {renderNestedField('타입', editData.lighting?.setup?.fillLight?.type, 'lighting.setup.fillLight.type')}
                  {renderNestedField('장비', editData.lighting?.setup?.fillLight?.equipment, 'lighting.setup.fillLight.equipment')}
                  {renderNestedField('강도', editData.lighting?.setup?.fillLight?.intensity, 'lighting.setup.fillLight.intensity')}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    백 라이트
                  </Typography>
                  {renderNestedField('타입', editData.lighting?.setup?.backLight?.type, 'lighting.setup.backLight.type')}
                  {renderNestedField('장비', editData.lighting?.setup?.backLight?.equipment, 'lighting.setup.backLight.equipment')}
                  {renderNestedField('강도', editData.lighting?.setup?.backLight?.intensity, 'lighting.setup.backLight.intensity')}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    배경 라이트
                  </Typography>
                  {renderNestedField('타입', editData.lighting?.setup?.backgroundLight?.type, 'lighting.setup.backgroundLight.type')}
                  {renderNestedField('장비', editData.lighting?.setup?.backgroundLight?.equipment, 'lighting.setup.backgroundLight.equipment')}
                  {renderNestedField('강도', editData.lighting?.setup?.backgroundLight?.intensity, 'lighting.setup.backgroundLight.intensity')}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    특수 효과
                  </Typography>
                  {renderNestedField('타입', editData.lighting?.setup?.specialEffects?.type, 'lighting.setup.specialEffects.type')}
                  {renderNestedField('장비', editData.lighting?.setup?.specialEffects?.equipment, 'lighting.setup.specialEffects.equipment')}
                  {renderNestedField('강도', editData.lighting?.setup?.specialEffects?.intensity, 'lighting.setup.specialEffects.intensity')}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    소프트 라이트
                  </Typography>
                  {renderNestedField('타입', editData.lighting?.setup?.softLight?.type, 'lighting.setup.softLight.type')}
                  {renderNestedField('장비', editData.lighting?.setup?.softLight?.equipment, 'lighting.setup.softLight.equipment')}
                  {renderNestedField('강도', editData.lighting?.setup?.softLight?.intensity, 'lighting.setup.softLight.intensity')}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    전체 설정
                  </Typography>
                  {renderNestedField('색온도', editData.lighting?.setup?.overall?.colorTemperature, 'lighting.setup.overall.colorTemperature')}
                  {renderNestedField('분위기', editData.lighting?.setup?.overall?.mood, 'lighting.setup.overall.mood')}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    Grip 수정자
                  </Typography>

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
                                const newFlags = (editData.lighting?.setup?.gripModifier?.flags || []).filter((_: any, i: number) => i !== index);
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
                                const newDiffusion = (editData.lighting?.setup?.gripModifier?.diffusion || []).filter((_: any, i: number) => i !== index);
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
                                const newReflectors = (editData.lighting?.setup?.gripModifier?.reflectors || []).filter((_: any, i: number) => i !== index);
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
                                const newColorGels = (editData.lighting?.setup?.gripModifier?.colorGels || []).filter((_: any, i: number) => i !== index);
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

        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleSection('location')}
          >
            <Typography variant="h2">위치</Typography>
            {isSectionCollapsed('location') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('location') && (
            <Box sx={{ mt: 2 }}>
              {renderField('씬 장소', editData.scenePlace, 'scenePlace')}
              {renderNestedField('위치 이름', editData.location?.name, 'location.name')}
              {renderNestedField('주소', editData.location?.address, 'location.address')}
              {renderNestedField('그룹명', editData.location?.group_name, 'location.group_name')}
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleSection('environment')}
          >
            <Typography variant="h2">환경</Typography>
            {isSectionCollapsed('environment') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('environment') && (
            <Box sx={{ mt: 2 }}>
              {renderField('날씨', editData.weather, 'weather')}
              {renderField('시각적 설명', editData.visualDescription, 'visualDescription', 'textarea')}
              {renderField('VFX 필요', editData.vfxRequired, 'vfxRequired', 'checkbox')}
              {renderField('SFX 필요', editData.sfxRequired, 'sfxRequired', 'checkbox')}
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleSection('specialRequirements')}
          >
            <Typography variant="h2">특별 요구사항</Typography>
            {isSectionCollapsed('specialRequirements') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('specialRequirements') && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                특별 요구사항
              </Typography>
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
                          const newRequirements = (editData.specialRequirements || []).filter((_: any, i: number) => i !== index);
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

        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleSection('cast')}
          >
            <Typography variant="h2">출연진</Typography>
            {isSectionCollapsed('cast') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('cast') && (
            <Box sx={{ mt: 2 }}>
              {renderArrayField('주연', editData.cast, 'cast', ['role', 'name'])}
              {renderArrayField('엑스트라', editData.extra, 'extra', ['role', 'number'])}
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleSection('staff')}
          >
            <Typography variant="h2">스태프</Typography>
            {isSectionCollapsed('staff') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('staff') && (
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
                  <Tab key={d.key} value={d.key} label={d.label} />
                ))}
              </Tabs>

              {(() => {
                const selected = crewDepartments.find((d) => d.key === (activeCrewDept as any));
                return selected
                  ? renderCrewSection(selected.label, (editData.crew as any)?.[selected.key], `crew.${selected.key}`)
                  : null;
              })()}
            </Box>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: 'pointer' }}
            onClick={() => toggleSection('equipment')}
          >
            <Typography variant="h2">장비</Typography>
            {isSectionCollapsed('equipment') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('equipment') && (
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
                  <Tab key={d.key} value={d.key} label={d.label} />
                ))}
              </Tabs>

              {(() => {
                const selected = equipmentDepartments.find((d) => d.key === (activeEquipDept as any));
                return selected
                  ? renderEquipmentSection(
                      selected.label,
                      (editData.equipment as any)?.[selected.key],
                      `equipment.${selected.key}`,
                    )
                  : null;
              })()}
            </Box>
          )}
        </Paper>
      </Box>

      <CutGenerationModal
        isOpen={isCutModalOpen}
        onClose={() => setIsCutModalOpen(false)}
        onGenerate={handleGenerateCuts}
        isGenerating={isGeneratingCuts}
      />
    </Container>
  );
};

export default SceneDetailPage; 