import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { sceneService, type Scene } from '../services/sceneService';
import { cutService, type Cut, type CutDraft, isCut, isCutDraft } from '../../cut/services/cutService';
import CutGenerationModal from '../../cut/components/CutGenerationModal';
import CutList from '../../cut/components/CutList';


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



  const loadScene = useCallback(async () => {
    if (!projectId || !sceneId) return;

    try {
      // 백엔드에서 실제 저장된 씬 로드
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
      // 실제 DB에서 저장된 컷들 로드
      const savedCuts = await cutService.findBySceneId(projectId, sceneId);
      setCuts(savedCuts);

      // localStorage에서 해당 씬의 draft 컷들 로드
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

  // refresh state가 있으면 최신 정보 불러오기
  useEffect(() => {
    if (location.state?.refresh && projectId && sceneId) {
      // 1. 씬 정보 새로고침
      loadScene();
      
      // 2. 컷과 draft 로드
      loadCuts();
      
      // state 초기화
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.refresh, projectId, sceneId, loadScene, loadCuts, navigate, location.pathname]);

  // 컷 draft 업데이트 이벤트 리스너
  useEffect(() => {
    const handleCutDraftUpdated = (event: CustomEvent) => {
      if (event.detail.projectId === projectId && event.detail.sceneId === sceneId) {
        const { draftOrder, updatedCut } = event.detail;
        if (updatedCut === null) {
          // draft 제거
          setCuts(prev => {
            const newCuts = prev.filter(cut => cut.order !== draftOrder);
            // localStorage 업데이트
            const draftKey = `cut_drafts_${projectId}_${sceneId}`;
            localStorage.setItem(draftKey, JSON.stringify(newCuts.filter(cut => isCutDraft(cut))));
            return newCuts;
          });
        } else {
          // draft 업데이트
          setCuts(prev => {
            const newCuts = prev.map(cut => 
              cut.order === draftOrder ? updatedCut : cut
            );
            // localStorage 업데이트
            const draftKey = `cut_drafts_${projectId}_${sceneId}`;
            localStorage.setItem(draftKey, JSON.stringify(newCuts.filter(cut => isCutDraft(cut))));
            return newCuts;
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
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(scene);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!projectId || !sceneId || !editData) return;
    
    try {
      // 실제 저장된 씬을 업데이트
      const updatedScene = await sceneService.update(projectId, sceneId, editData);
      
      // ProjectPage의 씬 목록을 새로고침하기 위해 이벤트 발생
      window.dispatchEvent(new CustomEvent('sceneSaved', {
        detail: { projectId, savedScene: updatedScene }
      }));
      
      alert('씬이 성공적으로 업데이트되었습니다.');
      navigate(`/project/${projectId}`);
    } catch (error) {
      console.error('씬 업데이트 실패:', error);
      alert('씬 업데이트에 실패했습니다.');
    }
  };

  const handleGenerateCuts = async (options: { maxCuts: number }) => {
    if (!projectId || !sceneId) return;
    
    setIsGeneratingCuts(true);
    try {
      // 1. 기존 저장된 컷들만 DB에서 삭제 (draft 컷들은 제외)
      const savedCuts = cuts.filter(cut => isCut(cut));
      for (const cut of savedCuts) {
        await cutService.delete(projectId, sceneId, cut._id);
      }
      
      // 2. 기존 draft 컷들도 모두 삭제 (localStorage에서)
      const draftKey = `cut_drafts_${projectId}_${sceneId}`;
      localStorage.removeItem(draftKey);
      
      // 3. 컷 목록 초기화
      setCuts([]);
      setDraftCuts([]);
      
      // 4. 새로운 draft 컷들 생성
      const generatedCuts = await cutService.createDraft(projectId, sceneId, options);
      
      // 5. localStorage에 draft 저장
      localStorage.setItem(draftKey, JSON.stringify(generatedCuts));
      
      setDraftCuts(generatedCuts);
    } catch (error) {
      console.error('컷 생성 실패:', error);
      alert('컷 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsGeneratingCuts(false);
    }
  };

  const clearDraftCuts = () => {
    // localStorage에서 해당 씬의 draft 제거
    if (projectId && sceneId) {
      const draftKey = `cut_drafts_${projectId}_${sceneId}`;
      localStorage.removeItem(draftKey);
    }
    // 저장된 컷만 남기고 draft 컷 제거
    setCuts(prev => prev.filter(cut => isCut(cut)));
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

  const handleInputChange = (field: keyof Scene, value: any) => {
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
      if (!current[lastKey] || !Array.isArray(current[lastKey])) {
        current[lastKey] = [];
      }
      
      const array = [...current[lastKey]];
      array[index] = value;
      current[lastKey] = array;
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
      if (!current[lastKey] || !Array.isArray(current[lastKey])) {
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
      if (!current[lastKey] || !Array.isArray(current[lastKey])) {
        current[lastKey] = [];
      }
      
      const array = [...current[lastKey]];
      array.splice(index, 1);
      current[lastKey] = array;
      return newData;
    });
  };

  const handleBack = () => {
    navigate(`/project/${projectId}`);
  };

  const handleGenerateImage = async (cutId: string) => {
    if (!projectId || !sceneId) return;
    
    setGeneratingImages(prev => new Set(prev).add(cutId));
    
    try {
      // 이미지 생성 API 호출
      await cutService.generateImage(projectId, sceneId, cutId);
      
      // 컷 목록 다시 로드 (이미지 URL이 포함된 최신 정보)
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

  if (isLoading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!scene) {
    return <div className="error">씬을 찾을 수 없습니다.</div>;
  }

  const renderField = (label: string, value: any, field: string, type: string = 'text') => (
    <div className="form-group">
      <label>{label}</label>
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof Scene, e.target.value)}
            placeholder={`${label}을 입력하세요`}
            rows={3}
            readOnly={!isEditing}
          />
        ) : type === 'checkbox' ? (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleInputChange(field as keyof Scene, e.target.checked)}
            disabled={!isEditing}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => handleInputChange(field as keyof Scene, e.target.value)}
            placeholder={`${label}을 입력하세요`}
            readOnly={!isEditing}
          />
        )
      ) : (
        <p>{value || '미정'}</p>
      )}
    </div>
  );

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
        <button onClick={handleBack} className="back-btn" disabled={isGeneratingCuts || generatingImages.size > 0}>
          ← 뒤로가기
        </button>
        <h1>{isEditing ? '씬 편집' : '씬 상세'}</h1>
        <div className="header-actions">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="cancel-btn" disabled={isGeneratingCuts || generatingImages.size > 0}>
                취소
              </button>
              <button onClick={handleSave} className="save-btn" disabled={isGeneratingCuts || generatingImages.size > 0}>
                저장
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsCutModalOpen(true)} className="generate-cuts-btn" disabled={isGeneratingCuts || generatingImages.size > 0}>
                컷 생성
              </button>
              <button onClick={handleEdit} className="edit-btn" disabled={isGeneratingCuts || generatingImages.size > 0}>
                편집
              </button>
            </>
          )}
        </div>
      </div>

      {/* 컷 리스트 */}
      <CutList 
        cuts={[...cuts, ...draftCuts]} 
        draftCuts={draftCuts}
        projectId={projectId!} 
        sceneId={sceneId!} 
        onGenerateImage={handleGenerateImage}
        generatingImages={generatingImages}
        isGeneratingCuts={isGeneratingCuts}
      />

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

      {/* 컷 생성 모달 */}
      <CutGenerationModal
        isOpen={isCutModalOpen}
        onClose={() => setIsCutModalOpen(false)}
        onGenerate={handleGenerateCuts}
        isGenerating={isGeneratingCuts}
      />
    </div>
  );
};

export default SceneDetailPage; 