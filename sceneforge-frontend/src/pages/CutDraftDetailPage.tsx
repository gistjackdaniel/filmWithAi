import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { cutService, type CutDraft } from '../services/cutService';
import './SceneDetailPage.css';

const CutDraftDetailPage: React.FC = () => {
  const { projectId, sceneId, cutId } = useParams<{ projectId: string; sceneId: string; cutId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [cut, setCut] = useState<CutDraft | null>(null);
  const [editData, setEditData] = useState<CutDraft | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // location.state에서 prop 받기
  const { draftCut, draftOrder } = location.state || {};

  useEffect(() => {
    loadCut();
  }, [projectId, sceneId, cutId]);

  // draft 업데이트 이벤트 리스너
  useEffect(() => {
    const handleCutDraftUpdated = (event: CustomEvent) => {
      if (event.detail.projectId === projectId && event.detail.draftOrder === draftOrder) {
        setCut(event.detail.updatedCut);
        setEditData(event.detail.updatedCut);
      }
    };

    window.addEventListener('cutDraftUpdated', handleCutDraftUpdated as EventListener);
    
    return () => {
      window.removeEventListener('cutDraftUpdated', handleCutDraftUpdated as EventListener);
    };
  }, [projectId, draftOrder]);

  const loadCut = async () => {
    if (!projectId || !sceneId || !cutId) return;
    
    try {
      if (draftCut) {
        // prop으로 받은 draft 컷 사용
        setCut(draftCut);
        setEditData(draftCut);
      } else {
        alert('Draft 컷을 찾을 수 없습니다.');
        navigate(`/project/${projectId}/scene/${sceneId}`);
      }
    } catch (error) {
      console.error('Draft 컷 로드 실패:', error);
      alert('Draft 컷을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(cut);
    setIsEditing(false);
  };

  const handleSaveDraft = () => {
    if (!projectId || !editData || !sceneId) return;
    
    try {
      // state에서만 수정하고 편집 모드 종료
      setCut(editData);
      setIsEditing(false);
      
      // SceneDetailPage의 state 업데이트
      if (draftOrder !== undefined) {
        window.dispatchEvent(new CustomEvent('cutDraftUpdated', {
          detail: { projectId, sceneId, draftOrder, updatedCut: editData }
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
      // DB 저장용 데이터 준비 (불필요한 필드 제거)
      const cutData = {
        order: editData.order,
        title: editData.title,
        description: editData.description,
        cameraSetup: editData.cameraSetup,
        vfxEffects: editData.vfxEffects,
        soundEffects: editData.soundEffects,
        directorNotes: editData.directorNotes,
        dialogue: editData.dialogue,
        narration: editData.narration,
        subjectMovement: editData.subjectMovement,
        productionMethod: editData.productionMethod,
        productionMethodReason: editData.productionMethodReason,
        estimatedDuration: editData.estimatedDuration,
        specialRequirements: editData.specialRequirements
      };
      
      // 백엔드에 컷 저장
      const savedCut = await cutService.create(projectId, sceneId, cutData);
      
      // 성공했을 때만 localStorage에서 해당 draft 제거
      if (editData && editData.order) {
        const draftKey = `cut_drafts_${projectId}_${sceneId}`;
        const draftData = localStorage.getItem(draftKey);
        if (draftData) {
          try {
            const draftCuts = JSON.parse(draftData);
            const updatedDrafts = draftCuts.filter((draft: any) => draft.order !== editData.order);
            localStorage.setItem(draftKey, JSON.stringify(updatedDrafts));
          } catch (error) {
            console.error('localStorage 업데이트 실패:', error);
          }
        }
      }
      
      // SceneDetailPage로 돌아가기
      navigate(`/project/${projectId}/scene/${sceneId}`, {
        state: {
          refresh: true,
          savedCut: savedCut
        }
      });
      
      alert('컷이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };



  const handleBack = () => {
    navigate(`/project/${projectId}/scene/${sceneId}`);
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

  const handleInputChange = (field: keyof CutDraft, value: any) => {
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
          current[keys[i]] = [];
        }
        current[keys[i]] = [...current[keys[i]]];
        current = current[keys[i]];
      }
      
      current[index] = { ...current[index], ...value };
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
          current[keys[i]] = [];
        }
        current[keys[i]] = [...current[keys[i]]];
        current = current[keys[i]];
      }
      
      current.push(defaultItem);
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
          current[keys[i]] = [];
        }
        current[keys[i]] = [...current[keys[i]]];
        current = current[keys[i]];
      }
      
      current.splice(index, 1);
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
            onChange={(e) => handleInputChange(field as keyof CutDraft, e.target.value)}
            rows={4}
          />
        ) : type === 'number' ? (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof CutDraft, Number(e.target.value))}
          />
        ) : type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleInputChange(field as keyof CutDraft, e.target.checked)}
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof CutDraft, e.target.value)}
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
    <div className="section">
      <div className="section-header" onClick={() => toggleSection('cameraSetup')}>
        <h3>카메라 설정</h3>
        <span>{isSectionCollapsed('cameraSetup') ? '▼' : '▲'}</span>
      </div>
      {!isSectionCollapsed('cameraSetup') && (
        <div className="section-content">
          {renderField('샷 사이즈', editData?.cameraSetup?.shotSize, 'cameraSetup.shotSize')}
          {renderField('앵글 방향', editData?.cameraSetup?.angleDirection, 'cameraSetup.angleDirection')}
          {renderField('카메라 움직임', editData?.cameraSetup?.cameraMovement, 'cameraSetup.cameraMovement')}
          {renderField('렌즈 사양', editData?.cameraSetup?.lensSpecs, 'cameraSetup.lensSpecs')}
          {renderField('조리개 값', editData?.cameraSetup?.cameraSettings?.aperture, 'cameraSetup.cameraSettings.aperture')}
          {renderField('셔터 스피드', editData?.cameraSetup?.cameraSettings?.shutterSpeed, 'cameraSetup.cameraSettings.shutterSpeed')}
          {renderField('ISO 값', editData?.cameraSetup?.cameraSettings?.iso, 'cameraSetup.cameraSettings.iso')}
        </div>
      )}
    </div>
  );

  const renderSpecialRequirementsSection = () => (
    <div className="section">
      <div className="section-header" onClick={() => toggleSection('specialRequirements')}>
        <h3>특수 요구사항</h3>
        <span>{isSectionCollapsed('specialRequirements') ? '▼' : '▲'}</span>
      </div>
      {!isSectionCollapsed('specialRequirements') && (
        <div className="section-content">
          <div className="subsection">
            <h4>특수 촬영</h4>
            {renderField('드론 촬영', editData?.specialRequirements?.specialCinematography?.drone, 'specialRequirements.specialCinematography.drone', 'checkbox')}
            {renderField('크레인 촬영', editData?.specialRequirements?.specialCinematography?.crane, 'specialRequirements.specialCinematography.crane', 'checkbox')}
            {renderField('집 촬영', editData?.specialRequirements?.specialCinematography?.jib, 'specialRequirements.specialCinematography.jib', 'checkbox')}
            {renderField('수중 촬영', editData?.specialRequirements?.specialCinematography?.underwater, 'specialRequirements.specialCinematography.underwater', 'checkbox')}
            {renderField('공중 촬영', editData?.specialRequirements?.specialCinematography?.aerial, 'specialRequirements.specialCinematography.aerial', 'checkbox')}
          </div>
          <div className="subsection">
            <h4>특수 효과</h4>
            {renderField('VFX', editData?.specialRequirements?.specialEffects?.vfx, 'specialRequirements.specialEffects.vfx', 'checkbox')}
            {renderField('폭발 효과', editData?.specialRequirements?.specialEffects?.pyrotechnics, 'specialRequirements.specialEffects.pyrotechnics', 'checkbox')}
            {renderField('연기 효과', editData?.specialRequirements?.specialEffects?.smoke, 'specialRequirements.specialEffects.smoke', 'checkbox')}
            {renderField('안개 효과', editData?.specialRequirements?.specialEffects?.fog, 'specialRequirements.specialEffects.fog', 'checkbox')}
            {renderField('바람 효과', editData?.specialRequirements?.specialEffects?.wind, 'specialRequirements.specialEffects.wind', 'checkbox')}
            {renderField('비 효과', editData?.specialRequirements?.specialEffects?.rain, 'specialRequirements.specialEffects.rain', 'checkbox')}
            {renderField('눈 효과', editData?.specialRequirements?.specialEffects?.snow, 'specialRequirements.specialEffects.snow', 'checkbox')}
            {renderField('불 효과', editData?.specialRequirements?.specialEffects?.fire, 'specialRequirements.specialEffects.fire', 'checkbox')}
            {renderField('폭발', editData?.specialRequirements?.specialEffects?.explosion, 'specialRequirements.specialEffects.explosion', 'checkbox')}
            {renderField('스턴트', editData?.specialRequirements?.specialEffects?.stunt, 'specialRequirements.specialEffects.stunt', 'checkbox')}
          </div>
          <div className="subsection">
            <h4>특수 조명</h4>
            {renderField('레이저 조명', editData?.specialRequirements?.specialLighting?.laser, 'specialRequirements.specialLighting.laser', 'checkbox')}
            {renderField('스트로브 조명', editData?.specialRequirements?.specialLighting?.strobe, 'specialRequirements.specialLighting.strobe', 'checkbox')}
            {renderField('블랙라이트', editData?.specialRequirements?.specialLighting?.blackLight, 'specialRequirements.specialLighting.blackLight', 'checkbox')}
            {renderField('UV 라이트', editData?.specialRequirements?.specialLighting?.uvLight, 'specialRequirements.specialLighting.uvLight', 'checkbox')}
            {renderField('무빙라이트', editData?.specialRequirements?.specialLighting?.movingLight, 'specialRequirements.specialLighting.movingLight', 'checkbox')}
            {renderField('컬러체인저', editData?.specialRequirements?.specialLighting?.colorChanger, 'specialRequirements.specialLighting.colorChanger', 'checkbox')}
          </div>
          <div className="subsection">
            <h4>안전</h4>
            {renderField('의료진 필요', editData?.specialRequirements?.safety?.requiresMedic, 'specialRequirements.safety.requiresMedic', 'checkbox')}
            {renderField('소방 안전 필요', editData?.specialRequirements?.safety?.requiresFireSafety, 'specialRequirements.safety.requiresFireSafety', 'checkbox')}
            {renderField('안전 담당관 필요', editData?.specialRequirements?.safety?.requiresSafetyOfficer, 'specialRequirements.safety.requiresSafetyOfficer', 'checkbox')}
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
        <button onClick={handleBack} className="back-btn">← 뒤로가기</button>
        <h1>컷 초안 상세</h1>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="header-btn cancel-btn">취소</button>
              <button onClick={handleSaveDraft} className="header-btn save-btn">저장</button>
            </>
          ) : (
            <>
              <button onClick={handleEdit} className="header-btn edit-btn">편집</button>
              <button onClick={handleSaveToBackend} className="header-btn save-scene-btn">컷 저장</button>
            </>
          )}
        </div>
      </div>

      <div className="content">
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

export default CutDraftDetailPage; 