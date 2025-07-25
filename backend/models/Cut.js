    const mongoose = require('mongoose');

/**
 * 컷 스키마 (샷)
 * 씬(scene) 내의 개별 컷 정보를 저장하는 스키마
 * 프리프로덕션 중심으로 설계된 컷 세분화 시스템
 */
const cutSchema = new mongoose.Schema({
  // 씬(scene) 참조 (외래키)
  sceneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scene',
    required: true,
    index: true
  },
  
  // 프로젝트 참조 (외래키) - 직접 참조로 빠른 조회
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  
  // 컷 ID (고유 식별자)
  cutId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    required: true
  },
  
  // 컷 기본 정보
  shotNumber: {
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
  
  // 컷 상세 정보
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // 카메라 설정
  cameraSetup: {
    // 샷 사이즈 (영화 제작 표준)
    shotSize: {
      type: String,
      enum: [
        'EWS',      // Extreme Wide Shot (극광각샷)
        'VWS',      // Very Wide Shot (매우 광각샷)
        'WS',       // Wide Shot (광각샷)
        'FS',       // Full Shot (전신샷)
        'LS',       // Long Shot (원경샷)
        'MLS',      // Medium Long Shot (중원경샷)
        'MS',       // Medium Shot (중경샷)
        'MCS',      // Medium Close Shot (중근경샷)
        'CU',       // Close Up (근경샷)
        'MCU',      // Medium Close Up (중근경샷)
        'BCU',      // Big Close Up (대근경샷)
        'ECU',      // Extreme Close Up (극근경샷)
        'TCU',      // Tight Close Up (밀착근경샷)
        'OTS',      // Over The Shoulder (어깨너머샷)
        'POV',      // Point of View (시점샷)
        'TS',       // Two Shot (투샷)
        'GS',       // Group Shot (그룹샷)
        'AS',       // American Shot (아메리칸샷)
        'PS',       // Profile Shot (프로필샷)
        'BS'        // Bust Shot (버스트샷)
      ],
      default: 'MS'
    },
    
    // 앵글 방향 (영화 제작 표준)
    angleDirection: {
      type: String,
      enum: [
        'Eye-level',     // Eye-level (시선높이)
        'High',          // High Angle (고각)
        'Low',           // Low Angle (저각)
        'Dutch',         // Dutch Angle (더치앵글)
        'Bird_eye',      // Bird's Eye (조감각)
        'Worm_eye',      // Worm's Eye (충시각)
        'Canted',        // Canted Angle (기울어진 앵글)
        'Oblique',       // Oblique Angle (사각)
        'Aerial',        // Aerial Angle (공중 앵글)
        'Ground',        // Ground Level (지면 레벨)
        'Overhead',      // Overhead (정상각)
        'Under',         // Under (저면각)
        'Side',          // Side Angle (측면각)
        'Front',         // Front Angle (정면각)
        'Back',          // Back Angle (후면각)
        'Three_quarter', // Three-quarter Angle (3/4 앵글)
        'Profile',       // Profile Angle (프로필 앵글)
        'Reverse',       // Reverse Angle (역앵글)
        'POV',           // Point of View (시점 앵글)
        'Subjective'     // Subjective Angle (주관적 앵글)
      ],
      default: 'Eye-level'
    },
    
    // 카메라 움직임 (영화 제작 표준)
    cameraMovement: {
      type: String,
      enum: [
        'Static',         // Static (고정)
        'Pan',            // Pan (팬)
        'Tilt',           // Tilt (틸트)
        'Dolly',          // Dolly (돌리)
        'Zoom',           // Zoom (줌)
        'Handheld',       // Handheld (핸드헬드)
        'Tracking',       // Tracking Shot (트래킹샷)
        'Crane',          // Crane Shot (크레인샷)
        'Steadicam',      // Steadicam (스테디캠)
        'Gimbal',         // Gimbal (짐벌)
        'Drone',          // Drone (드론)
        'Jib',            // Jib (집)
        'Slider',         // Slider (슬라이더)
        'Dolly_zoom',     // Dolly Zoom (돌리줌)
        'Arc',            // Arc Shot (아크샷)
        'Circle',         // Circle Shot (서클샷)
        'Spiral',         // Spiral Shot (스파이럴샷)
        'Vertigo',        // Vertigo Effect (버티고 효과)
        'Whip_pan',       // Whip Pan (휩팬)
        'Crash_zoom',     // Crash Zoom (크래시줌)
        'Push_in',        // Push In (푸시인)
        'Pull_out',       // Pull Out (풀아웃)
        'Follow',         // Follow Shot (팔로우샷)
        'Lead',           // Lead Shot (리드샷)
        'Reveal',         // Reveal Shot (리빌샷)
        'Conceal',        // Conceal Shot (컨실샷)
        'Parallax',       // Parallax Shot (패럴랙스샷)
        'Time_lapse',     // Time Lapse (타임랩스)
        'Slow_motion',    // Slow Motion (슬로우모션)
        'Fast_motion',    // Fast Motion (패스트모션)
        'Bullet_time',    // Bullet Time (불릿타임)
        'Matrix_style',   // Matrix Style (매트릭스 스타일)
        '360_degree',     // 360 Degree (360도)
        'VR_style'        // VR Style (VR 스타일)
      ],
      default: 'Static'
    },
    
    lensSpecs: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    
    cameraSettings: {
      aperture: {
        type: String,
        default: '',
        trim: true
      },
      shutterSpeed: {
        type: String,
        default: '',
        trim: true
      },
      iso: {
        type: String,
        default: '',
        trim: true
      }
    }
  },
  
  // VFX/CG 관련 필드들
  vfxEffects: {
    type: String, 
    default: '',
    trim: true,
    maxlength: 500
  },
  
  soundEffects: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  
  directorNotes: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  },
  
  // 대사 및 내레이션
  dialogue: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  
  narration: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  
  // 피사체/동선 및 포지션 (등장인물 또는 말이 없는 피사체)
  subjectMovement: {
    subjects: [{
      name: { type: String, trim: true }, // 등장인물명 또는 피사체명
      type: { type: String, enum: ['character', 'object', 'animal', 'background'], default: 'character' }, // 피사체 타입
      position: { type: String, default: '', trim: true, maxlength: 200 }, // "중앙", "왼쪽", "오른쪽" 등
      action: { type: String, trim: true, maxlength: 200 }, // 행동/움직임
      emotion: { type: String, trim: true, maxlength: 100 }, // 감정 (등장인물인 경우)
      description: { type: String, trim: true, maxlength: 300 } // 피사체 설명
    }],  
  },
  
  // 제작 방법 (실사 촬영 vs AI 생성)
  productionMethod: {
    type: String,
    enum: ['live_action', 'ai_generated'],
    default: 'live_action'
  },
  
  // 제작 방법 선택 근거
  productionMethodReason: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  
  // 예상 지속 시간
  estimatedDuration: {
    type: Number, // 초 단위
    default: 5,
    min: 1,
    max: 300
  },
  

  // 특수 촬영/효과 필요 여부
  specialRequirements: {
    // 특수 촬영 필요 여부
    specialCinematography: {
      drone: { type: Boolean, default: false }, // 드론 촬영
      crane: { type: Boolean, default: false }, // 크레인
      jib: { type: Boolean, default: false }, // 집
      underwater: { type: Boolean, default: false }, // 수중 촬영
      aerial: { type: Boolean, default: false } // 공중 촬영
    },
    // 특수 효과 필요 여부
    specialEffects: {
      vfx: { type: Boolean, default: false }, // VFX
      pyrotechnics: { type: Boolean, default: false }, // 폭발 효과
      smoke: { type: Boolean, default: false }, // 연기 효과
      fog: { type: Boolean, default: false }, // 안개 효과
      wind: { type: Boolean, default: false }, // 바람 효과
      rain: { type: Boolean, default: false }, // 비 효과
      snow: { type: Boolean, default: false }, // 눈 효과
      fire: { type: Boolean, default: false }, // 불 효과
      explosion: { type: Boolean, default: false }, // 폭발
      stunt: { type: Boolean, default: false } // 스턴트
    },
    // 특수 조명 필요 여부
    specialLighting: {
      laser: { type: Boolean, default: false }, // 레이저
      strobe: { type: Boolean, default: false }, // 스트로브
      blackLight: { type: Boolean, default: false }, // 블랙라이트
      uvLight: { type: Boolean, default: false }, // UV 라이트
      movingLight: { type: Boolean, default: false }, // 무빙라이트
      colorChanger: { type: Boolean, default: false } // 컬러체인저
    },
    // 안전 요구사항
    safety: {
      requiresMedic: { type: Boolean, default: false }, // 의료진 필요
      requiresFireSafety: { type: Boolean, default: false }, // 소방 안전 필요
      requiresSafetyOfficer: { type: Boolean, default: false } // 안전 담당관 필요
    }
  },
  
  // 컷별 Delta 계산 (Scene 기본값 대비 추가/특수 요구사항)
  cutDelta: {
    // 추가 인력 Delta (Scene crew 대비)
    additionalCrew: {
      // 촬영부 추가 인력 (특수 촬영 포함)
      cinematography: {
        additionalCinematographer: [{ type: String, trim: true, maxlength: 100 }], // 추가 촬영감독
        additionalCameraOperator: [{ type: String, trim: true, maxlength: 100 }], // 추가 카메라 오퍼레이터
        additionalFirstAssistant: [{ type: String, trim: true, maxlength: 100 }], // 추가 1st AC
        additionalSecondAssistant: [{ type: String, trim: true, maxlength: 100 }], // 추가 2nd AC
        additionalDollyGrip: [{ type: String, trim: true, maxlength: 100 }], // 추가 돌리 그립
        // 특수 촬영 전문가
        droneOperator: [{ type: String, trim: true, maxlength: 100 }], // 드론 조작자
        craneOperator: [{ type: String, trim: true, maxlength: 100 }], // 크레인 조작자
        jibOperator: [{ type: String, trim: true, maxlength: 100 }], // 집 조작자
        underwaterOperator: [{ type: String, trim: true, maxlength: 100 }], // 수중 촬영자
        aerialOperator: [{ type: String, trim: true, maxlength: 100 }] // 공중 촬영자
      },
      // 조명부 추가 인력 (특수 조명 포함)
      lighting: {
        additionalGaffer: [{ type: String, trim: true, maxlength: 100 }], // 추가 조명 감독
        additionalBestBoy: [{ type: String, trim: true, maxlength: 100 }], // 추가 베스트보이
        additionalElectrician: [{ type: String, trim: true, maxlength: 100 }], // 추가 조명 기술자
        additionalGeneratorOperator: [{ type: String, trim: true, maxlength: 100 }], // 추가 발전기 조작자
        // 특수 조명 전문가
        specialEffectsGaffer: [{ type: String, trim: true, maxlength: 100 }], // 특수효과 조명기사
        laserOperator: [{ type: String, trim: true, maxlength: 100 }], // 레이저 오퍼레이터
        strobeOperator: [{ type: String, trim: true, maxlength: 100 }], // 스트로브 오퍼레이터
        fogOperator: [{ type: String, trim: true, maxlength: 100 }] // 안개 효과 오퍼레이터
      },
      // 음향부 추가 인력 (특수 음향 포함)
      sound: {
        additionalSoundMixer: [{ type: String, trim: true, maxlength: 100 }], // 추가 사운드 믹서
        additionalBoomOperator: [{ type: String, trim: true, maxlength: 100 }], // 추가 붐 오퍼레이터
        additionalSoundAssistant: [{ type: String, trim: true, maxlength: 100 }], // 추가 사운드 어시스턴트
        additionalUtility: [{ type: String, trim: true, maxlength: 100 }], // 추가 유틸리티
        // 특수 음향 전문가
        foleyArtist: [{ type: String, trim: true, maxlength: 100 }], // 폴리 아티스트
        ambienceRecordist: [{ type: String, trim: true, maxlength: 100 }], // 환경음 녹음사
        specialSoundEngineer: [{ type: String, trim: true, maxlength: 100 }] // 특수 음향 엔지니어
      },
      // 미술부 추가 인력 (특수 효과 포함)
      art: {
        additionalProductionDesigner: [{ type: String, trim: true, maxlength: 100 }], // 추가 프로덕션 디자이너
        additionalArtDirector: [{ type: String, trim: true, maxlength: 100 }], // 추가 미술감독
        additionalSetDecorator: [{ type: String, trim: true, maxlength: 100 }], // 추가 세트 데코레이터
        additionalPropMaster: [{ type: String, trim: true, maxlength: 100 }], // 추가 소품감독
        additionalMakeupArtist: [{ type: String, trim: true, maxlength: 100 }], // 추가 분장사
        additionalCostumeDesigner: [{ type: String, trim: true, maxlength: 100 }], // 추가 의상디자이너
        additionalHairStylist: [{ type: String, trim: true, maxlength: 100 }], // 추가 헤어스타일리스트
        // 특수 효과 전문가
        vfxSupervisor: [{ type: String, trim: true, maxlength: 100 }], // VFX 감독
        sfxSupervisor: [{ type: String, trim: true, maxlength: 100 }], // SFX 감독
        pyrotechnician: [{ type: String, trim: true, maxlength: 100 }], // 폭발 효과 기술자
        stuntCoordinator: [{ type: String, trim: true, maxlength: 100 }], // 스턴트 코디네이터
        animatronicsOperator: [{ type: String, trim: true, maxlength: 100 }], // 애니매트로닉스 조작자
        prostheticsArtist: [{ type: String, trim: true, maxlength: 100 }], // 특수 의상 아티스트
        bloodEffectsArtist: [{ type: String, trim: true, maxlength: 100 }], // 혈액 효과 아티스트
        makeupEffectsArtist: [{ type: String, trim: true, maxlength: 100 }], // 특수 분장 아티스트
        setEffectsArtist: [{ type: String, trim: true, maxlength: 100 }], // 세트 효과 아티스트
        specialPropsMaster: [{ type: String, trim: true, maxlength: 100 }], // 특수 소품 마스터
        specialCostumeDesigner: [{ type: String, trim: true, maxlength: 100 }] // 특수 의상 디자이너
      },
      // 제작부 추가 인력 (안전 포함)
      production: {
        additionalProducer: [{ type: String, trim: true, maxlength: 100 }], // 추가 프로듀서
        additionalLineProducer: [{ type: String, trim: true, maxlength: 100 }], // 추가 라인 프로듀서
        additionalProductionManager: [{ type: String, trim: true, maxlength: 100 }], // 추가 제작 매니저
        additionalProductionAssistant: [{ type: String, trim: true, maxlength: 100 }], // 추가 제작 어시스턴트
        // 안전 전문가
        safetySupervisor: [{ type: String, trim: true, maxlength: 100 }], // 안전 감독
        fireSafetyOfficer: [{ type: String, trim: true, maxlength: 100 }], // 소화 안전 담당자
        medic: [{ type: String, trim: true, maxlength: 100 }], // 의료 담당자
        emergencyCoordinator: [{ type: String, trim: true, maxlength: 100 }] // 비상 조정자
      },
      // 기타 예외적 인력
      etc: [{ type: String, trim: true, maxlength: 100 }] // 기타 특수 인력
    },
    
    // 추가 장비 Delta (Scene equipment 대비)
    additionalEquipment: {
      // 촬영부 추가 장비 (특수 촬영 포함)
      cinematography: {
        additionalCameras: [{ type: String, trim: true, maxlength: 100 }], // 추가 카메라 본체
        additionalLenses: [{ type: String, trim: true, maxlength: 100 }], // 추가 렌즈
        additionalSupports: [{ type: String, trim: true, maxlength: 100 }], // 추가 카메라 지지대
        additionalFilters: [{ type: String, trim: true, maxlength: 100 }], // 추가 필터
        additionalAccessories: [{ type: String, trim: true, maxlength: 100 }], // 추가 촬영 액세서리
        // 특수 촬영 장비
        drones: [{ type: String, trim: true, maxlength: 100 }], // 드론
        cranes: [{ type: String, trim: true, maxlength: 100 }], // 크레인
        jibs: [{ type: String, trim: true, maxlength: 100 }], // 집
        underwaterHousings: [{ type: String, trim: true, maxlength: 100 }], // 수중 케이스
        aerialRigs: [{ type: String, trim: true, maxlength: 100 }] // 공중 장비
      },
      // 조명부 추가 장비 (특수 조명 포함)
      lighting: {
        // 추가 Key Light 장비
        additionalKeyLights: [{ type: String, trim: true, maxlength: 100 }], // 추가 메인광
        // 추가 Fill Light 장비
        additionalFillLights: [{ type: String, trim: true, maxlength: 100 }], // 추가 보조광
        // 추가 Back Light 장비
        additionalBackLights: [{ type: String, trim: true, maxlength: 100 }], // 추가 배경광
        // 추가 Background Light 장비
        additionalBackgroundLights: [{ type: String, trim: true, maxlength: 100 }], // 추가 배경 조명
        // 추가 Special Effects Light 장비
        additionalSpecialEffectsLights: [{ type: String, trim: true, maxlength: 100 }], // 추가 특수 효과 조명
        // 추가 Soft Light 장비
        additionalSoftLights: [{ type: String, trim: true, maxlength: 100 }], // 추가 부드러운 조명
        // 추가 Grip & Modifier
        additionalGripModifiers: {
          flags: [{ type: String, trim: true, maxlength: 100 }], // 추가 빛 차단
          diffusion: [{ type: String, trim: true, maxlength: 100 }], // 추가 빛 확산
          reflectors: [{ type: String, trim: true, maxlength: 100 }], // 추가 반사 판
          colorGels: [{ type: String, trim: true, maxlength: 100 }] // 추가 색상 필터
        },
        // 추가 전원 장비
        additionalPower: [{ type: String, trim: true, maxlength: 100 }], // 추가 전원 장비
        // 특수 조명 장비
        specialKeyLights: [{ type: String, trim: true, maxlength: 100 }], // 특수 메인광
        specialFillLights: [{ type: String, trim: true, maxlength: 100 }], // 특수 보조광
        specialBackLights: [{ type: String, trim: true, maxlength: 100 }], // 특수 배경광
        specialBackgroundLights: [{ type: String, trim: true, maxlength: 100 }], // 특수 배경 조명
        specialEffectsLights: [{ type: String, trim: true, maxlength: 100 }], // 특수 효과 조명
        specialSoftLights: [{ type: String, trim: true, maxlength: 100 }], // 특수 부드러운 조명
        specialGripModifiers: {
          flags: [{ type: String, trim: true, maxlength: 100 }], // 특수 빛 차단
          diffusion: [{ type: String, trim: true, maxlength: 100 }], // 특수 빛 확산
          reflectors: [{ type: String, trim: true, maxlength: 100 }], // 특수 반사 판
          colorGels: [{ type: String, trim: true, maxlength: 100 }] // 특수 색상 필터
        },
        specialPower: [{ type: String, trim: true, maxlength: 100 }] // 특수 전원 장비
      },
      // 음향부 추가 장비 (특수 음향 포함)
      sound: {
        additionalMicrophones: [{ type: String, trim: true, maxlength: 100 }], // 추가 마이크
        additionalRecorders: [{ type: String, trim: true, maxlength: 100 }], // 추가 녹음기
        additionalWireless: [{ type: String, trim: true, maxlength: 100 }], // 추가 무선 장비
        additionalMonitoring: [{ type: String, trim: true, maxlength: 100 }], // 추가 모니터링
        // 특수 음향 장비
        foleyEquipment: [{ type: String, trim: true, maxlength: 100 }], // 폴리 장비
        ambienceRecorders: [{ type: String, trim: true, maxlength: 100 }], // 환경음 녹음기
        specialMicrophones: [{ type: String, trim: true, maxlength: 100 }], // 특수 마이크
        soundEffects: [{ type: String, trim: true, maxlength: 100 }] // 음향효과 장비
      },
      // 미술부 추가 장비 (특수 효과 포함)
      art: {
        additionalSetConstruction: [{ type: String, trim: true, maxlength: 100 }], // 추가 세트 제작 도구
        additionalProps: {
          additionalCharacterProps: [{ type: String, trim: true, maxlength: 100 }], // 추가 인물 소품
          additionalSetProps: [{ type: String, trim: true, maxlength: 100 }] // 추가 공간 소품
        },
        additionalSetDressing: [{ type: String, trim: true, maxlength: 100 }], // 추가 세트 드레싱
        additionalCostumes: [{ type: String, trim: true, maxlength: 100 }], // 추가 의상
        additionalSpecialEffects: [{ type: String, trim: true, maxlength: 100 }], // 추가 특수효과
        // 특수 효과 장비
        vfxEquipment: [{ type: String, trim: true, maxlength: 100 }], // VFX 장비
        pyrotechnics: [{ type: String, trim: true, maxlength: 100 }], // 폭발 효과 장비
        smokeMachines: [{ type: String, trim: true, maxlength: 100 }], // 연기 기계
        fogMachines: [{ type: String, trim: true, maxlength: 100 }], // 안개 기계
        windMachines: [{ type: String, trim: true, maxlength: 100 }], // 바람 기계
        rainMachines: [{ type: String, trim: true, maxlength: 100 }], // 비 효과 기계
        snowMachines: [{ type: String, trim: true, maxlength: 100 }], // 눈 효과 기계
        animatronics: [{ type: String, trim: true, maxlength: 100 }], // 애니매트로닉스
        prosthetics: [{ type: String, trim: true, maxlength: 100 }], // 의상 특수효과
        bloodEffects: [{ type: String, trim: true, maxlength: 100 }], // 혈액 효과
        makeupEffects: [{ type: String, trim: true, maxlength: 100 }], // 분장 효과
        setEffects: [{ type: String, trim: true, maxlength: 100 }], // 세트 효과
        props: {
          characterProps: [{ type: String, trim: true, maxlength: 100 }], // 인물 소품
          setProps: [{ type: String, trim: true, maxlength: 100 }] // 공간 소품
        },
        costumes: [{ type: String, trim: true, maxlength: 100 }] // 의상
      },
      // 제작부 추가 장비 (안전 포함)
      production: {
        additionalScheduling: [{ type: String, trim: true, maxlength: 100 }], // 추가 스케줄링 도구
        additionalSafety: [{ type: String, trim: true, maxlength: 100 }], // 추가 안전 장비
        additionalTransportation: [{ type: String, trim: true, maxlength: 100 }], // 추가 운송 장비
        // 안전 장비
        safetyGear: [{ type: String, trim: true, maxlength: 100 }], // 안전 장비
        fireSuppression: [{ type: String, trim: true, maxlength: 100 }], // 소화 장비
        medicalEquipment: [{ type: String, trim: true, maxlength: 100 }], // 의료 장비
        emergencyEquipment: [{ type: String, trim: true, maxlength: 100 }] // 비상 장비
      },
      // 기타 예외적 장비
      etc: [{ type: String, trim: true, maxlength: 100 }] // 기타 특수 장비
    }
  },
  

    
    // 컷 이미지 URL
    imageUrl: {
      type: String,
      default: null,
      trim: true
  },
  
  // 컷 순서 (씬 내에서의 순서)
  order: {
    type: Number,
    default: 0
  },
  
  // 편집 권한
  canEdit: {
    type: Boolean,
    default: true
  },
  
  // 마지막 수정 정보
  lastModified: {
    type: Date,
    default: Date.now
  },
  
  modifiedBy: {
    type: String,
    default: 'AI',
    trim: true
  }
}, {
  // 자동으로 생성/수정 시간 관리
  timestamps: true,
  
  // JSON 변환 시 가상 필드 포함
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 가상 필드: 컷 번호 (순서 기반)
cutSchema.virtual('cutNumber').get(function() {
  return this.shotNumber || this.order + 1;
});

// 가상 필드: 지속 시간 포맷
cutSchema.virtual('durationFormatted').get(function() {
  const minutes = Math.floor(this.estimatedDuration / 60);
  const seconds = this.estimatedDuration % 60;
  
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
  }
  return `${seconds}초`;
});

