const mongoose = require('mongoose');

/**
 * 씬 스키마
 * 영화 씬의 고정 정보를 저장하는 스키마
 * 스토리, 시공간, 고정 자원 중심의 정보만 포함
 */
const sceneSchema = new mongoose.Schema({
  // 프로젝트 참조 (외래키)
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  
  // 씬 기본 정보
  scene: {
    type: Number,
    required: true,
    min: 1
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // 씬 설명
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // 씬 전체 대사 (선택적)
  dialogues: [{
    character: { type: String, trim: true },
    text: { type: String, trim: true, maxlength: 500 }
  }],
  
  // 환경 요소
  weather: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100
  },
  
  // 조명 설정 (조명 묘사 + 상세 설정)
  lighting: {
    // 조명 묘사 (문자열)
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    // 조명 세팅 (6종류 조명 + Grip & Modifier)
    setup: {
      // 1. Key Light (메인광)
      keyLight: {
        type: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        equipment: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        intensity: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        }
      },
      // 2. Fill Light (보조광)
      fillLight: {
        type: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        equipment: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        intensity: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        }
      },
      // 3. Back Light / Rim Light (배경광·윤곽광)
      backLight: {
        type: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        equipment: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        intensity: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        }
      },
      // 4. Background Light / Practical Light (배경광/장식광)
      backgroundLight: {
        type: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        equipment: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        intensity: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        }
      },
      // 5. Special Effects Light (특수 조명)
      specialEffects: {
        type: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        equipment: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        intensity: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        }
      },
      // 6. Soft Light & Diffuser (부드러운 광원)
      softLight: {
        type: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        equipment: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        intensity: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        }
      },
      // 7. Grip & Modifier (보조 도구)
      gripModifier: {
        flags: [{ // 빛 차단
          type: String,
          trim: true,
          maxlength: 100
        }],
        diffusion: [{ // 빛 확산
          type: String,
          trim: true,
          maxlength: 100
        }],
        reflectors: [{ // 반사 판
          type: String,
          trim: true,
          maxlength: 100
        }],
        colorGels: [{ // 색상 필터
          type: String,
          trim: true,
          maxlength: 100
        }]
      },
      // 전체 조명 설정
      overall: {
        colorTemperature: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        },
        mood: {
          type: String,
          default: '',
          trim: true,
          maxlength: 100
        }
      }
    }
  },
  
  visualDescription: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  
  // 씬 상의 장소
  scenePlace: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  
  // 씬 상의 시간
  sceneDateTime: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  
  // VFX 필요 여부
  vfxRequired: {
    type: Boolean,
    default: false
  },
  
  // SFX 필요 여부
  sfxRequired: {
    type: Boolean,
    default: false
  },
  
  
  // 예상 지속 시간
  estimatedDuration: {
    type: String,
    default: '5분'
  },
  
  // 이미지(스토리보드, AI 생성 이미지)
  imageUrl: {
    type: String,
    default: null,
    trim: true
  },
  
  imageModel: {
    type: String,
    default: null,
    trim: true
  },
  
  isFreeTier: {
    type: Boolean,
    default: false
  },
  
  // === 스케줄링 정보 (고정 자원 중심) ===
  // 촬영 장소
  location: {
    name: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    realLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RealLocation',
      default: null
    }
  },
  
  // 촬영 날짜
  shootingDate: {
    type: String,
    default: '',
    trim: true
  },
  
  // 촬영 시간대
  timeOfDay: {
    type: String,
    enum: ['새벽', '아침', '오후', '저녁', '밤', '낮'],
    default: '오후'
  },
  
  // 필요 인력 (부서별 구성)
  crew: {
    // 연출부
    direction: {
      director: { type: String, default: '', trim: true }, // 감독
      assistantDirector: { type: String, default: '', trim: true }, // 조감독
      scriptSupervisor: { type: String, default: '', trim: true }, // 스크립트 슈퍼바이저
      continuity: { type: String, default: '', trim: true } // 콘티뉴티
    },
    // 제작부
    production: {
      producer: { type: String, default: '', trim: true }, // 프로듀서
      lineProducer: { type: String, default: '', trim: true }, // 라인 프로듀서
      productionManager: { type: String, default: '', trim: true }, // 제작 매니저
      productionAssistant: { type: String, default: '', trim: true } // 제작 어시스턴트
    },
    // 촬영부
    cinematography: {
      cinematographer: { type: String, default: '', trim: true }, // 촬영감독
      cameraOperator: { type: String, default: '', trim: true }, // 카메라 오퍼레이터
      firstAssistant: { type: String, default: '', trim: true }, // 1st AC
      secondAssistant: { type: String, default: '', trim: true }, // 2nd AC
      dollyGrip: { type: String, default: '', trim: true } // 돌리 그립
    },
    // 조명부
    lighting: {
      gaffer: { type: String, default: '', trim: true }, // 조명 계획과 전력 공급 총괄 책임자
      bestBoy: { type: String, default: '', trim: true }, // Gaffer의 실무 보조, 장비 및 전력 분배 관리
      electrician: { type: String, default: '', trim: true }, // 조명 설치, 케이블링, 전력 라인 구성 담당
      generatorOperator: { type: String, default: '', trim: true } // 대규모 세트에서는 발전기 운용과 파워 분배 담당
    },
    // 음향부
    sound: {
      soundMixer: { type: String, default: '', trim: true }, // 사운드 믹서
      boomOperator: { type: String, default: '', trim: true }, // 붐 오퍼레이터
      soundAssistant: { type: String, default: '', trim: true }, // 사운드 어시스턴트
      utility: { type: String, default: '', trim: true } // 유틸리티
    },
    // 미술부
    art: {
      productionDesigner: { type: String, default: '', trim: true }, // 프로덕션 디자이너
      artDirector: { type: String, default: '', trim: true }, // 미술감독
      setDecorator: { type: String, default: '', trim: true }, // 세트 데코레이터
      propMaster: { type: String, default: '', trim: true }, // 소품감독
      makeupArtist: { type: String, default: '', trim: true }, // 분장사
      costumeDesigner: { type: String, default: '', trim: true }, // 의상디자이너
      hairStylist: { type: String, default: '', trim: true } // 헤어스타일리스트
    }
  },
  
  // 고정 장비 (부서별 장비 구성)
  equipment: {
    // 연출부 장비
    direction: {
      monitors: [{ type: String, trim: true }], // 모니터링 시스템
      communication: [{ type: String, trim: true }], // 통신 장비
      scriptBoards: [{ type: String, trim: true }] // 스크립트 보드
    },
    // 제작부 장비
    production: {
      scheduling: [{ type: String, trim: true }], // 스케줄링 도구
      safety: [{ type: String, trim: true }], // 안전 장비
      transportation: [{ type: String, trim: true }] // 운송 장비
    },
    // 촬영부 장비
    cinematography: {
      cameras: [{ type: String, trim: true }], // 카메라 본체
      lenses: [{ type: String, trim: true }], // 렌즈
      supports: [{ type: String, trim: true }], // 카메라 지지대
      filters: [{ type: String, trim: true }], // 필터
      accessories: [{ type: String, trim: true }] // 촬영 액세서리
    },
    // 조명부 장비
    lighting: {
      // 1. Key Light (메인광) 장비
      keyLights: [{ type: String, trim: true }], // HMI, Fresnel, LED Panel, Tungsten
      // 2. Fill Light (보조광) 장비
      fillLights: [{ type: String, trim: true }], // Softbox LED, China Ball, Reflector
      // 3. Back Light / Rim Light (배경광·윤곽광) 장비
      backLights: [{ type: String, trim: true }], // Spotlight, Ellipsoidal, LED PAR
      // 4. Background Light / Practical Light (배경광/장식광) 장비
      backgroundLights: [{ type: String, trim: true }], // Practical, RGB LED, Gobo
      // 5. Special Effects Light (특수 조명) 장비
      specialEffectsLights: [{ type: String, trim: true }], // Strobe, Tube LED, RGB Laser
      // 6. Soft Light & Diffuser (부드러운 광원) 장비
      softLights: [{ type: String, trim: true }], // Softbox, Lantern, Bounce Board
      // 7. Grip & Modifier (보조 도구)
      gripModifiers: {
        flags: [{ type: String, trim: true }], // 빛 차단
        diffusion: [{ type: String, trim: true }], // 빛 확산
        reflectors: [{ type: String, trim: true }], // 반사 판
        colorGels: [{ type: String, trim: true }] // 색상 필터
      },
      // 전원 장비
      power: [{ type: String, trim: true }] // 발전기, 케이블, 전원 분배
    },
    // 음향부 장비
    sound: {
      microphones: [{ type: String, trim: true }], // 마이크
      recorders: [{ type: String, trim: true }], // 녹음기
      wireless: [{ type: String, trim: true }], // 무선 장비
      monitoring: [{ type: String, trim: true }] // 모니터링
    },
    // 미술부 장비
    art: {
      setConstruction: [{ type: String, trim: true }], // 세트 제작 도구
      props: {
        characterProps: [{ type: String, trim: true }], // 인물 소품 (배우가 사용하는 소품)
        setProps: [{ type: String, trim: true }] // 공간 소품 (공간에 배치되는 소품)
      },
      setDressing: [{ type: String, trim: true }], // 세트 드레싱
      costumes: [{ type: String, trim: true }], // 의상
      specialEffects: [{ type: String, trim: true }] // 특수효과
    }
  },
  
  // 출연진 
  cast: [{ type: String, trim: true }],
  
  // 특별 요구사항
  specialRequirements: [{ type: String, trim: true }],
  
  
  // 수정 기록
  lastModified: { type: Date, default: Date.now },
  modifiedBy: { type: String, default: 'AI', trim: true },
  
  // 씬 순서
  order: { type: Number, default: 0 },
  

}, {
  // 자동으로 생성/수정 시간 관리
  timestamps: true,
  
  // JSON 변환 시 가상 필드 포함
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 씬 번호 (순서 기반)
sceneSchema.virtual('sceneNumber').get(function() {
  return this.scene || this.order + 1;
});

// 가상 필드: 컷 목록 (관계)
sceneSchema.virtual('cuts', {
  ref: 'Cut',
  localField: '_id',
  foreignField: 'sceneId',
  options: { sort: { order: 1 } }
});

// 가상 필드: 컷 수
sceneSchema.virtual('cutCount', {
  ref: 'Cut',
  localField: '_id',
  foreignField: 'sceneId',
  count: true
});

// 가상 필드: 실사 촬영 컷 수
sceneSchema.virtual('liveActionCutCount', {
  ref: 'Cut',
  localField: '_id',
  foreignField: 'sceneId',
  count: true,
  match: { productionMethod: 'live_action' }
});

// 가상 필드: AI 생성 컷 수
sceneSchema.virtual('aiGeneratedCutCount', {
  ref: 'Cut',
  localField: '_id',
  foreignField: 'sceneId',
  count: true,
  match: { productionMethod: 'ai_generated' }
});

// 가상 필드: 총 예상 지속 시간 (컷들의 합계)
sceneSchema.virtual('totalEstimatedDuration').get(function() {
  // 이 가상 필드는 populate 후에 계산됨
  if (this.cuts && Array.isArray(this.cuts)) {
    return this.cuts.reduce((sum, cut) => sum + (cut.estimatedDuration || 0), 0);
  }
  return 0;
});

// 인덱스 설정
sceneSchema.index({ projectId: 1, order: 1 });
sceneSchema.index({ projectId: 1, type: 1 });
sceneSchema.index({ 'location.name': 1 });
sceneSchema.index({ shootingDate: 1 });
sceneSchema.index({ cast: 1 });

// 미들웨어: 씬 저장 시 순서 자동 설정
sceneSchema.pre('save', function(next) {
  if (!this.order && this.scene) {
    this.order = this.scene;
  }
  next();
});

// 정적 메서드: 프로젝트의 씬 목록 조회
sceneSchema.statics.findByProjectId = function(projectId, options = {}) {
  const query = { projectId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ order: 1 })
    .populate('projectId', 'projectTitle status');
};

