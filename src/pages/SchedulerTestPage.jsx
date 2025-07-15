import SchedulerPage from './SchedulerPage'

// 테스트용 더미 콘티 데이터 (실제 콘티 데이터 구조와 동일)
const dummyConteData = [
  {
    id: 'scene_1',
    scene: 1,
    title: '일상 속 답답함',
    description: '대학생 지연은 카페에서 공부만 하며 지쳐 있다. 그녀는 학업과 미래에 대한 압박감에 시달리고 있다.',
    dialogue: '지연: "아... 정말 힘들어... 이대로는 안 될 것 같아."',
    cameraAngle: '카메라는 지연의 얼굴을 가까이에서 촬영하며 그녀의 피곤한 표정을 강조한다.',
    cameraWork: '카메라는 천천히 줌 아웃하여 지연이 있는 카페의 전체적인 분위기를 보여준다.',
    characterLayout: '지연은 카페 창가에 앉아 있다. 주변에는 다른 학생들이 산발적으로 앉아 있다.',
    props: '책과 노트북, 커피잔이 테이블 위에 놓여 있다.',
    weather: '맑은 날씨, 햇빛이 창문을 통해 들어온다.',
    lighting: '자연광을 활용하여 밝고 따뜻한 느낌을 준다.',
    visualDescription: '지연의 피곤한 표정과 카페의 조용한 분위기를 강조하는 장면.',
    transition: '지연이 카페 광고를 듣고 놀이공원으로 가기로 결심하는 장면으로 전환.',
    lensSpecs: '50mm 렌즈로 인물의 표정을 강조한다.',
    visualEffects: '필요 없음',
    type: 'live_action',
    estimatedDuration: '2분',
    keywords: {
      "userInfo": "지연",
      "location": "카페",
      "date": "2024-01-01",
      "equipment": "카메라",
      "cast": [
        "지연"
      ],
      "props": [
        "책",
        "노트북",
        "커피잔"
      ],
      "lighting": "자연광",
      "weather": "맑음",
      "timeOfDay": "오전",
      "specialRequirements": []
    },
    weights: {
      "locationPriority": 1,
      "equipmentPriority": 1,
      "castPriority": 1,
      "timePriority": 1,
      "complexity": 1
    },
    canEdit: true,
    lastModified: '2025-07-14T02:54:48.626Z',
    modifiedBy: 'AI'
  },
  {
    id: 'scene_2',
    scene: 2,
    title: '놀이공원의 설렘',
    description: '지연은 놀이공원에 도착해 놀이기구를 타며 학업의 스트레스를 잊는다. 그녀는 민혁과 우연히 만나게 된다.',
    dialogue: '민혁: "안녕하세요, 오늘 즐거운 시간 보내세요!" 지연: "감사합니다. 여기 오길 잘한 것 같아요."',
    cameraAngle: '놀이기구를 타고 있는 지연을 위에서 내려다보는 앵글.',
    cameraWork: '빠른 팬닝으로 놀이기구의 역동성을 강조.',
    characterLayout: '지연은 놀이기구에 앉아 있고, 민혁은 근처에서 고객을 맞이하고 있다.',
    props: '놀이기구와 민혁이 들고 있는 안내지.',
    weather: '맑은 날씨, 푸른 하늘이 보인다.',
    lighting: '밝은 자연광으로 활기찬 분위기를 연출.',
    visualDescription: '지연이 놀이기구를 타면서 느끼는 자유로움과 민혁의 환한 미소.',
    transition: '지연이 민혁과 대화를 나누며 놀이공원의 자유로운 분위기에 빠져드는 장면으로 전환.',
    lensSpecs: '35mm 렌즈로 넓은 장면을 담는다.',
    visualEffects: '필요 없음',
    type: 'live_action',
    estimatedDuration: '3분',
    keywords: {
      "userInfo": "지연",
      "location": "놀이공원",
      "date": "2024-01-01",
      "equipment": "카메라",
      "cast": [
        "지연",
        "민혁"
      ],
      "props": [
        "놀이기구",
        "안내지"
      ],
      "lighting": "자연광",
      "weather": "맑음",
      "timeOfDay": "오후",
      "specialRequirements": []
    },
    weights: {
      "locationPriority": 1,
      "equipmentPriority": 1,
      "castPriority": 1,
      "timePriority": 1,
      "complexity": 1
    },
    canEdit: true,
    lastModified: '2025-07-14T02:54:48.626Z',
    modifiedBy: 'AI'
  },
  {
    id: 'scene_3',
    scene: 3,
    title: '폭우 속의 깨달음',
    description: '폭우가 쏟아지는 가운데, 지연은 놀이공원에서 혼자 갇히게 된다. 민혁이 나타나 그녀를 돕고, 두 사람은 깊은 대화를 나눈다.',
    dialogue: '민혁: "여기서 이렇게 있을 수는 없어요. 비를 피해 함께 가시죠." 지연: "감사해요... 정말 고마워요."',
    cameraAngle: '비를 맞으며 서 있는 지연과 민혁을 가까이에서 잡는다.',
    cameraWork: '카메라는 두 사람의 얼굴을 클로즈업하며 감정적인 순간을 강조한다.',
    characterLayout: '지연과 민혁은 놀이공원의 한쪽에 서서 비를 피하고 있다.',
    props: '우산과 민혁이 건넨 수건.',
    weather: '폭우, 하늘은 어둡고 흐리다.',
    lighting: '어두운 배경에서 인물들에 집중된 조명.',
    visualDescription: '비를 맞으며 서로를 바라보는 두 사람의 모습.',
    transition: '지연이 민혁의 이야기를 듣고 자신의 삶을 돌아보는 장면으로 전환.',
    lensSpecs: '85mm 렌즈로 감정의 깊이를 표현.',
    visualEffects: '비 효과를 위한 그래픽 툴 사용',
    type: 'live_action',
    estimatedDuration: '4분',
    keywords: {
      "userInfo": "지연",
      "location": "놀이공원",
      "date": "2024-01-01",
      "equipment": "카메라",
      "cast": [
        "지연",
        "민혁"
      ],
      "props": [
        "우산",
        "수건"
      ],
      "lighting": "집중 조명",
      "weather": "폭우",
      "timeOfDay": "저녁",
      "specialRequirements": []
    },
    weights: {
      "locationPriority": 1,
      "equipmentPriority": 1,
      "castPriority": 1,
      "timePriority": 1,
      "complexity": 1
    },
    canEdit: true,
    lastModified: '2025-07-14T02:54:48.626Z',
    modifiedBy: 'AI'
  },
  {
    id: 'scene_4',
    scene: 4,
    title: '새로운 시작',
    description: '놀이공원에서의 경험을 통해 지연은 자신의 삶을 새롭게 바라보게 된다. 그녀는 학업 외에도 자신이 진정으로 원하는 것들을 찾아 나서기로 결심한다.',
    dialogue: '지연: "이제는 나만의 길을 찾아야겠어." 수미: "그래, 넌 할 수 있어!"',
    cameraAngle: '지연이 친구 수미와 함께 걷는 모습을 멀리서 잡는다.',
    cameraWork: '조용히 줌 아웃하여 두 사람이 함께 걸어가는 뒷모습을 보여준다.',
    characterLayout: '지연과 수미는 공원 길을 함께 걸어가며 대화를 나눈다.',
    props: '없음',
    weather: '맑고 화창한 날씨',
    lighting: '따뜻한 햇빛이 두 사람을 비춘다.',
    visualDescription: '두 친구가 함께 미래를 향해 걸어가는 모습을 담은 장면.',
    transition: '지연이 새로운 결심을 다지며 미소 짓는 장면으로 마무리.',
    lensSpecs: '35mm 렌즈로 두 사람의 친밀감을 표현.',
    visualEffects: '필요 없음',
    type: 'live_action',
    estimatedDuration: '2분',
    keywords: {
      "userInfo": "지연",
      "location": "공원",
      "date": "2024-01-01",
      "equipment": "카메라",
      "cast": [
        "지연",
        "수미"
      ],
      "props": [],
      "lighting": "자연광",
      "weather": "맑음",
      "timeOfDay": "오전",
      "specialRequirements": []
    },
    weights: {
      "locationPriority": 1,
      "equipmentPriority": 1,
      "castPriority": 1,
      "timePriority": 1,
      "complexity": 1
    },
    canEdit: true,
    lastModified: '2025-07-14T02:54:48.626Z',
    modifiedBy: 'AI'
  }
];

// 테스트 페이지 컴포넌트
const SchedulerTestPage = () => {
  // 디버깅: 더미 데이터 확인
  console.log('SchedulerTestPage - 더미 콘티 데이터:', dummyConteData);
  console.log('SchedulerTestPage - 데이터 개수:', dummyConteData.length);
  
  // SchedulerPage에 더미 콘티 데이터를 props로 전달
  return <SchedulerPage conteData={dummyConteData} />;
};

export default SchedulerTestPage; 