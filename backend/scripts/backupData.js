const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

/**
 * MongoDB 데이터 백업 스크립트
 * 정기적인 데이터 백업 및 복원 기능 제공
 */

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sceneforge_db';
const BACKUP_DIR = path.join(__dirname, '../backups');

/**
 * 백업 디렉토리 생성
 */
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('✅ 백업 디렉토리 생성:', BACKUP_DIR);
  }
};

/**
 * 현재 날짜/시간으로 백업 파일명 생성
 * @returns {string} 백업 파일명
 */
const generateBackupFileName = () => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `sceneforge_backup_${dateStr}_${timeStr}`;
};

/**
 * MongoDB 데이터 백업
 * @param {string} backupName - 백업 파일명
 * @returns {Promise<string>} 백업 파일 경로
 */
const backupDatabase = async (backupName) => {
  return new Promise((resolve, reject) => {
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    // mongodump 명령어 실행
    const command = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;
    
    console.log('🔄 데이터베이스 백업 중...');
    console.log('📋 명령어:', command);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ 백업 실패:', error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn('⚠️ 백업 경고:', stderr);
      }
      
      console.log('✅ 백업 완료:', backupPath);
      resolve(backupPath);
    });
  });
};

/**
 * MongoDB 데이터 복원
 * @param {string} backupPath - 백업 파일 경로
 * @returns {Promise<void>}
 */
const restoreDatabase = async (backupPath) => {
  return new Promise((resolve, reject) => {
    // mongorestore 명령어 실행
    const command = `mongorestore --uri="${MONGODB_URI}" --drop "${backupPath}"`;
    
    console.log('🔄 데이터베이스 복원 중...');
    console.log('📋 명령어:', command);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ 복원 실패:', error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn('⚠️ 복원 경고:', stderr);
      }
      
      console.log('✅ 복원 완료');
      resolve();
    });
  });
};

/**
 * 백업 파일 목록 조회
 * @returns {Array} 백업 파일 목록
 */
const listBackups = () => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('📁 백업 디렉토리가 존재하지 않습니다.');
      return [];
    }
    
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(file => file.startsWith('sceneforge_backup_'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // 최신순 정렬
    
    return backups;
  } catch (error) {
    console.error('❌ 백업 목록 조회 실패:', error.message);
    return [];
  }
};

/**
 * 오래된 백업 파일 삭제
 * @param {number} daysToKeep - 보관할 일수 (기본값: 30일)
 */
const cleanupOldBackups = (daysToKeep = 30) => {
  try {
    const backups = listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const oldBackups = backups.filter(backup => 
      backup.createdAt < cutoffDate
    );
    
    if (oldBackups.length === 0) {
      console.log('ℹ️ 삭제할 오래된 백업이 없습니다.');
      return;
    }
    
    console.log(`🗑️ ${oldBackups.length}개의 오래된 백업 파일 삭제 중...`);
    
    oldBackups.forEach(backup => {
      try {
        fs.rmSync(backup.path, { recursive: true, force: true });
        console.log(`✅ 삭제 완료: ${backup.name}`);
      } catch (error) {
        console.error(`❌ 삭제 실패: ${backup.name}`, error.message);
      }
    });
    
    console.log('✅ 오래된 백업 정리 완료');
  } catch (error) {
    console.error('❌ 백업 정리 실패:', error.message);
  }
};

/**
 * 백업 통계 정보 출력
 */
const printBackupStats = () => {
  const backups = listBackups();
  
  if (backups.length === 0) {
    console.log('📊 백업 통계: 백업 파일이 없습니다.');
    return;
  }
  
  const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
  const latestBackup = backups[0];
  
  console.log('📊 백업 통계:');
  console.log(`   - 총 백업 파일: ${backups.length}개`);
  console.log(`   - 총 용량: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - 최신 백업: ${latestBackup.name}`);
  console.log(`   - 최신 백업 크기: ${(latestBackup.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   - 최신 백업 시간: ${latestBackup.createdAt.toLocaleString()}`);
};

/**
 * 메인 백업 함수
 */
const runBackup = async () => {
  try {
    console.log('🚀 MongoDB 백업 시작...\n');
    
    // 1. 백업 디렉토리 확인
    ensureBackupDir();
    
    // 2. 백업 파일명 생성
    const backupName = generateBackupFileName();
    
    // 3. 데이터베이스 백업
    const backupPath = await backupDatabase(backupName);
    
    // 4. 백업 통계 출력
    console.log('\n📊 백업 완료 통계:');
    printBackupStats();
    
    // 5. 오래된 백업 정리 (30일 이상)
    console.log('\n🧹 오래된 백업 정리 중...');
    cleanupOldBackups(30);
    
    console.log('\n🎉 백업 프로세스 완료!');
    
  } catch (error) {
    console.error('❌ 백업 실패:', error.message);
    process.exit(1);
  }
};

/**
 * 메인 복원 함수
 * @param {string} backupName - 복원할 백업 파일명
 */
const runRestore = async (backupName) => {
  try {
    console.log('🚀 MongoDB 복원 시작...\n');
    
    if (!backupName) {
      console.error('❌ 복원할 백업 파일명을 지정해주세요.');
      console.log('📋 사용법: node scripts/backupData.js restore <백업파일명>');
      process.exit(1);
    }
    
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ 백업 파일을 찾을 수 없습니다: ${backupPath}`);
      console.log('📋 사용 가능한 백업 파일:');
      listBackups().forEach(backup => {
        console.log(`   - ${backup.name}`);
      });
      process.exit(1);
    }
    
    // 데이터베이스 복원
    await restoreDatabase(backupPath);
    
    console.log('\n🎉 복원 프로세스 완료!');
    
  } catch (error) {
    console.error('❌ 복원 실패:', error.message);
    process.exit(1);
  }
};

/**
 * 백업 목록 출력 함수
 */
const runList = () => {
  console.log('📋 백업 파일 목록:\n');
  
  const backups = listBackups();
  
  if (backups.length === 0) {
    console.log('백업 파일이 없습니다.');
    return;
  }
  
  backups.forEach((backup, index) => {
    const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
    const dateStr = backup.createdAt.toLocaleString();
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   크기: ${sizeMB} MB`);
    console.log(`   생성일: ${dateStr}`);
    console.log('');
  });
};

// 명령행 인수 처리
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'backup':
    runBackup();
    break;
    
  case 'restore':
    const backupName = args[1];
    runRestore(backupName);
    break;
    
  case 'list':
    runList();
    break;
    
  case 'stats':
    printBackupStats();
    break;
    
  case 'cleanup':
    const days = parseInt(args[1]) || 30;
    cleanupOldBackups(days);
    break;
    
  default:
    console.log('📋 MongoDB 백업 스크립트 사용법:');
    console.log('');
    console.log('백업 생성:');
    console.log('  node scripts/backupData.js backup');
    console.log('');
    console.log('백업 복원:');
    console.log('  node scripts/backupData.js restore <백업파일명>');
    console.log('');
    console.log('백업 목록:');
    console.log('  node scripts/backupData.js list');
    console.log('');
    console.log('백업 통계:');
    console.log('  node scripts/backupData.js stats');
    console.log('');
    console.log('오래된 백업 정리:');
    console.log('  node scripts/backupData.js cleanup [일수]');
    console.log('');
    console.log('예시:');
    console.log('  node scripts/backupData.js backup');
    console.log('  node scripts/backupData.js restore sceneforge_backup_2024-01-15_14-30-00');
    console.log('  node scripts/backupData.js cleanup 30');
    break;
} 