// 인덱스 설정
cutSchema.index({ sceneId: 1, order: 1 });
cutSchema.index({ projectId: 1, status: 1 });
cutSchema.index({ 'shootingConditions.location': 1 });
cutSchema.index({ 'shootingConditions.timeOfDay': 1 });
cutSchema.index({ productionMethod: 1 });

// 미들웨어: 컷 저장 시 순서 자동 설정
cutSchema.pre('save', function(next) {
  if (!this.order && this.shotNumber) {
    this.order = this.shotNumber;
  }
  next();
});

// 정적 메서드: 씬의 컷 목록 조회
cutSchema.statics.findBySceneId = function(sceneId, options = {}) {
  const query = { sceneId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.productionMethod) {
    query.productionMethod = options.productionMethod;
  }
  
  return this.find(query)
    .sort({ order: 1 })
    .populate('sceneId', 'scene title');
};

// 정적 메서드: 프로젝트의 모든 컷 조회
cutSchema.statics.findByProjectId = function(projectId, options = {}) {
  const query = { projectId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.productionMethod) {
    query.productionMethod = options.productionMethod;
  }
  
  return this.find(query)
    .sort({ order: 1 })
    .populate('sceneId', 'scene title')
    .populate('projectId', 'projectTitle');
};

// 정적 메서드: 같은 장소의 컷들 조회
cutSchema.statics.findByLocation = function(projectId, location) {
  return this.find({
    projectId,
    'shootingConditions.location': location
  }).sort({ order: 1 });
};

// 정적 메서드: 같은 시간대의 컷들 조회
cutSchema.statics.findByTimeOfDay = function(projectId, timeOfDay) {
  return this.find({
    projectId,
    'shootingConditions.timeOfDay': timeOfDay
  }).sort({ order: 1 });
};

// 정적 메서드: 제작 방법별 컷들 조회
cutSchema.statics.findByProductionMethod = function(projectId, method) {
  return this.find({
    projectId,
    productionMethod: method
  }).sort({ order: 1 });
};

// 인스턴스 메서드: 컷 순서 변경
cutSchema.methods.updateOrder = function(newOrder) {
  this.order = newOrder;
  return this.save();
};

// 인스턴스 메서드: 컷 상태 업데이트
cutSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

// 인스턴스 메서드: 카메라 설정 업데이트
cutSchema.methods.updateCameraSetup = function(newSetup) {
  this.cameraSetup = { ...this.cameraSetup, ...newSetup };
  return this.save();
};

// 인스턴스 메서드: 결과물 정보 업데이트
cutSchema.methods.updateOutput = function(newOutput) {
  this.output = { ...this.output, ...newOutput };
  return this.save();
};

module.exports = mongoose.model('Cut', cutSchema); 