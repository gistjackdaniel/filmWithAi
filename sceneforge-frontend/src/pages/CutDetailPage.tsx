import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { cutService, type Cut } from '../services/cutService';
import './SceneDetailPage.css';

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
      
      alert('컷이 성공적으로 업데이트되었습니다.');
      navigate(`/project/${projectId}/scene/${sceneId}`);
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
    <div className="field">
      <label>{label}</label>
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof Cut, e.target.value)}
            rows={4}
          />
        ) : type === 'number' ? (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof Cut, Number(e.target.value))}
          />
        ) : type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleInputChange(field as keyof Cut, e.target.checked)}
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof Cut, e.target.value)}
          />
        )
      ) : (
        <div className="field-value">{type === 'checkbox' ? (value ? '예' : '아니오') : (value || '미정')}</div>
      )}
    </div>
  );

  const renderArrayField = (label: string, array: any[], path: string, itemFields: string[]) => (
    <div className="array-field">
      <label>{label}</label>
      {isEditing ? (
        <div className="array-items">
          {array?.map((item, index) => (
            <div key={`${path}_${index}`} className="array-item">
              {itemFields.map((field) => (
                <input
                  key={field}
                  type="text"
                  value={item[field] || ''}
                  onChange={(e) => handleArrayChange(path, index, { ...item, [field]: e.target.value })}
                  placeholder={field}
                />
              ))}
              <button
                type="button"
                onClick={() => removeArrayItem(path, index)}
                className="remove-btn"
              >
                삭제
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const defaultItem = itemFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
              addArrayItem(path, defaultItem);
            }}
            className="add-btn"
          >
            + 추가
          </button>
        </div>
      ) : (
        <div className="array-display">
          {array?.map((item, index) => (
            <div key={`${path}_${index}`} className="array-item-display">
              <span>{itemFields.map(field => item[field]).join(' - ') || '미정'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderNestedField = (label: string, value: any, path: string, type: string = 'text') => (
    <div className="field">
      <label>{label}</label>
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => handleNestedChange(path, e.target.value)}
            rows={4}
          />
        ) : type === 'number' ? (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleNestedChange(path, Number(e.target.value))}
          />
        ) : type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleNestedChange(path, e.target.checked)}
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleNestedChange(path, e.target.value)}
          />
        )
      ) : (
        <div className="field-value">{type === 'checkbox' ? (value ? '예' : '아니오') : (value || '미정')}</div>
      )}
    </div>
  );

  const renderCameraSetupSection = () => (
    <div className={`section ${isSectionCollapsed('cameraSetup') ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={() => toggleSection('cameraSetup')}>
        <h3>카메라 설정</h3>
        <span>{isSectionCollapsed('cameraSetup') ? '▼' : '▲'}</span>
      </div>
      {!isSectionCollapsed('cameraSetup') && (
        <div className="section-content">
          {renderNestedField('샷 사이즈', editData?.cameraSetup?.shotSize, 'cameraSetup.shotSize')}
          {renderNestedField('앵글 방향', editData?.cameraSetup?.angleDirection, 'cameraSetup.angleDirection')}
          {renderNestedField('카메라 움직임', editData?.cameraSetup?.cameraMovement, 'cameraSetup.cameraMovement')}
          {renderNestedField('렌즈 사양', editData?.cameraSetup?.lensSpecs, 'cameraSetup.lensSpecs')}
          
          <div className="subsection">
            <h4>카메라 설정</h4>
            {renderNestedField('조리개', editData?.cameraSetup?.cameraSettings?.aperture, 'cameraSetup.cameraSettings.aperture')}
            {renderNestedField('셔터 스피드', editData?.cameraSetup?.cameraSettings?.shutterSpeed, 'cameraSetup.cameraSettings.shutterSpeed')}
            {renderNestedField('ISO', editData?.cameraSetup?.cameraSettings?.iso, 'cameraSetup.cameraSettings.iso')}
          </div>
        </div>
      )}
    </div>
  );

  const renderSpecialRequirementsSection = () => (
    <div className={`section ${isSectionCollapsed('specialRequirements') ? 'collapsed' : ''}`}>
      <div className="section-header" onClick={() => toggleSection('specialRequirements')}>
        <h3>특수 요구사항</h3>
        <span>{isSectionCollapsed('specialRequirements') ? '▼' : '▲'}</span>
      </div>
      {!isSectionCollapsed('specialRequirements') && (
        <div className="section-content">
          <div className="subsection">
            <h4>특수 촬영</h4>
            {renderNestedField('드론 촬영', editData?.specialRequirements?.specialCinematography?.drone, 'specialRequirements.specialCinematography.drone', 'checkbox')}
            {renderNestedField('크레인 촬영', editData?.specialRequirements?.specialCinematography?.crane, 'specialRequirements.specialCinematography.crane', 'checkbox')}
            {renderNestedField('집 촬영', editData?.specialRequirements?.specialCinematography?.jib, 'specialRequirements.specialCinematography.jib', 'checkbox')}
            {renderNestedField('수중 촬영', editData?.specialRequirements?.specialCinematography?.underwater, 'specialRequirements.specialCinematography.underwater', 'checkbox')}
            {renderNestedField('공중 촬영', editData?.specialRequirements?.specialCinematography?.aerial, 'specialRequirements.specialCinematography.aerial', 'checkbox')}
          </div>
          <div className="subsection">
            <h4>특수 효과</h4>
            {renderNestedField('VFX', editData?.specialRequirements?.specialEffects?.vfx, 'specialRequirements.specialEffects.vfx', 'checkbox')}
            {renderNestedField('폭발 효과', editData?.specialRequirements?.specialEffects?.pyrotechnics, 'specialRequirements.specialEffects.pyrotechnics', 'checkbox')}
            {renderNestedField('연기 효과', editData?.specialRequirements?.specialEffects?.smoke, 'specialRequirements.specialEffects.smoke', 'checkbox')}
            {renderNestedField('안개 효과', editData?.specialRequirements?.specialEffects?.fog, 'specialRequirements.specialEffects.fog', 'checkbox')}
            {renderNestedField('바람 효과', editData?.specialRequirements?.specialEffects?.wind, 'specialRequirements.specialEffects.wind', 'checkbox')}
            {renderNestedField('비 효과', editData?.specialRequirements?.specialEffects?.rain, 'specialRequirements.specialEffects.rain', 'checkbox')}
            {renderNestedField('눈 효과', editData?.specialRequirements?.specialEffects?.snow, 'specialRequirements.specialEffects.snow', 'checkbox')}
            {renderNestedField('불 효과', editData?.specialRequirements?.specialEffects?.fire, 'specialRequirements.specialEffects.fire', 'checkbox')}
            {renderNestedField('폭발', editData?.specialRequirements?.specialEffects?.explosion, 'specialRequirements.specialEffects.explosion', 'checkbox')}
            {renderNestedField('스턴트', editData?.specialRequirements?.specialEffects?.stunt, 'specialRequirements.specialEffects.stunt', 'checkbox')}
          </div>
          <div className="subsection">
            <h4>특수 조명</h4>
            {renderNestedField('레이저 조명', editData?.specialRequirements?.specialLighting?.laser, 'specialRequirements.specialLighting.laser', 'checkbox')}
            {renderNestedField('스트로브 조명', editData?.specialRequirements?.specialLighting?.strobe, 'specialRequirements.specialLighting.strobe', 'checkbox')}
            {renderNestedField('블랙라이트', editData?.specialRequirements?.specialLighting?.blackLight, 'specialRequirements.specialLighting.blackLight', 'checkbox')}
            {renderNestedField('UV 라이트', editData?.specialRequirements?.specialLighting?.uvLight, 'specialRequirements.specialLighting.uvLight', 'checkbox')}
            {renderNestedField('무빙라이트', editData?.specialRequirements?.specialLighting?.movingLight, 'specialRequirements.specialLighting.movingLight', 'checkbox')}
            {renderNestedField('컬러체인저', editData?.specialRequirements?.specialLighting?.colorChanger, 'specialRequirements.specialLighting.colorChanger', 'checkbox')}
          </div>
          <div className="subsection">
            <h4>안전</h4>
            {renderNestedField('의료진 필요', editData?.specialRequirements?.safety?.requiresMedic, 'specialRequirements.safety.requiresMedic', 'checkbox')}
            {renderNestedField('소방 안전 필요', editData?.specialRequirements?.safety?.requiresFireSafety, 'specialRequirements.safety.requiresFireSafety', 'checkbox')}
            {renderNestedField('안전 담당관 필요', editData?.specialRequirements?.safety?.requiresSafetyOfficer, 'specialRequirements.safety.requiresSafetyOfficer', 'checkbox')}
          </div>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!cut || !editData) {
    return <div className="error">컷을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="scene-detail-page">
      <div className="header">
        <button onClick={handleBack} className="back-btn" disabled={isGeneratingImage}>
          ← 뒤로가기
        </button>
        <h1>{isEditing ? '컷 편집' : '컷 상세'}</h1>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="header-btn cancel-btn" disabled={isGeneratingImage}>
                취소
              </button>
              <button onClick={handleSave} className="header-btn save-btn" disabled={isGeneratingImage}>
                저장
              </button>
            </>
          ) : (
            <>
              <button onClick={handleEdit} className="header-btn edit-btn" disabled={isGeneratingImage}>
                편집
              </button>
              <button 
                onClick={handleGenerateImage} 
                className="header-btn generate-image-btn"
                disabled={isGeneratingImage}
              >
                {isGeneratingImage ? '이미지 생성 중...' : '이미지 생성'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="content">
        {/* 컷 이미지 */}
        {cut?.imageUrl && (
          <div className={`section ${isSectionCollapsed('image') ? 'collapsed' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('image')}>
              <h2>컷 이미지</h2>
              <button className="toggle-btn">
                {isSectionCollapsed('image') ? '▼' : '▲'}
              </button>
            </div>
            {!isSectionCollapsed('image') && (
              <div className="cut-image-container">
                <img src={`http://localhost:5001${cut.imageUrl}`} alt={`컷 ${cut.order} 이미지`} />
              </div>
            )}
          </div>
        )}
        
        {/* 기본 정보 */}
        <div className={`section ${isSectionCollapsed('basic') ? 'collapsed' : ''}`}>
          <div className="section-header" onClick={() => toggleSection('basic')}>
            <h2>기본 정보</h2>
            <button className="toggle-btn">
              {isSectionCollapsed('basic') ? '▼' : '▲'}
            </button>
          </div>
          {!isSectionCollapsed('basic') && editData && (
            <>
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
            </>
          )}
        </div>
        
        {renderCameraSetupSection()}
        {renderSpecialRequirementsSection()}
        
        {/* 피사체 움직임 */}
        <div className={`section ${isSectionCollapsed('subjectMovement') ? 'collapsed' : ''}`}>
          <div className="section-header" onClick={() => toggleSection('subjectMovement')}>
            <h2>피사체 움직임</h2>
            <button className="toggle-btn">
              {isSectionCollapsed('subjectMovement') ? '▼' : '▲'}
            </button>
          </div>
          {!isSectionCollapsed('subjectMovement') && editData && (
            renderArrayField('피사체 움직임', editData.subjectMovement || [], 'subjectMovement', ['name', 'type', 'position', 'action', 'emotion', 'description'])
          )}
        </div>
      </div>
    </div>
  );
};

export default CutDetailPage; 