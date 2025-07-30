import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { sceneService, type SceneDraft } from '../services/sceneService';
import './SceneDetailPage.css';

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
      
      // ProjectPage로 이동하면서 새로고침 플래그 전달
      navigate(`/project/${projectId}`, { 
        state: { 
          refresh: true,
          savedScene: savedScene
        }
      });
      
      alert('씬이 성공적으로 저장되었습니다.');
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

  // 단순화된 필드 렌더링 함수
  const renderField = (label: string, value: any, field: string, type: string = 'text') => (
    <div className="form-group">
      <label>{label}</label>
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof SceneDraft, e.target.value)}
            placeholder={`${label}을 입력하세요`}
            rows={3}
            readOnly={!isEditing}
          />
        ) : type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleInputChange(field as keyof SceneDraft, e.target.checked)}
            disabled={!isEditing}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof SceneDraft, e.target.value)}
            placeholder={`${label}을 입력하세요`}
            readOnly={!isEditing}
          />
        )
      ) : (
        <p>{value || '미정'}</p>
      )}
    </div>
  );

  // 단순화된 배열 필드 렌더링 함수
  const renderArrayField = (label: string, array: any[], path: string, itemFields: string[]) => (
    <div className="array-field">
      <label>{label}</label>
      {isEditing ? (
        <div className="array-items">
          {array?.map((item, index) => (
            <div key={`${path}_${index}_${JSON.stringify(item)}`} className="array-item">
              {itemFields.map(field => (
                <input
                  key={field}
                  type="text"
                  value={item[field] || ''}
                  onChange={(e) => {
                    const newItem = { ...item, [field]: e.target.value };
                    handleArrayChange(path, index, newItem);
                  }}
                  placeholder={field}
                  readOnly={!isEditing}
                />
              ))}
              {isEditing && (
              <button
                type="button"
                onClick={() => removeArrayItem(path, index)}
                className="remove-btn"
              >
                삭제
              </button>
              )}
            </div>
          ))}
          {isEditing && (
          <button
            type="button"
            onClick={() => {
              const defaultItem = itemFields.reduce((acc, field) => {
                acc[field] = '';
                return acc;
              }, {} as any);
              addArrayItem(path, defaultItem);
            }}
            className="add-btn"
          >
              + 추가
          </button>
          )}
        </div>
      ) : (
        <div className="array-display">
          {array?.map((item, index) => (
            <div key={`${path}_${index}_${JSON.stringify(item)}`} className="array-item-display">
              {itemFields.map(field => (
                <span key={field}>{item[field] || '미정'}</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 단순화된 중첩 필드 렌더링 함수
  const renderNestedField = (label: string, value: any, path: string, type: string = 'text') => (
    <div className="form-group">
      <label>{label}</label>
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => handleNestedChange(path, e.target.value)}
            placeholder={`${label}을 입력하세요`}
            rows={3}
            readOnly={!isEditing}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => handleNestedChange(path, e.target.value)}
            placeholder={`${label}을 입력하세요`}
            readOnly={!isEditing}
          />
        )
      ) : (
        <p>{value || '미정'}</p>
      )}
    </div>
  );

  // 단순화된 크루 섹션 렌더링 함수
  const renderCrewSection = (title: string, crewData: any, path: string) => (
    <div className="crew-section">
      {Object.entries(crewData || {}).map(([role, members]: [string, any]) => (
        <div key={role} className="crew-role">
          <h4>{role}</h4>
          {isEditing ? (
            <div className="crew-members">
              {members?.map((member: any, index: number) => (
                <div key={`${path}_${role}_${index}_${JSON.stringify(member)}`} className="crew-member">
                  <input
                    type="text"
                    value={member.role || ''}
                    onChange={(e) => {
                      const newMember = { ...member, role: e.target.value };
                      handleArrayChange(`${path}.${role}`, index, newMember);
                    }}
                    placeholder="역할"
                    readOnly={!isEditing}
                  />
                  <input
                    type="text"
                    value={member.profileId || ''}
                    onChange={(e) => {
                      const newMember = { ...member, profileId: e.target.value };
                      handleArrayChange(`${path}.${role}`, index, newMember);
                    }}
                    placeholder="프로필 ID"
                    readOnly={!isEditing}
                  />
                  {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem(`${path}.${role}`, index)}
                    className="remove-btn"
                  >
                    삭제
                  </button>
                  )}
                </div>
              ))}
              {isEditing && (
              <button
                type="button"
                onClick={() => {
                    addArrayItem(`${path}.${role}`, { role: '', profileId: '' });
                }}
                className="add-btn"
              >
                  + 추가
              </button>
              )}
            </div>
          ) : (
            <div className="crew-members-display">
              {members?.map((member: any, index: number) => (
                <div key={`${path}_${role}_${index}_${JSON.stringify(member)}`} className="crew-member-display">
                  <span>{member.role || '미정'}</span>
                  <span>{member.profileId || '미정'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderEquipmentSection = (title: string, equipmentData: any, path: string) => (
    <div className="equipment-section">
      {Object.entries(equipmentData || {}).map(([category, items]: [string, any]) => (
        <div key={category} className="equipment-category">
          <h4>{category}</h4>
          {isEditing ? (
            <div className="equipment-items">
              {Array.isArray(items) ? (
                // 배열 형태의 장비
                <div className="array-items">
                  {items?.map((item: string, index: number) => (
                    <div key={`${path}_${category}_${index}_${item}`} className="array-item">
                    <input
                      type="text"
                      value={item || ''}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index] = e.target.value;
                          handleNestedChange(`${path}.${category}`, newItems);
                        }}
                        placeholder="장비명"
                        readOnly={!isEditing}
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = items.filter((_: any, i: number) => i !== index);
                            handleNestedChange(`${path}.${category}`, newItems);
                          }}
                          className="remove-btn"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...(items || []), ''];
                        handleNestedChange(`${path}.${category}`, newItems);
                      }}
                      className="add-btn"
                    >
                      + 추가
                    </button>
                  )}
                </div>
              ) : (
                // 객체 형태의 장비 (props 등)
                <div className="object-items">
                  {Object.entries(items || {}).map(([subCategory, subItems]: [string, any]) => (
                    <div key={subCategory} className="sub-category">
                      <h5>{subCategory}</h5>
                      <div className="array-items">
                        {subItems?.map((item: string, index: number) => (
                          <div key={`${path}_${category}_${subCategory}_${index}_${item}`} className="array-item">
                  <input
                    type="text"
                              value={item || ''}
                              onChange={(e) => {
                                const newSubItems = [...subItems];
                                newSubItems[index] = e.target.value;
                                handleNestedChange(`${path}.${category}.${subCategory}`, newSubItems);
                              }}
                              placeholder="장비명"
                              readOnly={!isEditing}
                            />
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newSubItems = subItems.filter((_: any, i: number) => i !== index);
                                  handleNestedChange(`${path}.${category}.${subCategory}`, newSubItems);
                                }}
                                className="remove-btn"
                              >
                                삭제
                              </button>
                            )}
                </div>
                        ))}
                        {isEditing && (
              <button
                type="button"
                onClick={() => {
                              const newSubItems = [...(subItems || []), ''];
                              handleNestedChange(`${path}.${category}.${subCategory}`, newSubItems);
                }}
                className="add-btn"
              >
                            + 추가
              </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="equipment-items-display">
              {Array.isArray(items) ? (
                items?.map((item: string, index: number) => (
                  <div key={`${path}_${category}_${index}_${item}`} className="equipment-item-display">
                    <span>{item || '미정'}</span>
                  </div>
                ))
              ) : (
                Object.entries(items || {}).map(([subCategory, subItems]: [string, any]) => (
                  <div key={subCategory} className="sub-category-display">
                    <h5>{subCategory}</h5>
                    {subItems?.map((item: string, index: number) => (
                      <div key={`${path}_${category}_${subCategory}_${index}_${item}`} className="equipment-item-display">
                        <span>{item || '미정'}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="scene-detail-page">
      <div className="header">
          <button onClick={handleBack} className="back-btn">
          ← 뒤로가기
          </button>
        <h1>{isEditing ? '씬 초안 편집' : '씬 초안 상세'}</h1>
        <div className="header-buttons">
            {isEditing ? (
              <>
              <button onClick={handleCancel} className="header-btn cancel-btn">
                  취소
                </button>
              <button onClick={handleSaveDraft} className="header-btn save-btn">
                  저장
                </button>
              </>
            ) : (
            <>
              <button onClick={handleEdit} className="header-btn edit-btn">
                편집
              </button>
              <button onClick={handleSaveToBackend} className="header-btn save-scene-btn">
                씬 저장
              </button>
            </>
            )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>로딩 중...</p>
        </div>
      ) : !editData ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>씬을 찾을 수 없습니다.</p>
        </div>
      ) : (
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
          {renderField('순서', editData.order, 'order', 'number')}
          {renderField('제목', editData.title, 'title')}
          {renderField('설명', editData.description, 'description', 'textarea')}
          {renderField('예상 시간', editData.estimatedDuration, 'estimatedDuration')}
          {renderField('시간대', editData.timeOfDay, 'timeOfDay')}
          {renderField('씬 날짜/시간', editData.sceneDateTime, 'sceneDateTime')}
              </>
            )}
        </div>

        {/* 대사 */}
          <div className={`section ${isSectionCollapsed('dialogues') ? 'collapsed' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('dialogues')}>
          <h2>대사</h2>
              <button className="toggle-btn">
                {isSectionCollapsed('dialogues') ? '▼' : '▲'}
              </button>
            </div>
            {!isSectionCollapsed('dialogues') && editData && renderArrayField('대사', editData.dialogues, 'dialogues', ['character', 'text'])}
        </div>

        {/* 조명 */}
          <div className={`section ${isSectionCollapsed('lighting') ? 'collapsed' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('lighting')}>
          <h2>조명</h2>
              <button className="toggle-btn">
                {isSectionCollapsed('lighting') ? '▼' : '▲'}
              </button>
            </div>
            {!isSectionCollapsed('lighting') && editData && (
              <>
                {renderNestedField('조명 설명', editData.lighting?.description, 'lighting.description', 'textarea')}
                
            <div className="lighting-setup">
              <h3>조명 설정</h3>
              
              {/* 키 라이트 */}
              <div className="lighting-item">
                <h4>키 라이트</h4>
                    {renderNestedField('타입', editData.lighting?.setup?.keyLight?.type, 'lighting.setup.keyLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.keyLight?.equipment, 'lighting.setup.keyLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.keyLight?.intensity, 'lighting.setup.keyLight.intensity')}
              </div>

              {/* 필 라이트 */}
              <div className="lighting-item">
                <h4>필 라이트</h4>
                    {renderNestedField('타입', editData.lighting?.setup?.fillLight?.type, 'lighting.setup.fillLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.fillLight?.equipment, 'lighting.setup.fillLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.fillLight?.intensity, 'lighting.setup.fillLight.intensity')}
              </div>

              {/* 백 라이트 */}
              <div className="lighting-item">
                <h4>백 라이트</h4>
                    {renderNestedField('타입', editData.lighting?.setup?.backLight?.type, 'lighting.setup.backLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.backLight?.equipment, 'lighting.setup.backLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.backLight?.intensity, 'lighting.setup.backLight.intensity')}
              </div>

              {/* 배경 라이트 */}
              <div className="lighting-item">
                <h4>배경 라이트</h4>
                    {renderNestedField('타입', editData.lighting?.setup?.backgroundLight?.type, 'lighting.setup.backgroundLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.backgroundLight?.equipment, 'lighting.setup.backgroundLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.backgroundLight?.intensity, 'lighting.setup.backgroundLight.intensity')}
              </div>

              {/* 특수 효과 */}
              <div className="lighting-item">
                <h4>특수 효과</h4>
                    {renderNestedField('타입', editData.lighting?.setup?.specialEffects?.type, 'lighting.setup.specialEffects.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.specialEffects?.equipment, 'lighting.setup.specialEffects.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.specialEffects?.intensity, 'lighting.setup.specialEffects.intensity')}
              </div>

              {/* 소프트 라이트 */}
              <div className="lighting-item">
                <h4>소프트 라이트</h4>
                    {renderNestedField('타입', editData.lighting?.setup?.softLight?.type, 'lighting.setup.softLight.type')}
                    {renderNestedField('장비', editData.lighting?.setup?.softLight?.equipment, 'lighting.setup.softLight.equipment')}
                    {renderNestedField('강도', editData.lighting?.setup?.softLight?.intensity, 'lighting.setup.softLight.intensity')}
              </div>

              {/* 전체 설정 */}
              <div className="lighting-item">
                <h4>전체 설정</h4>
                    {renderNestedField('색온도', editData.lighting?.setup?.overall?.colorTemperature, 'lighting.setup.overall.colorTemperature')}
                    {renderNestedField('분위기', editData.lighting?.setup?.overall?.mood, 'lighting.setup.overall.mood')}
              </div>

              {/* Grip 수정자 */}
              <div className="lighting-item">
                <h4>Grip 수정자</h4>
                    <div className="form-group">
                      <label>Flags</label>
                      {isEditing ? (
                        <div className="array-items">
                          {editData.lighting?.setup?.gripModifier?.flags?.map((flag: string, index: number) => (
                            <div key={`flags_${index}_${flag}`} className="array-item">
                              <input
                                type="text"
                                value={flag || ''}
                                onChange={(e) => {
                                  const newFlags = [...(editData.lighting?.setup?.gripModifier?.flags || [])];
                                  newFlags[index] = e.target.value;
                                  handleNestedChange('lighting.setup.gripModifier.flags', newFlags);
                                }}
                                placeholder="Flag를 입력하세요"
                                readOnly={!isEditing}
                              />
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFlags = editData.lighting?.setup?.gripModifier?.flags.filter((_: any, i: number) => i !== index);
                                    handleNestedChange('lighting.setup.gripModifier.flags', newFlags);
                                  }}
                                  className="remove-btn"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                const newFlags = [...(editData.lighting?.setup?.gripModifier?.flags || []), ''];
                                handleNestedChange('lighting.setup.gripModifier.flags', newFlags);
                              }}
                              className="add-btn"
                            >
                              + 추가
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="array-display">
                          {editData.lighting?.setup?.gripModifier?.flags?.map((flag: string, index: number) => (
                            <div key={`flags_${index}_${flag}`} className="array-item-display">
                              <span>{flag || '미정'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Diffusion</label>
                      {isEditing ? (
                        <div className="array-items">
                          {editData.lighting?.setup?.gripModifier?.diffusion?.map((diff: string, index: number) => (
                            <div key={`diffusion_${index}_${diff}`} className="array-item">
                              <input
                                type="text"
                                value={diff || ''}
                                onChange={(e) => {
                                  const newDiffusion = [...(editData.lighting?.setup?.gripModifier?.diffusion || [])];
                                  newDiffusion[index] = e.target.value;
                                  handleNestedChange('lighting.setup.gripModifier.diffusion', newDiffusion);
                                }}
                                placeholder="Diffusion을 입력하세요"
                                readOnly={!isEditing}
                              />
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newDiffusion = editData.lighting?.setup?.gripModifier?.diffusion.filter((_: any, i: number) => i !== index);
                                    handleNestedChange('lighting.setup.gripModifier.diffusion', newDiffusion);
                                  }}
                                  className="remove-btn"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                const newDiffusion = [...(editData.lighting?.setup?.gripModifier?.diffusion || []), ''];
                                handleNestedChange('lighting.setup.gripModifier.diffusion', newDiffusion);
                              }}
                              className="add-btn"
                            >
                              + 추가
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="array-display">
                          {editData.lighting?.setup?.gripModifier?.diffusion?.map((diff: string, index: number) => (
                            <div key={`diffusion_${index}_${diff}`} className="array-item-display">
                              <span>{diff || '미정'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Reflectors</label>
                      {isEditing ? (
                        <div className="array-items">
                          {editData.lighting?.setup?.gripModifier?.reflectors?.map((reflector: string, index: number) => (
                            <div key={`reflectors_${index}_${reflector}`} className="array-item">
                              <input
                                type="text"
                                value={reflector || ''}
                                onChange={(e) => {
                                  const newReflectors = [...(editData.lighting?.setup?.gripModifier?.reflectors || [])];
                                  newReflectors[index] = e.target.value;
                                  handleNestedChange('lighting.setup.gripModifier.reflectors', newReflectors);
                                }}
                                placeholder="Reflector를 입력하세요"
                                readOnly={!isEditing}
                              />
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newReflectors = editData.lighting?.setup?.gripModifier?.reflectors.filter((_: any, i: number) => i !== index);
                                    handleNestedChange('lighting.setup.gripModifier.reflectors', newReflectors);
                                  }}
                                  className="remove-btn"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                const newReflectors = [...(editData.lighting?.setup?.gripModifier?.reflectors || []), ''];
                                handleNestedChange('lighting.setup.gripModifier.reflectors', newReflectors);
                              }}
                              className="add-btn"
                            >
                              + 추가
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="array-display">
                          {editData.lighting?.setup?.gripModifier?.reflectors?.map((reflector: string, index: number) => (
                            <div key={`reflectors_${index}_${reflector}`} className="array-item-display">
                              <span>{reflector || '미정'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Color Gels</label>
                      {isEditing ? (
                        <div className="array-items">
                          {editData.lighting?.setup?.gripModifier?.colorGels?.map((gel: string, index: number) => (
                            <div key={`colorGels_${index}_${gel}`} className="array-item">
                              <input
                                type="text"
                                value={gel || ''}
                                onChange={(e) => {
                                  const newColorGels = [...(editData.lighting?.setup?.gripModifier?.colorGels || [])];
                                  newColorGels[index] = e.target.value;
                                  handleNestedChange('lighting.setup.gripModifier.colorGels', newColorGels);
                                }}
                                placeholder="Color Gel을 입력하세요"
                                readOnly={!isEditing}
                              />
                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newColorGels = editData.lighting?.setup?.gripModifier?.colorGels.filter((_: any, i: number) => i !== index);
                                    handleNestedChange('lighting.setup.gripModifier.colorGels', newColorGels);
                                  }}
                                  className="remove-btn"
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                const newColorGels = [...(editData.lighting?.setup?.gripModifier?.colorGels || []), ''];
                                handleNestedChange('lighting.setup.gripModifier.colorGels', newColorGels);
                              }}
                              className="add-btn"
                            >
                              + 추가
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="array-display">
                          {editData.lighting?.setup?.gripModifier?.colorGels?.map((gel: string, index: number) => (
                            <div key={`colorGels_${index}_${gel}`} className="array-item-display">
                              <span>{gel || '미정'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 위치 */}
          <div className={`section ${isSectionCollapsed('location') ? 'collapsed' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('location')}>
              <h2>위치</h2>
              <button className="toggle-btn">
                {isSectionCollapsed('location') ? '▼' : '▲'}
              </button>
            </div>
            {!isSectionCollapsed('location') && editData && (
              <>
                {renderField('씬 장소', editData.scenePlace, 'scenePlace')}
                {renderNestedField('위치 이름', editData.location?.name, 'location.name')}
                {renderNestedField('주소', editData.location?.address, 'location.address')}
                {renderNestedField('그룹명', editData.location?.group_name, 'location.group_name')}
              </>
            )}
          </div>

          {/* 환경 */}
          <div className={`section ${isSectionCollapsed('environment') ? 'collapsed' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('environment')}>
              <h2>환경</h2>
              <button className="toggle-btn">
                {isSectionCollapsed('environment') ? '▼' : '▲'}
              </button>
            </div>
            {!isSectionCollapsed('environment') && editData && (
              <>
                {renderField('날씨', editData.weather, 'weather')}
                {renderField('시각적 설명', editData.visualDescription, 'visualDescription', 'textarea')}
                {renderField('VFX 필요', editData.vfxRequired, 'vfxRequired', 'checkbox')}
                {renderField('SFX 필요', editData.sfxRequired, 'sfxRequired', 'checkbox')}
              </>
            )}
          </div>

          {/* 특별 요구사항 */}
          <div className={`section ${isSectionCollapsed('specialRequirements') ? 'collapsed' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('specialRequirements')}>
              <h2>특별 요구사항</h2>
              <button className="toggle-btn">
                {isSectionCollapsed('specialRequirements') ? '▼' : '▲'}
              </button>
            </div>
            {!isSectionCollapsed('specialRequirements') && editData && (
              <div className="form-group">
                <label>특별 요구사항</label>
                {isEditing ? (
                  <div className="array-items">
                    {editData.specialRequirements?.map((requirement: string, index: number) => (
                      <div key={`specialRequirements_${index}_${requirement}`} className="array-item">
                        <input
                          type="text"
                          value={requirement || ''}
                          onChange={(e) => {
                            const newRequirements = [...(editData.specialRequirements || [])];
                            newRequirements[index] = e.target.value;
                            handleInputChange('specialRequirements', newRequirements);
                          }}
                          placeholder="특별 요구사항을 입력하세요"
                          readOnly={!isEditing}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              const newRequirements = editData.specialRequirements.filter((_: any, i: number) => i !== index);
                              handleInputChange('specialRequirements', newRequirements);
                            }}
                            className="remove-btn"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          const newRequirements = [...(editData.specialRequirements || []), ''];
                          handleInputChange('specialRequirements', newRequirements);
                        }}
                        className="add-btn"
                      >
                        + 추가
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="array-display">
                    {editData.specialRequirements?.map((requirement: string, index: number) => (
                      <div key={`specialRequirements_${index}_${requirement}`} className="array-item-display">
                        <span>{requirement || '미정'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 출연진 */}
          <div className={`section ${isSectionCollapsed('cast') ? 'collapsed' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('cast')}>
              <h2>출연진</h2>
              <button className="toggle-btn">
                {isSectionCollapsed('cast') ? '▼' : '▲'}
              </button>
            </div>
            {!isSectionCollapsed('cast') && editData && (
              <>
                {renderArrayField('주연', editData.cast, 'cast', ['role', 'name'])}
                {renderArrayField('엑스트라', editData.extra, 'extra', ['role', 'number'])}
              </>
          )}
        </div>

          {/* 스태프 */}
          <div className={`section ${isSectionCollapsed('staff') ? 'collapsed' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('staff')}>
              <h2>스태프</h2>
              <button className="toggle-btn">
                {isSectionCollapsed('staff') ? '▼' : '▲'}
              </button>
            </div>
            {!isSectionCollapsed('staff') && editData && (
              <>
          {renderCrewSection('연출팀', editData.crew?.direction, 'crew.direction')}
          {renderCrewSection('제작팀', editData.crew?.production, 'crew.production')}
          {renderCrewSection('촬영팀', editData.crew?.cinematography, 'crew.cinematography')}
          {renderCrewSection('조명팀', editData.crew?.lighting, 'crew.lighting')}
          {renderCrewSection('음향팀', editData.crew?.sound, 'crew.sound')}
          {renderCrewSection('미술팀', editData.crew?.art, 'crew.art')}
              </>
            )}
        </div>

          {/* 장비 */}
          <div className={`section ${isSectionCollapsed('equipment') ? 'collapsed' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('equipment')}>
              <h2>장비</h2>
              <button className="toggle-btn">
                {isSectionCollapsed('equipment') ? '▼' : '▲'}
              </button>
            </div>
            {!isSectionCollapsed('equipment') && editData && (
              <>
          {renderEquipmentSection('연출 장비', editData.equipment?.direction, 'equipment.direction')}
          {renderEquipmentSection('제작 장비', editData.equipment?.production, 'equipment.production')}
          {renderEquipmentSection('촬영 장비', editData.equipment?.cinematography, 'equipment.cinematography')}
          {renderEquipmentSection('조명 장비', editData.equipment?.lighting, 'equipment.lighting')}
          {renderEquipmentSection('음향 장비', editData.equipment?.sound, 'equipment.sound')}
          {renderEquipmentSection('미술 장비', editData.equipment?.art, 'equipment.art')}
              </>
            )}
        </div>
        </div>
      )}
    </div>
  );
};

export default SceneDraftDetailPage; 