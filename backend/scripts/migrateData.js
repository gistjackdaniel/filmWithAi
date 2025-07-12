const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Conte = require('../models/Conte');
require('dotenv').config();

/**
 * 데이터 마이그레이션 스크립트
 * 기존 임시 데이터를 MongoDB로 이전
 */

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sceneforge_db';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공')
})
.catch((error) => {
  console.error('❌ MongoDB 연결 실패:', error.message)
  process.exit(1)
});

/**
 * 샘플 사용자 데이터 생성
 * @returns {Promise<Object>} 생성된 사용자
 */
const createSampleUser = async () => {
  try {
    // 기존 샘플 사용자 확인
    let user = await User.findByEmail('sample@sceneforge.com');
    
    if (!user) {
      user = new User({
        googleId: 'sample_google_id_123',
        email: 'sample@sceneforge.com',
        name: '샘플 사용자',
        picture: 'https://via.placeholder.com/150'
      });
      await user.save();
      console.log('✅ 샘플 사용자 생성 완료:', user.name);
    } else {
      console.log('ℹ️ 기존 샘플 사용자 발견:', user.name);
    }
    
    return user;
  } catch (error) {
    console.error('❌ 샘플 사용자 생성 실패:', error.message);
    throw error;
  }
};

/**
 * 샘플 프로젝트 데이터 생성
 * @param {Object} user - 사용자 객체
 * @returns {Promise<Object>} 생성된 프로젝트
 */
const createSampleProject = async (user) => {
  try {
    // 기존 샘플 프로젝트 확인
    let project = await Project.findOne({
      userId: user._id,
      projectTitle: '샘플 영화 프로젝트'
    });
    
    if (!project) {
      project = new Project({
        userId: user._id,
        projectTitle: '샘플 영화 프로젝트',
        synopsis: '한 청년이 꿈을 향해 나아가는 이야기. 도시의 한적한 카페에서 시작된 우연한 만남이 인생의 전환점이 된다.',
        story: `스토리 개요:
청년 김민수(25세)는 평범한 회사원으로 일하며 꿈꿔왔던 영화감독의 꿈을 포기하고 있었다. 어느 날, 도시의 한적한 카페에서 우연히 만난 독립영화감독 이지은(30세)과의 만남이 그의 인생을 바꿔놓는다.

주요 등장인물:
- 김민수(25세): 평범한 회사원, 영화감독 꿈을 포기한 청년
- 이지은(30세): 독립영화감독, 열정적이고 도전적인 성격
- 박상우(28세): 민수의 친구, 현실적인 조언자

스토리 전개:
시작: 민수는 회사에서 퇴근 후 카페에서 우연히 지은을 만난다.
전개: 지은의 영화 제작 과정에 참여하게 되면서 민수의 영화에 대한 열정이 다시 깨어난다.
위기: 회사에서 영화 제작 참여를 반대하고, 민수는 현실과 꿈 사이에서 갈등한다.
절정: 지은의 영화가 상영되면서 민수는 자신의 진정한 꿈을 깨닫는다.
결말: 민수는 회사를 그만두고 영화감독의 길을 선택한다.

핵심 메시지: 꿈을 포기하지 말고 도전하라는 희망적인 메시지`,
        status: 'story_generated',
        settings: {
          genre: '드라마',
          maxScenes: 8,
          estimatedDuration: '90분'
        },
        tags: ['드라마', '성장', '꿈', '도전']
      });
      await project.save();
      console.log('✅ 샘플 프로젝트 생성 완료:', project.projectTitle);
    } else {
      console.log('ℹ️ 기존 샘플 프로젝트 발견:', project.projectTitle);
    }
    
    return project;
  } catch (error) {
    console.error('❌ 샘플 프로젝트 생성 실패:', error.message);
    throw error;
  }
};

/**
 * 샘플 콘티 데이터 생성
 * @param {Object} project - 프로젝트 객체
 * @returns {Promise<Array>} 생성된 콘티 목록
 */
