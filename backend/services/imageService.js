const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

/**
 * 이미지 서비스
 * DALL-E API의 임시 URL을 영구 URL로 변환하는 서비스
 */
class ImageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../uploads/images');
    this.ensureUploadDir();
  }

  /**
   * 업로드 디렉토리 생성
   */
  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      console.log('✅ 이미지 업로드 디렉토리 생성 완료:', this.uploadDir);
    } catch (error) {
      console.error('❌ 이미지 업로드 디렉토리 생성 실패:', error);
    }
  }

  /**
   * 임시 URL의 이미지를 다운로드하여 서버에 저장
   * @param {string} tempUrl - DALL-E API의 임시 URL
   * @param {string} filename - 저장할 파일명
   * @returns {Promise<string>} 영구 URL
   */
  async downloadAndSaveImage(tempUrl, filename) {
    try {
      console.log('🖼️ 이미지 다운로드 시작:', tempUrl);
      
      // 이미지 다운로드
      const response = await axios.get(tempUrl, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30초 타임아웃
      });

      // 파일명 생성 (타임스탬프 포함)
      const timestamp = Date.now();
      const extension = path.extname(filename) || '.png';
      const safeFilename = `${timestamp}_${filename.replace(/[^a-zA-Z0-9]/g, '_')}${extension}`;
      const filePath = path.join(this.uploadDir, safeFilename);

      // 파일 저장
      await fs.writeFile(filePath, response.data);
      console.log('✅ 이미지 저장 완료:', filePath);

      // 영구 URL 반환 (서버의 정적 파일 경로)
      const permanentUrl = `/uploads/images/${safeFilename}`;
      return permanentUrl;

    } catch (error) {
      console.error('❌ 이미지 다운로드/저장 실패:', error);
      throw new Error('이미지 저장에 실패했습니다.');
    }
  }

  /**
   * 이미지 URL이 임시 URL인지 확인
   * @param {string} url - 확인할 URL
   * @returns {boolean} 임시 URL 여부
   */
  isTemporaryUrl(url) {
    if (!url) return false;
    
    // DALL-E API의 임시 URL 패턴 확인
    const tempUrlPatterns = [
      /^https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net/,
      /^https:\/\/dalle\.azureedge\.net/,
      /^https:\/\/dalle\.prod\.openai\.com/
    ];
    
    return tempUrlPatterns.some(pattern => pattern.test(url));
  }

  /**
   * 이미지 URL을 영구 URL로 변환
   * @param {string} imageUrl - 원본 이미지 URL
   * @param {string} filename - 저장할 파일명
   * @returns {Promise<string>} 영구 URL 또는 원본 URL
   */
  async convertToPermanentUrl(imageUrl, filename) {
    if (!imageUrl) return null;
    
    // 이미 영구 URL이거나 개발용 이미지인 경우 그대로 반환
    if (!this.isTemporaryUrl(imageUrl)) {
      return imageUrl;
    }

    try {
      // 임시 URL을 영구 URL로 변환
      const permanentUrl = await this.downloadAndSaveImage(imageUrl, filename);
      console.log('✅ 이미지 URL 변환 완료:', imageUrl, '→', permanentUrl);
      return permanentUrl;
    } catch (error) {
      console.error('❌ 이미지 URL 변환 실패:', error);
      // 변환 실패 시 원본 URL 반환
      return imageUrl;
    }
  }

  /**
   * 여러 이미지 URL을 일괄 변환
   * @param {Array} conteList - 콘티 리스트
   * @returns {Promise<Array>} 변환된 콘티 리스트
   */
  async convertConteImages(conteList) {
    if (!Array.isArray(conteList)) return conteList;

    const convertedContes = await Promise.all(
      conteList.map(async (conte) => {
        if (conte.imageUrl) {
          try {
            const permanentUrl = await this.convertToPermanentUrl(
              conte.imageUrl, 
              `conte_${conte.scene || 'unknown'}.png`
            );
            return {
              ...conte,
              imageUrl: permanentUrl,
              originalImageUrl: conte.imageUrl // 원본 URL 보존
            };
          } catch (error) {
            console.error(`❌ 콘티 ${conte.scene} 이미지 변환 실패:`, error);
            return conte;
          }
        }
        return conte;
      })
    );

    console.log(`✅ ${conteList.length}개 콘티 이미지 변환 완료`);
    return convertedContes;
  }

  /**
   * 저장된 이미지 파일 삭제
   * @param {string} filename - 삭제할 파일명
   */
  async deleteImage(filename) {
    try {
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
      console.log('✅ 이미지 파일 삭제 완료:', filename);
    } catch (error) {
      console.error('❌ 이미지 파일 삭제 실패:', error);
    }
  }
}

module.exports = new ImageService(); 