// 정적 메서드: 같은 장소의 씬들 조회
sceneSchema.statics.findByLocation = function(projectId, locationName) {
  return this.find({
    projectId,
    'location.name': locationName
  }).sort({ order: 1 });
};

// 정적 메서드: 같은 날짜의 씬들 조회
sceneSchema.statics.findByDate = function(projectId, date) {
  return this.find({
    projectId,
    shootingDate: date
  }).sort({ order: 1 });
};

// 정적 메서드: 같은 배우가 출연하는 씬들 조회
sceneSchema.statics.findByCast = function(projectId, castMember) {
  return this.find({
    projectId,
    cast: castMember
  }).sort({ order: 1 });
};

// 인스턴스 메서드: 씬 순서 변경
sceneSchema.methods.updateOrder = function(newOrder) {
  this.order = newOrder;
  return this.save();
};

// 인스턴스 메서드: 스케줄링 정보 업데이트
sceneSchema.methods.updateScheduling = function(schedulingData) {
  Object.assign(this, schedulingData);
  return this.save();
};

// 인스턴스 메서드: 우선순위 업데이트
sceneSchema.methods.updatePriorities = function(newPriorities) {
  this.priorities = { ...this.priorities, ...newPriorities };
  return this.save();
};

// 인스턴스 메서드: 씬 상태 업데이트
sceneSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

module.exports = mongoose.model('Scene', sceneSchema); 