const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Conte = require('../models/Conte');
require('dotenv').config();

/**
 * 데이터베이스 성능 최적화 스크립트
 * MongoDB 인덱스 생성 및 성능 모니터링
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
 * 사용자 컬렉션 인덱스 최적화
 */
const optimizeUserIndexes = async () => {
  try {
    console.log('🔍 사용자 컬렉션 인덱스 최적화 중...');
    
    const userCollection = mongoose.connection.collection('users');
    
    // 기존 인덱스 확인
    const existingIndexes = await userCollection.indexes();
    console.log('📋 기존 인덱스:', existingIndexes.map(idx => idx.name));
    
    // 복합 인덱스 생성 (검색 성능 향상)
    await userCollection.createIndex(
      { email: 1, isActive: 1 },
      { name: 'email_active_compound' }
    );
    
    // 생성일자 인덱스 (정렬 성능 향상)
    await userCollection.createIndex(
      { createdAt: -1 },
      { name: 'created_at_desc' }
    );
    
    console.log('✅ 사용자 인덱스 최적화 완료');
  } catch (error) {
    console.error('❌ 사용자 인덱스 최적화 실패:', error.message);
  }
};

/**
 * 프로젝트 컬렉션 인덱스 최적화
 */
const optimizeProjectIndexes = async () => {
  try {
    console.log('🔍 프로젝트 컬렉션 인덱스 최적화 중...');
    
    const projectCollection = mongoose.connection.collection('projects');
    
    // 기존 인덱스 확인
    const existingIndexes = await projectCollection.indexes();
    console.log('📋 기존 인덱스:', existingIndexes.map(idx => idx.name));
    
    // 사용자별 프로젝트 조회 인덱스
    await projectCollection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'user_projects_compound' }
    );
    
    // 프로젝트 상태별 조회 인덱스
    await projectCollection.createIndex(
      { userId: 1, status: 1 },
      { name: 'user_status_compound' }
    );
    
    // 프로젝트 제목 검색 인덱스
    await projectCollection.createIndex(
      { projectTitle: 'text', synopsis: 'text' },
      { name: 'project_text_search' }
    );
    
    // 태그 검색 인덱스
    await projectCollection.createIndex(
      { tags: 1 },
      { name: 'project_tags' }
    );
    
    // 소프트 삭제 필터링 인덱스
    await projectCollection.createIndex(
      { isDeleted: 1, userId: 1 },
      { name: 'deleted_user_compound' }
    );
    
    console.log('✅ 프로젝트 인덱스 최적화 완료');
  } catch (error) {
    console.error('❌ 프로젝트 인덱스 최적화 실패:', error.message);
  }
};

/**
 * 콘티 컬렉션 인덱스 최적화
 */
const optimizeConteIndexes = async () => {
  try {
    console.log('🔍 콘티 컬렉션 인덱스 최적화 중...');
    
    const conteCollection = mongoose.connection.collection('contes');
    
    // 기존 인덱스 확인
    const existingIndexes = await conteCollection.indexes();
    console.log('📋 기존 인덱스:', existingIndexes.map(idx => idx.name));
    
    // 프로젝트별 콘티 조회 인덱스
    await conteCollection.createIndex(
      { projectId: 1, order: 1 },
      { name: 'project_order_compound' }
    );
    
    // 콘티 타입별 조회 인덱스
    await conteCollection.createIndex(
      { projectId: 1, type: 1 },
      { name: 'project_type_compound' }
    );
    
    // 장소별 콘티 조회 인덱스
    await conteCollection.createIndex(
      { 'keywords.location': 1, projectId: 1 },
      { name: 'location_project_compound' }
    );
    
    // 날짜별 콘티 조회 인덱스
    await conteCollection.createIndex(
      { 'keywords.date': 1, projectId: 1 },
      { name: 'date_project_compound' }
    );
    
    // 배우별 콘티 조회 인덱스
    await conteCollection.createIndex(
      { 'keywords.cast': 1, projectId: 1 },
      { name: 'cast_project_compound' }
    );
    
    // 콘티 상태별 조회 인덱스
    await conteCollection.createIndex(
      { projectId: 1, status: 1 },
      { name: 'project_status_compound' }
    );
    
    console.log('✅ 콘티 인덱스 최적화 완료');
  } catch (error) {
    console.error('❌ 콘티 인덱스 최적화 실패:', error.message);
  }
};

/**
 * 데이터베이스 통계 정보 출력
 */
const printDatabaseStats = async () => {
  try {
    console.log('\n📊 데이터베이스 통계:');
    
    const db = mongoose.connection.db;
    
    // 컬렉션별 문서 수
    const collections = ['users', 'projects', 'contes'];
    
    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`   - ${collectionName}: ${count}개 문서`);
    }
    
    // 인덱스 정보
    console.log('\n📋 인덱스 정보:');
    
    for (const collectionName of collections) {
      const indexes = await db.collection(collectionName).indexes();
      console.log(`   ${collectionName}:`);
      indexes.forEach(index => {
        console.log(`     - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 통계 조회 실패:', error.message);
  }
};

/**
 * 쿼리 성능 테스트
 */
const testQueryPerformance = async () => {
  try {
    console.log('\n🧪 쿼리 성능 테스트:');
    
    const startTime = Date.now();
    
    // 1. 사용자별 프로젝트 조회 성능 테스트
    const user = await User.findOne();
    if (user) {
      const projectsStart = Date.now();
      const projects = await Project.findByUserId(user._id);
      const projectsTime = Date.now() - projectsStart;
      console.log(`   - 사용자별 프로젝트 조회: ${projectsTime}ms (${projects.length}개)`);
    }
    
    // 2. 프로젝트별 콘티 조회 성능 테스트
    const project = await Project.findOne();
    if (project) {
      const contesStart = Date.now();
      const contes = await Conte.findByProjectId(project._id);
      const contesTime = Date.now() - contesStart;
      console.log(`   - 프로젝트별 콘티 조회: ${contesTime}ms (${contes.length}개)`);
    }
    
    // 3. 텍스트 검색 성능 테스트
    const searchStart = Date.now();
    const searchResults = await Project.searchProjects(user._id, '영화');
    const searchTime = Date.now() - searchStart;
    console.log(`   - 텍스트 검색: ${searchTime}ms (${searchResults.length}개)`);
    
    const totalTime = Date.now() - startTime;
    console.log(`   - 총 테스트 시간: ${totalTime}ms`);
    
  } catch (error) {
    console.error('❌ 쿼리 성능 테스트 실패:', error.message);
  }
};

/**
 * 메인 최적화 함수
 */
const runOptimization = async () => {
  try {
    console.log('🚀 데이터베이스 성능 최적화 시작...\n');
    
    // 1. 사용자 인덱스 최적화
    await optimizeUserIndexes();
    
    // 2. 프로젝트 인덱스 최적화
    await optimizeProjectIndexes();
    
    // 3. 콘티 인덱스 최적화
    await optimizeConteIndexes();
    
    // 4. 데이터베이스 통계 출력
    await printDatabaseStats();
    
    // 5. 쿼리 성능 테스트
    await testQueryPerformance();
    
    console.log('\n🎉 성능 최적화 완료!');
    
    // 연결 종료
    await mongoose.connection.close();
    console.log('✅ MongoDB 연결 종료');
    
  } catch (error) {
    console.error('❌ 최적화 실패:', error.message);
    process.exit(1);
  }
};

// 스크립트 실행
if (require.main === module) {
  runOptimization();
}

module.exports = { runOptimization }; 