const createSampleContes = async (project) => {
  try {
    // 기존 샘플 콘티 확인
    const existingContes = await Conte.find({ projectId: project._id });
    
    if (existingContes.length > 0) {
      console.log('ℹ️ 기존 샘플 콘티 발견:', existingContes.length, '개');
      return existingContes;
    }
    
    const sampleContes = [
      {
        scene: 1,
        title: '카페에서의 만남',
        description: '도시의 한적한 카페. 민수는 퇴근 후 피곤한 모습으로 커피를 마시고 있다. 이때 지은이 들어와 민수 옆 자리에 앉는다.',
        dialogue: '지은: "그 영화, 정말 좋았어요."\n민수: "어떤 영화요?"',
        cameraAngle: '중간 샷, 카페 내부',
        cameraWork: '정적 촬영, 자연스러운 대화 장면',
        characterLayout: '민수(왼쪽), 지은(오른쪽), 테이블을 사이에 둔 대각선 구도',
        props: '커피잔, 노트북, 책',
        weather: '맑음',
        lighting: '따뜻한 실내 조명',
        visualDescription: '카페의 따뜻한 분위기, 창밖으로는 도시의 야경이 보임',
        transition: '페이드 인',
        lensSpecs: '50mm 표준 렌즈',
        visualEffects: '없음',
        type: 'live_action',
        estimatedDuration: '3분',
        keywords: {
          userInfo: '샘플 사용자',
          location: '도시 카페',
          date: '2024-01-15',
          equipment: '기본 카메라 세트',
          cast: ['김민수', '이지은'],
          props: ['커피잔', '노트북', '책'],
          lighting: '따뜻한 실내 조명',
          weather: '맑음',
          timeOfDay: '저녁',
          specialRequirements: ['자연스러운 대화 연기']
        },
        weights: {
          locationPriority: 3,
          equipmentPriority: 2,
          castPriority: 4,
          timePriority: 3,
          complexity: 2
        },
        order: 1
      },
      {
        scene: 2,
        title: '영화 이야기',
        description: '지은이 자신의 영화 제작 경험을 이야기하며 민수의 관심을 끈다. 민수는 점점 흥미를 보이기 시작한다.',
        dialogue: '지은: "영화 만드는 게 꿈이었나요?"\n민수: "예전에는... 그랬죠."',
        cameraAngle: '클로즈업, 감정 표현에 집중',
        cameraWork: '줌 인/아웃으로 감정 변화 표현',
        characterLayout: '얼굴 클로즈업, 대화에 집중된 구도',
        props: '커피잔, 영화 포스터',
        weather: '맑음',
        lighting: '따뜻한 실내 조명',
        visualDescription: '감정이 담긴 얼굴 표정, 배경은 흐릿하게',
        transition: '크로스 페이드',
        lensSpecs: '85mm 망원 렌즈',
        visualEffects: '배경 블러',
        type: 'live_action',
        estimatedDuration: '2분',
        keywords: {
          userInfo: '샘플 사용자',
          location: '도시 카페',
          date: '2024-01-15',
          equipment: '기본 카메라 세트',
          cast: ['김민수', '이지은'],
          props: ['커피잔', '영화 포스터'],
          lighting: '따뜻한 실내 조명',
          weather: '맑음',
          timeOfDay: '저녁',
          specialRequirements: ['감정 연기', '클로즈업 촬영']
        },
        weights: {
          locationPriority: 3,
          equipmentPriority: 2,
          castPriority: 5,
          timePriority: 3,
          complexity: 3
        },
        order: 2
      },
      {
        scene: 3,
        title: '영화 제작 현장',
        description: '지은의 영화 제작 현장. 민수가 카메라 뒤에서 영화 촬영을 지켜보며 영화에 대한 열정을 다시 느낀다.',
        dialogue: '지은: "직접 해보시겠어요?"\n민수: "정말 괜찮을까요?"',
        cameraAngle: '와이드 샷, 영화 촬영 현장 전체',
        cameraWork: '패닝, 촬영 현장의 분위기 전달',
        characterLayout: '지은(중앙), 민수(옆), 촬영팀(배경)',
        props: '카메라, 조명 장비, 스크립트',
        weather: '맑음',
        lighting: '영화 조명',
        visualDescription: '영화 촬영 현장의 활기찬 분위기, 전문적인 장비들',
        transition: '스와이프',
        lensSpecs: '24mm 광각 렌즈',
        visualEffects: '없음',
        type: 'live_action',
        estimatedDuration: '4분',
        keywords: {
          userInfo: '샘플 사용자',
          location: '영화 촬영 스튜디오',
          date: '2024-01-20',
          equipment: '영화 카메라, 조명 장비',
          cast: ['김민수', '이지은', '촬영팀'],
          props: ['카메라', '조명 장비', '스크립트'],
          lighting: '영화 조명',
          weather: '실내',
          timeOfDay: '오후',
          specialRequirements: ['전문 촬영 장비', '촬영팀 동원']
        },
        weights: {
          locationPriority: 5,
          equipmentPriority: 5,
          castPriority: 4,
          timePriority: 4,
          complexity: 5
        },
        order: 3
      },
      {
        scene: 4,
        title: '회사에서의 갈등',
        description: '민수가 회사에서 영화 제작 참여를 상사에게 말씀드리지만 반대를 받는다. 현실과 꿈 사이에서 갈등한다.',
        dialogue: '상사: "영화? 회사 일은 어쩔 거야?"\n민수: "저... 잠깐만요."',
        cameraAngle: '중간 샷, 회사 사무실',
        cameraWork: '정적 촬영, 긴장감 표현',
        characterLayout: '민수(왼쪽), 상사(오른쪽), 책상을 사이에 둔 대립 구도',
        props: '책상, 컴퓨터, 서류',
        weather: '맑음',
        lighting: '차가운 형광등',
        visualDescription: '회사 사무실의 딱딱한 분위기, 창밖으로는 도시 풍경',
        transition: '컷',
        lensSpecs: '35mm 렌즈',
        visualEffects: '없음',
        type: 'live_action',
        estimatedDuration: '3분',
        keywords: {
          userInfo: '샘플 사용자',
          location: '회사 사무실',
          date: '2024-01-25',
          equipment: '기본 카메라 세트',
          cast: ['김민수', '상사'],
          props: ['책상', '컴퓨터', '서류'],
          lighting: '형광등',
          weather: '맑음',
          timeOfDay: '오후',
          specialRequirements: ['긴장감 연기', '대립 구도']
        },
        weights: {
          locationPriority: 4,
          equipmentPriority: 2,
          castPriority: 3,
          timePriority: 3,
          complexity: 3
        },
        order: 4
      },
      {
        scene: 5,
        title: '영화 상영회',
        description: '지은의 영화가 상영되는 영화관. 민수가 관객으로 참석하여 영화를 보며 감동받는다.',
        dialogue: '관객: "정말 좋은 영화네요."\n민수: "네, 정말 감동적이에요."',
        cameraAngle: '와이드 샷, 영화관 내부',
        cameraWork: '천천히 패닝, 영화관 분위기 전달',
        characterLayout: '민수(중앙), 관객들(배경), 스크린(배경)',
        props: '영화관 좌석, 팝콘, 음료',
        weather: '맑음',
        lighting: '영화관 조명',
        visualDescription: '영화관의 어두운 분위기, 스크린에서 영화가 상영되는 모습',
        transition: '페이드',
        lensSpecs: '28mm 광각 렌즈',
        visualEffects: '스크린 빛 효과',
        type: 'live_action',
        estimatedDuration: '5분',
        keywords: {
          userInfo: '샘플 사용자',
          location: '영화관',
          date: '2024-02-01',
          equipment: '기본 카메라 세트',
          cast: ['김민수', '관객들'],
          props: ['영화관 좌석', '팝콘', '음료'],
          lighting: '영화관 조명',
          weather: '맑음',
          timeOfDay: '저녁',
          specialRequirements: ['영화관 촬영 허가', '어두운 조명']
        },
        weights: {
          locationPriority: 4,
          equipmentPriority: 2,
          castPriority: 2,
          timePriority: 4,
          complexity: 3
        },
        order: 5
      },
      {
        scene: 6,
        title: '결심의 순간',
        description: '영화를 보고 감동받은 민수가 지은을 찾아가 자신의 꿈을 포기하지 않겠다고 결심을 밝힌다.',
        dialogue: '민수: "저도 영화감독이 되고 싶어요."\n지은: "정말요? 기다렸어요."',
        cameraAngle: '클로즈업, 감정 표현에 집중',
        cameraWork: '줌 인, 감정의 고조 표현',
        characterLayout: '민수(왼쪽), 지은(오른쪽), 감정적 대화 구도',
        props: '커피잔, 영화 포스터',
        weather: '맑음',
        lighting: '따뜻한 실내 조명',
        visualDescription: '감정이 담긴 얼굴 표정, 희망적인 분위기',
        transition: '크로스 페이드',
        lensSpecs: '85mm 망원 렌즈',
        visualEffects: '배경 블러',
        type: 'live_action',
        estimatedDuration: '3분',
        keywords: {
          userInfo: '샘플 사용자',
          location: '카페',
          date: '2024-02-05',
          equipment: '기본 카메라 세트',
          cast: ['김민수', '이지은'],
          props: ['커피잔', '영화 포스터'],
          lighting: '따뜻한 실내 조명',
          weather: '맑음',
          timeOfDay: '저녁',
          specialRequirements: ['감정 연기', '클로즈업 촬영']
        },
        weights: {
          locationPriority: 3,
          equipmentPriority: 2,
          castPriority: 5,
          timePriority: 3,
          complexity: 3
        },
        order: 6
      },
      {
        scene: 7,
        title: '회사 사직',
        description: '민수가 회사에 사직서를 제출하고 영화감독의 길을 선택하는 순간.',
        dialogue: '민수: "저는 제 꿈을 따라가겠습니다."\n상사: "정말 그럴 건가?"',
        cameraAngle: '중간 샷, 회사 사무실',
        cameraWork: '정적 촬영, 결심의 무게감 표현',
        characterLayout: '민수(중앙), 상사(오른쪽), 대립 구도',
        props: '사직서, 책상, 컴퓨터',
        weather: '맑음',
        lighting: '형광등',
        visualDescription: '회사 사무실, 사직서가 놓인 책상',
        transition: '컷',
        lensSpecs: '50mm 표준 렌즈',
        visualEffects: '없음',
        type: 'live_action',
        estimatedDuration: '2분',
        keywords: {
          userInfo: '샘플 사용자',
          location: '회사 사무실',
          date: '2024-02-10',
          equipment: '기본 카메라 세트',
          cast: ['김민수', '상사'],
          props: ['사직서', '책상', '컴퓨터'],
          lighting: '형광등',
          weather: '맑음',
          timeOfDay: '오후',
          specialRequirements: ['결심의 무게감 연기']
        },
        weights: {
          locationPriority: 4,
          equipmentPriority: 2,
          castPriority: 4,
          timePriority: 3,
          complexity: 2
        },
        order: 7
      },
      {
        scene: 8,
        title: '새로운 시작',
        description: '민수가 영화감독으로서 첫 작품을 촬영하는 현장. 꿈을 향해 나아가는 희망적인 모습.',
        dialogue: '지은: "이제 당신 차례예요."\n민수: "네, 시작해보겠습니다."',
        cameraAngle: '와이드 샷, 영화 촬영 현장',
        cameraWork: '크레인 샷, 희망적인 분위기 전달',
        characterLayout: '민수(중앙), 지은(옆), 촬영팀(배경)',
        props: '카메라, 조명 장비, 스크립트',
        weather: '맑음',
        lighting: '영화 조명',
        visualDescription: '영화 촬영 현장, 민수가 카메라 뒤에서 지휘하는 모습',
        transition: '페이드 아웃',
        lensSpecs: '24mm 광각 렌즈',
        visualEffects: '없음',
        type: 'live_action',
        estimatedDuration: '4분',
        keywords: {
          userInfo: '샘플 사용자',
          location: '영화 촬영 스튜디오',
          date: '2024-02-15',
          equipment: '영화 카메라, 조명 장비',
          cast: ['김민수', '이지은', '촬영팀'],
          props: ['카메라', '조명 장비', '스크립트'],
          lighting: '영화 조명',
          weather: '실내',
          timeOfDay: '오후',
          specialRequirements: ['전문 촬영 장비', '촬영팀 동원']
        },
        weights: {
          locationPriority: 5,
          equipmentPriority: 5,
          castPriority: 4,
          timePriority: 4,
          complexity: 5
        },
        order: 8
      }
    ];
    
    const contes = [];
    for (const conteData of sampleContes) {
      const conte = new Conte({
        projectId: project._id,
        ...conteData
      });
      await conte.save();
      contes.push(conte);
    }
    
    console.log('✅ 샘플 콘티 생성 완료:', contes.length, '개');
    return contes;
  } catch (error) {
    console.error('❌ 샘플 콘티 생성 실패:', error.message);
    throw error;
  }
};

