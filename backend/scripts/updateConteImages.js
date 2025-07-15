const mongoose = require('mongoose');
const axios = require('axios');
const Conte = require('../models/Conte');
require('dotenv').config();

/**
 * 기존 콘티들의 이미지 URL 업데이트 스크립트
 * OpenAI DALL-E API를 사용하여 실제 이미지를 생성
 */

// OpenAI API 키 확인
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.');
  process.exit(1);
}

/**
 * OpenAI DALL-E API를 사용하여 이미지 생성
 * @param {string} prompt - 이미지 생성 프롬프트
 * @returns {Promise<Object>} 생성된 이미지 정보
 */
async function generateImageWithDALLE(prompt) {
  try {
    console.log('🎨 DALL-E 이미지 생성 중:', prompt.substring(0, 100) + '...');
    
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural'
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2분 타임아웃
      }
    );

    const imageUrl = response.data.data[0].url;
    console.log('✅ DALL-E 이미지 생성 완료:', imageUrl);
    
    return {
      imageUrl: imageUrl,
      prompt: prompt,
      generatedAt: new Date().toISOString(),
      model: 'dall-e-3',
      isFreeTier: false
    };

  } catch (error) {
    console.error('❌ DALL-E 이미지 생성 실패:', error.message);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || 'OpenAI API 오류';
      
      switch (status) {
        case 400:
          throw new Error('잘못된 요청입니다. 프롬프트를 다시 확인해주세요.');
        case 429:
          throw new Error('DALL-E 3 API 사용 한도에 도달했습니다.');
        default:
          throw new Error(`OpenAI API 오류: ${message}`);
      }
    } else {
      throw new Error('네트워크 오류가 발생했습니다.');
    }
  }
}

/**
 * 씬 설명에 따라 적절한 이미지 프롬프트 생성
 * @param {Object} conte - 콘티 객체
 * @returns {string} 이미지 생성 프롬프트
 */
function generateImagePrompt(conte) {
  const basePrompt = `${conte.title}: ${conte.description}`;
  
  // 장르별 스타일 추가
  let stylePrompt = '';
  const sceneText = (conte.title + ' ' + conte.description).toLowerCase();
  
  if (sceneText.includes('액션') || sceneText.includes('싸움') || sceneText.includes('전투')) {
    stylePrompt = ', action movie style, dynamic camera angles, intense lighting';
  } else if (sceneText.includes('드라마') || sceneText.includes('감정') || sceneText.includes('울음')) {
    stylePrompt = ', dramatic movie style, emotional close-ups, moody lighting';
  } else if (sceneText.includes('로맨스') || sceneText.includes('사랑') || sceneText.includes('키스')) {
    stylePrompt = ', romantic movie style, soft lighting, intimate atmosphere';
  } else if (sceneText.includes('코미디') || sceneText.includes('웃음') || sceneText.includes('재미')) {
    stylePrompt = ', comedy movie style, bright lighting, cheerful atmosphere';
  } else if (sceneText.includes('스릴러') || sceneText.includes('공포') || sceneText.includes('긴장')) {
    stylePrompt = ', thriller movie style, dark lighting, suspenseful atmosphere';
  } else if (sceneText.includes('판타지') || sceneText.includes('마법') || sceneText.includes('요정')) {
    stylePrompt = ', fantasy movie style, magical atmosphere, ethereal lighting';
  } else if (sceneText.includes('sf') || sceneText.includes('우주') || sceneText.includes('로봇')) {
    stylePrompt = ', sci-fi movie style, futuristic setting, neon lighting';
  } else if (sceneText.includes('역사') || sceneText.includes('고대') || sceneText.includes('왕')) {
    stylePrompt = ', historical movie style, period setting, classical lighting';
  } else {
    stylePrompt = ', cinematic movie style, professional lighting, high quality';
  }
  
  // 시각적 설명이 있으면 추가
  if (conte.visualDescription) {
    return `${basePrompt}. ${conte.visualDescription}${stylePrompt}, cinematic composition, high quality, detailed`;
  }
  
  return `${basePrompt}${stylePrompt}, cinematic composition, high quality, detailed`;
}

async function updateConteImages() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 연결 성공');

    // imageUrl이 null인 콘티들 조회
    const contesWithoutImages = await Conte.find({ 
      imageUrl: { $in: [null, undefined, ''] } 
    });
    
    console.log(`📊 이미지가 없는 콘티 수: ${contesWithoutImages.length}`);

    if (contesWithoutImages.length === 0) {
      console.log('✅ 모든 콘티에 이미지가 있습니다.');
      return;
    }

    let updatedCount = 0;
    let failedCount = 0;

    for (const conte of contesWithoutImages) {
      try {
        console.log(`\n🎬 콘티 처리 중: ${conte.title} (씬 ${conte.scene})`);
        
        // 이미지 생성 프롬프트 생성
        const imagePrompt = generateImagePrompt(conte);
        
        // DALL-E API로 이미지 생성
        const imageResult = await generateImageWithDALLE(imagePrompt);

        // 콘티 업데이트
        await Conte.findByIdAndUpdate(conte._id, {
          imageUrl: imageResult.imageUrl,
          imagePrompt: imageResult.prompt,
          imageGeneratedAt: imageResult.generatedAt,
          imageModel: imageResult.model,
          isFreeTier: imageResult.isFreeTier
        });

        console.log(`✅ 콘티 업데이트 완료: ${conte.title} (씬 ${conte.scene})`);
        updatedCount++;

        // API 사용량 제한을 위해 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ 콘티 업데이트 실패: ${conte.title}`, error.message);
        failedCount++;
        
        // API 오류가 발생하면 더 오래 대기
        if (error.message.includes('한도') || error.message.includes('429')) {
          console.log('⏳ API 사용량 제한으로 인해 30초 대기...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    console.log(`\n🎉 업데이트 완료:`);
    console.log(`✅ 성공: ${updatedCount} 개 콘티`);
    console.log(`❌ 실패: ${failedCount} 개 콘티`);
    console.log(`📊 총 처리: ${updatedCount + failedCount} 개 콘티`);

  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
updateConteImages(); 