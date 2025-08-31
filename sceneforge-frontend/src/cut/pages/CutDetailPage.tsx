import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { cutService, type Cut } from '../services/cutService';
import {
  Container,
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  TextField,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const CutDetailPage: React.FC = () => {
  const { projectId, sceneId, cutId } = useParams<{ projectId: string; sceneId: string; cutId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [cut, setCut] = useState<Cut | null>(null);
  const [editData, setEditData] = useState<Cut | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const loadCut = useCallback(async () => {
    if (!projectId || !sceneId || !cutId) return;

    try {
      // 백엔드에서 실제 저장된 컷 로드
      const fetchedCut = await cutService.findById(projectId, sceneId, cutId);
      setCut(fetchedCut);
      setEditData(fetchedCut);
    } catch (error) {
      console.error('컷 로드 실패:', error);
      alert('컷을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sceneId, cutId]);

  useEffect(() => {
    loadCut();
  }, [projectId, sceneId, cutId]);

  // refresh state가 있으면 최신 정보 불러오기
  useEffect(() => {
    if (location.state?.refresh && projectId && sceneId && cutId) {
      loadCut();
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.refresh, projectId, sceneId, cutId, loadCut, navigate, location.pathname]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(cut);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!projectId || !sceneId || !cutId || !editData) return;
    
    try {
      // 실제 저장된 컷을 업데이트
      const updatedCut = await cutService.update(projectId, sceneId, cutId, editData);
      
      // SceneDetailPage의 컷 목록을 새로고침하기 위해 이벤트 발생
      window.dispatchEvent(new CustomEvent('cutSaved', {
        detail: { projectId, sceneId, savedCut: updatedCut }
      }));
      
      // 현재 페이지에서 상태만 갱신하고 편집 모드 해제 (이미지 생성 버튼 유지)
      setCut(updatedCut);
      setEditData(updatedCut);
      setIsEditing(false);
      alert('컷이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('컷 업데이트 실패:', error);
      alert('컷 업데이트에 실패했습니다.');
    }
  };

  const handleBack = () => {
    navigate(`/project/${projectId}/scene/${sceneId}`);
  };

  const handleGenerateImage = async () => {
    if (!projectId || !sceneId || !cutId) return;
    
    setIsGeneratingImage(true);
    try {
      // 이미지 생성 API 호출
      await cutService.generateImage(projectId, sceneId, cutId);
      
      // 컷 정보 다시 로드 (이미지 URL이 포함된 최신 정보)
      await loadCut();
      
      alert('이미지가 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('이미지 생성 실패:', error);
      alert('이미지 생성에 실패했습니다.');
    } finally {
      setIsGeneratingImage(false);
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

  const handleInputChange = (field: keyof Cut, value: any) => {
    setEditData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (path: string, value: any) => {
    setEditData((prev: any) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleArrayChange = (path: string, index: number, value: any) => {
    setEditData((prev: any) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData;
      
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
      current[lastKey][index] = value;
      return newData;
    });
  };

  const addArrayItem = (path: string, defaultItem: any) => {
    setEditData((prev: any) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData;
      
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
      current[lastKey] = [...current[lastKey], defaultItem];
      return newData;
    });
  };

  const removeArrayItem = (path: string, index: number) => {
    setEditData((prev: any) => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      const lastKey = keys[keys.length - 1];
      if (current[lastKey] && Array.isArray(current[lastKey])) {
        current[lastKey] = current[lastKey].filter((_: any, i: number) => i !== index);
      }
      return newData;
    });
  };

  const renderField = (label: string, value: any, field: string, type: string = 'text') => (
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
            onChange={(e) => handleInputChange(field as keyof Cut, e.target.value)}
            placeholder={`${label}을 입력하세요`}
          />
        ) : type === 'checkbox' ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">{label}</Typography>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleInputChange(field as keyof Cut, e.target.checked)}
            />
          </Stack>
        ) : (
          <TextField
            fullWidth
            type={type}
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof Cut, type === 'number' ? Number(e.target.value) : e.target.value)}
            placeholder={`${label}을 입력하세요`}
          />
        )
      ) : (
        <Typography variant="body1">{type === 'checkbox' ? (value ? '예' : '아니오') : (value || '미정')}</Typography>
      )}
    </Box>
  );

  const renderArrayField = (label: string, array: any[], path: string, itemFields: string[]) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
        {label}
      </Typography>
      {isEditing ? (
        <Stack spacing={1}>
          {array?.map((item, index) => (
            <Paper key={`${path}_${index}`} variant="outlined" sx={{ p: 1.5, bgcolor: 'background.paper' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                {itemFields.map((field) => (
                  <TextField
                    key={`${path}_${index}_${field}`}
                    size="small"
                    label={field}
                    value={item[field] || ''}
                    onChange={(e) => handleArrayChange(path, index, { ...item, [field]: e.target.value })}
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
                const defaultItem = itemFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {} as any);
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
            <Paper key={`${path}_${index}`} variant="outlined" sx={{ p: 1.5, bgcolor: 'background.paper' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {itemFields.map((field) => (
                  <Typography key={`${path}_${index}_${field}`} variant="body2">
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
        ) : type === 'number' ? (
          <TextField
            fullWidth
            type="number"
            value={value || ''}
            onChange={(e) => handleNestedChange(path, Number(e.target.value))}
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
        <Typography variant="body1">{type === 'checkbox' ? (value ? '예' : '아니오') : (value || '미정')}</Typography>
      )}
    </Box>
  );

  const renderCheck = (label: string, path: string, checked: boolean | undefined, description: string) => (
    <Box sx={{ mb: 1 }}>
      <FormControlLabel
        control={<Checkbox checked={Boolean(checked)} onChange={(e) => handleNestedChange(path, e.target.checked)} />}
        label={label}
      />
      <Typography variant="caption" color="text.secondary" sx={{ ml: 5 }}>
        {description}
      </Typography>
    </Box>
  );

  const renderCameraSetupSection = () => (
    <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => toggleSection('cameraSetup')} sx={{ cursor: 'pointer' }}>
        <Typography variant="h2">카메라 설정</Typography>
        {isSectionCollapsed('cameraSetup') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
      </Stack>
      {!isSectionCollapsed('cameraSetup') && (
        <Box className="section-content" sx={{ mt: 2 }}>
          {renderNestedField('샷 사이즈', editData?.cameraSetup?.shotSize, 'cameraSetup.shotSize')}
          {renderNestedField('앵글 방향', editData?.cameraSetup?.angleDirection, 'cameraSetup.angleDirection')}
          {renderNestedField('카메라 움직임', editData?.cameraSetup?.cameraMovement, 'cameraSetup.cameraMovement')}
          {renderNestedField('렌즈 사양', editData?.cameraSetup?.lensSpecs, 'cameraSetup.lensSpecs')}
          
          <Box className="subsection">
            <Typography variant="h4" sx={{ mb: 1 }}>카메라 설정</Typography>
            {renderNestedField('조리개', editData?.cameraSetup?.cameraSettings?.aperture, 'cameraSetup.cameraSettings.aperture')}
            {renderNestedField('셔터 스피드', editData?.cameraSetup?.cameraSettings?.shutterSpeed, 'cameraSetup.cameraSettings.shutterSpeed')}
            {renderNestedField('ISO', editData?.cameraSetup?.cameraSettings?.iso, 'cameraSetup.cameraSettings.iso')}
          </Box>
        </Box>
      )}
    </Paper>
  );

  const renderSpecialRequirementsSection = () => (
    <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => toggleSection('specialRequirements')} sx={{ cursor: 'pointer' }}>
        <Typography variant="h2">특수 요구사항</Typography>
        {isSectionCollapsed('specialRequirements') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
      </Stack>
      {!isSectionCollapsed('specialRequirements') && (
        <Box className="section-content" sx={{ mt: 2 }}>
          {isEditing ? (
            <>
              <Box className="subsection" sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>특수 촬영</Typography>
                {renderCheck('드론 촬영', 'specialRequirements.specialCinematography.drone', editData?.specialRequirements?.specialCinematography?.drone, '항공 시퀀스를 위한 드론 촬영이 필요합니다.')}
                {renderCheck('크레인 촬영', 'specialRequirements.specialCinematography.crane', editData?.specialRequirements?.specialCinematography?.crane, '고각/저각 이동 및 대범위 카메라 워크를 위한 크레인 사용입니다.')}
                {renderCheck('집(지브) 촬영', 'specialRequirements.specialCinematography.jib', editData?.specialRequirements?.specialCinematography?.jib, '부드러운 상하/원호 이동을 위한 지브 암 사용입니다.')}
                {renderCheck('수중 촬영', 'specialRequirements.specialCinematography.underwater', editData?.specialRequirements?.specialCinematography?.underwater, '수중 하우징/장비를 이용한 수중 환경 촬영입니다.')}
                {renderCheck('공중 촬영', 'specialRequirements.specialCinematography.aerial', editData?.specialRequirements?.specialCinematography?.aerial, '헬리캠/항공기 등 공중 촬영 장비 활용입니다.')}
              </Box>
              <Box className="subsection" sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>특수 효과</Typography>
                {renderCheck('VFX', 'specialRequirements.specialEffects.vfx', editData?.specialRequirements?.specialEffects?.vfx, '후반 합성/디지털 효과가 필요합니다.')}
                {renderCheck('폭발 효과', 'specialRequirements.specialEffects.pyrotechnics', editData?.specialRequirements?.specialEffects?.pyrotechnics, '폭파/불꽃 등 화약 기반 효과가 포함됩니다.')}
                {renderCheck('연기 효과', 'specialRequirements.specialEffects.smoke', editData?.specialRequirements?.specialEffects?.smoke, '연기 발생 장치를 사용합니다.')}
                {renderCheck('안개 효과', 'specialRequirements.specialEffects.fog', editData?.specialRequirements?.specialEffects?.fog, '안개 머신을 사용합니다.')}
                {renderCheck('바람 효과', 'specialRequirements.specialEffects.wind', editData?.specialRequirements?.specialEffects?.wind, '대형 팬 등을 이용한 바람 효과입니다.')}
                {renderCheck('비 효과', 'specialRequirements.specialEffects.rain', editData?.specialRequirements?.specialEffects?.rain, '레인 머신/물 효과를 사용합니다.')}
                {renderCheck('눈 효과', 'specialRequirements.specialEffects.snow', editData?.specialRequirements?.specialEffects?.snow, '스노우 머신을 사용합니다.')}
                {renderCheck('불 효과', 'specialRequirements.specialEffects.fire', editData?.specialRequirements?.specialEffects?.fire, '화염 효과가 포함됩니다.')}
                {renderCheck('폭발', 'specialRequirements.specialEffects.explosion', editData?.specialRequirements?.specialEffects?.explosion, '폭발 특수 효과가 포함됩니다.')}
                {renderCheck('스턴트', 'specialRequirements.specialEffects.stunt', editData?.specialRequirements?.specialEffects?.stunt, '스턴트 연기 및 안전 장치가 필요합니다.')}
              </Box>
              <Box className="subsection" sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ mb: 1 }}>특수 조명</Typography>
                {renderCheck('레이저 조명', 'specialRequirements.specialLighting.laser', editData?.specialRequirements?.specialLighting?.laser, '레이저 빔/포인터 등 특수 광원을 사용합니다.')}
                {renderCheck('스트로브 조명', 'specialRequirements.specialLighting.strobe', editData?.specialRequirements?.specialLighting?.strobe, '빠른 점멸(플리커) 효과의 스트로브 사용입니다.')}
                {renderCheck('블랙라이트', 'specialRequirements.specialLighting.blackLight', editData?.specialRequirements?.specialLighting?.blackLight, '형광 연출을 위한 블랙라이트 사용입니다.')}
                {renderCheck('UV 라이트', 'specialRequirements.specialLighting.uvLight', editData?.specialRequirements?.specialLighting?.uvLight, '자외선(UV) 조명을 사용합니다.')}
                {renderCheck('무빙라이트', 'specialRequirements.specialLighting.movingLight', editData?.specialRequirements?.specialLighting?.movingLight, '무빙헤드 등 가변 조명을 사용합니다.')}
                {renderCheck('컬러체인저', 'specialRequirements.specialLighting.colorChanger', editData?.specialRequirements?.specialLighting?.colorChanger, '젤/컬러체인저로 색상 변화를 연출합니다.')}
              </Box>
              <Box className="subsection">
                <Typography variant="h4" sx={{ mb: 1 }}>안전</Typography>
                {renderCheck('의료진 필요', 'specialRequirements.safety.requiresMedic', editData?.specialRequirements?.safety?.requiresMedic, '현장 의료 인력 배치가 필요합니다.')}
                {renderCheck('소방 안전 필요', 'specialRequirements.safety.requiresFireSafety', editData?.specialRequirements?.safety?.requiresFireSafety, '소방 안전 인력/장비가 필요합니다.')}
                {renderCheck('안전 담당관 필요', 'specialRequirements.safety.requiresSafetyOfficer', editData?.specialRequirements?.safety?.requiresSafetyOfficer, '안전 감독관을 배치합니다.')}
              </Box>
            </>
          ) : (
            (() => {
              const sc = editData?.specialRequirements?.specialCinematography || {};
              const fx = editData?.specialRequirements?.specialEffects || {};
              const sl = editData?.specialRequirements?.specialLighting || {};
              const sf = editData?.specialRequirements?.safety || {};

              const scMap: Record<string, string> = {
                drone: '드론 촬영',
                crane: '크레인 촬영',
                jib: '집 촬영',
                underwater: '수중 촬영',
                aerial: '공중 촬영'
              };
              const fxMap: Record<string, string> = {
                vfx: 'VFX',
                pyrotechnics: '폭발 효과',
                smoke: '연기 효과',
                fog: '안개 효과',
                wind: '바람 효과',
                rain: '비 효과',
                snow: '눈 효과',
                fire: '불 효과',
                explosion: '폭발',
                stunt: '스턴트'
              };
              const slMap: Record<string, string> = {
                laser: '레이저 조명',
                strobe: '스트로브 조명',
                blackLight: '블랙라이트',
                uvLight: 'UV 라이트',
                movingLight: '무빙라이트',
                colorChanger: '컬러체인저'
              };
              const sfMap: Record<string, string> = {
                requiresMedic: '의료진 필요',
                requiresFireSafety: '소방 안전 필요',
                requiresSafetyOfficer: '안전 담당관 필요'
              };

              const pickTrue = (obj: any, map: Record<string, string>) =>
                Object.entries(map)
                  .filter(([k]) => Boolean((obj as any)?.[k]))
                  .map(([, label]) => label);

              const sections = [
                { title: '특수 촬영', items: pickTrue(sc, scMap) },
                { title: '특수 효과', items: pickTrue(fx, fxMap) },
                { title: '특수 조명', items: pickTrue(sl, slMap) },
                { title: '안전', items: pickTrue(sf, sfMap) }
              ];

              const hasAny = sections.some(s => s.items.length > 0);

              if (!hasAny) {
                return (
                  <Typography variant="body2" color="text.secondary">해당없음</Typography>
                );
              }

              return (
                <Box>
                  {sections.filter(s => s.items.length > 0).map(section => (
                    <Box key={section.title} sx={{ mb: 2 }}>
                      <Typography variant="h4" sx={{ mb: 1 }}>{section.title}</Typography>
                      <Stack spacing={0.5}>
                        {section.items.map((label) => (
                          <Typography key={label} variant="body2">{label}</Typography>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Box>
              );
            })()
          )}
        </Box>
      )}
    </Paper>
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

  if (!cut || !editData) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center' }}>
          <Typography>컷을 찾을 수 없습니다.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button onClick={handleBack} className="back-btn" variant="outlined">
            ← 뒤로가기
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h1">{isEditing ? '컷 편집' : '컷 상세'}</Typography>
          </Box>
          <div className="header-actions">
            {isEditing ? (
              <Stack direction="row" spacing={1}>
                <Button onClick={handleCancel} className="header-btn cancel-btn" variant="outlined" color="inherit">
                  취소
                </Button>
                <Button onClick={handleSave} className="header-btn save-btn" variant="contained" color="primary">
                  저장
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button onClick={handleEdit} className="header-btn edit-btn" variant="outlined">
                  편집
                </Button>
                <Button 
                  onClick={handleGenerateImage} 
                  className="header-btn generate-image-btn"
                  disabled={isGeneratingImage}
                  variant="contained"
                  color="secondary"
                >
                  {isGeneratingImage ? '이미지 생성 중...' : '이미지 생성'}
                </Button>
              </Stack>
            )}
          </div>
        </Stack>
      </Paper>

      <div className="content">
        {/* 컷 이미지 */}
        {cut?.imageUrl && (
          <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => toggleSection('image')} sx={{ cursor: 'pointer' }}>
              <Typography variant="h2">컷 이미지</Typography>
              {isSectionCollapsed('image') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </Stack>
            {!isSectionCollapsed('image') && (
              <Box className="cut-image-container" sx={{ mt: 2 }}>
                <img src={`http://localhost:5001${cut.imageUrl}`} alt={`컷 ${cut.order} 이미지`} />
              </Box>
            )}
          </Paper>
        )}
        
        {/* 기본 정보 */}
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => toggleSection('basic')} sx={{ cursor: 'pointer' }}>
            <Typography variant="h2">기본 정보</Typography>
            {isSectionCollapsed('basic') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('basic') && editData && (
            <Box sx={{ mt: 2 }}>
              {renderField('제목', editData.title, 'title')}
              {renderField('설명', editData.description, 'description', 'textarea')}
              {renderField('VFX 효과', editData.vfxEffects, 'vfxEffects', 'textarea')}
              {renderField('음향 효과', editData.soundEffects, 'soundEffects', 'textarea')}
              {renderField('감독 노트', editData.directorNotes, 'directorNotes', 'textarea')}
              {renderField('대사', editData.dialogue, 'dialogue', 'textarea')}
              {renderField('내레이션', editData.narration, 'narration', 'textarea')}
              {renderField('제작 방법', editData.productionMethod, 'productionMethod')}
              {renderField('제작 방법 선택 근거', editData.productionMethodReason, 'productionMethodReason', 'textarea')}
              {renderField('예상 지속 시간 (초)', editData.estimatedDuration, 'estimatedDuration', 'number')}
            </Box>
          )}
        </Paper>
        
        {renderCameraSetupSection()}
        {renderSpecialRequirementsSection()}
        
        {/* 피사체 움직임 */}
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" onClick={() => toggleSection('subjectMovement')} sx={{ cursor: 'pointer' }}>
            <Typography variant="h2">피사체 움직임</Typography>
            {isSectionCollapsed('subjectMovement') ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </Stack>
          {!isSectionCollapsed('subjectMovement') && editData && (
            <Box sx={{ mt: 2 }}>
              {renderArrayField('피사체 움직임', editData.subjectMovement || [], 'subjectMovement', ['name', 'type', 'position', 'action', 'emotion', 'description'])}
            </Box>
          )}
        </Paper>
      </div>
    </Container>
  );
};

export default CutDetailPage; 