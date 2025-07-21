const mongoose = require('mongoose');
const Conte = require('../models/Conte');
require('dotenv').config();

async function migrateVirtualToRealLocation() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sceneforge_db');
    console.log('✅ MongoDB 연결 성공');

    // virtualLocationId가 있는 모든 콘티 조회
    const contesWithVirtualLocation = await Conte.find({
      virtualLocationId: { $exists: true, $ne: null }
    });

    console.log(`📊 마이그레이션 대상 콘티 수: ${contesWithVirtualLocation.length}`);

    let successCount = 0;
    let errorCount = 0;

    for (const conte of contesWithVirtualLocation) {
      try {
        console.log(`🔄 콘티 ${conte.scene} (${conte._id}) 마이그레이션 중...`);
        
        // virtualLocationId를 realLocationId로 복사
        conte.realLocationId = conte.virtualLocationId;
        
        // virtualLocationId 필드 제거
        conte.virtualLocationId = undefined;
        
        // 저장
        await conte.save();
        
        console.log(`✅ 콘티 ${conte.scene} 마이그레이션 완료`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ 콘티 ${conte.scene} 마이그레이션 실패:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 마이그레이션 결과:');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${errorCount}개`);
    console.log(`📊 총 처리: ${contesWithVirtualLocation.length}개`);

    // 마이그레이션 후 검증
    const remainingVirtualLocation = await Conte.find({
      virtualLocationId: { $exists: true, $ne: null }
    });
    
    const newRealLocation = await Conte.find({
      realLocationId: { $exists: true, $ne: null }
    });

    console.log('\n🔍 검증 결과:');
    console.log(`📊 남은 virtualLocationId: ${remainingVirtualLocation.length}개`);
    console.log(`📊 새로운 realLocationId: ${newRealLocation.length}개`);

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 해제');
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateVirtualToRealLocation();
}

module.exports = migrateVirtualToRealLocation; 