/**
 * 데이터 무결성 검증
 * @param {Object} user - 사용자 객체
 * @param {Object} project - 프로젝트 객체
 * @param {Array} contes - 콘티 목록
 */
const validateDataIntegrity = async (user, project, contes) => {
  try {
    console.log('\n🔍 데이터 무결성 검증 중...');
    
    // 사용자 검증
    const userCheck = await User.findById(user._id);
    if (!userCheck) {
      throw new Error('사용자 데이터 검증 실패');
    }
    console.log('✅ 사용자 데이터 검증 완료');
    
    // 프로젝트 검증
    const projectCheck = await Project.findById(project._id).populate('userId');
    if (!projectCheck || projectCheck.userId._id.toString() !== user._id.toString()) {
      throw new Error('프로젝트 데이터 검증 실패');
    }
    console.log('✅ 프로젝트 데이터 검증 완료');
    
    // 콘티 검증
    const conteCheck = await Conte.find({ projectId: project._id });
    if (conteCheck.length !== contes.length) {
      throw new Error('콘티 데이터 검증 실패');
    }
    console.log('✅ 콘티 데이터 검증 완료');
    
    console.log('🎉 모든 데이터 무결성 검증 완료!');
  } catch (error) {
    console.error('❌ 데이터 무결성 검증 실패:', error.message);
    throw error;
  }
};

/**
 * 메인 마이그레이션 함수
 */
const runMigration = async () => {
  try {
    console.log('🚀 데이터 마이그레이션 시작...\n');
    
    // 1. 샘플 사용자 생성
    const user = await createSampleUser();
    
    // 2. 샘플 프로젝트 생성
    const project = await createSampleProject(user);
    
    // 3. 샘플 콘티 생성
    const contes = await createSampleContes(project);
    
    // 4. 데이터 무결성 검증
    await validateDataIntegrity(user, project, contes);
    
    console.log('\n🎉 데이터 마이그레이션 완료!');
    console.log(`📊 마이그레이션 결과:`);
    console.log(`   - 사용자: 1명`);
    console.log(`   - 프로젝트: 1개`);
    console.log(`   - 콘티: ${contes.length}개`);
    
    // 연결 종료
    await mongoose.connection.close();
    console.log('✅ MongoDB 연결 종료');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  }
};

// 스크립트 실행
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration }; 