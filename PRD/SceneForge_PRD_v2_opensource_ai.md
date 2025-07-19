# SceneForge ver.2 - 오픈소스 AI 비디오 생성 통합 설계

===============================================

## 2.2.2 AI 비디오 생성 통합 (오픈소스 기반)
================

### 2.2.2.1 오픈소스 AI 모델 스택

#### 텍스트-이미지 생성
- **Stable Diffusion XL (SDXL)**
  - 로컬 GPU 서버에서 실행
  - 콘티 기반으로 각 컷의 키프레임 이미지 생성
  - 커스텀 LoRA 모델로 영화 스타일 적용

- **ComfyUI**
  - 노드 기반 워크플로우 에디터
  - SceneForge와 연동하여 시각적 편집 인터페이스 제공
  - 실시간 이미지 생성 및 수정

#### 이미지-비디오 생성
- **AnimateDiff**
  - SDXL + AnimateDiff 조합으로 이미지 시퀀스 생성
  - 10초 단위 컷에 맞는 비디오 클립 생성
  - 모션 컨트롤을 통한 카메라 워크 시뮬레이션

- **Stable Video Diffusion (SVD)**
  - 이미지에서 비디오 생성
  - 더 자연스러운 모션과 일관성
  - 24fps 고품질 비디오 출력

#### 음성 생성
- **XTTS-v2 (Coqui TTS)**
  - 오픈소스 다국어 음성 합성
  - 캐릭터별 음성 프로파일 생성
  - 감정에 맞는 톤과 속도 조절

- **Bark (Suno)**
  - 더 자연스러운 음성과 배경음 생성
  - 대사, 음악, 효과음 통합 생성

### 2.2.2.2 원격 GPU 인프라 설계

#### GPU 클러스터 구성
```javascript
// backend/services/gpuClusterService.js
class GPUClusterService {
  constructor() {
    this.gpuNodes = new Map();
    this.taskQueue = [];
    this.loadBalancer = new LoadBalancer();
  }

  /**
   * GPU 노드 등록 및 관리
   */
  async registerGPUNode(nodeConfig) {
    const node = {
      id: nodeConfig.id,
      host: nodeConfig.host,
      port: nodeConfig.port,
      gpuInfo: {
        model: nodeConfig.gpuModel,
        memory: nodeConfig.gpuMemory,
        computeCapability: nodeConfig.computeCap
      },
      availableModels: nodeConfig.models,
      currentLoad: 0,
      maxConcurrentTasks: nodeConfig.maxTasks,
      status: 'available'
    };

    this.gpuNodes.set(node.id, node);
    console.log(`✅ GPU 노드 등록: ${node.id} (${node.gpuInfo.model})`);
  }

  /**
   * 최적 GPU 노드 선택
   */
  selectOptimalNode(taskType, requirements) {
    const availableNodes = Array.from(this.gpuNodes.values())
      .filter(node => 
        node.status === 'available' && 
        node.availableModels.includes(taskType) &&
        node.currentLoad < node.maxConcurrentTasks
      );

    if (availableNodes.length === 0) {
      throw new Error('사용 가능한 GPU 노드가 없습니다.');
    }

    // 로드 밸런싱 및 요구사항 매칭
    return this.loadBalancer.selectBestNode(availableNodes, requirements);
  }

  /**
   * AI 생성 작업 실행
   */
  async executeAITask(taskType, taskData, nodeId) {
    const node = this.gpuNodes.get(nodeId);
    if (!node) {
      throw new Error(`GPU 노드를 찾을 수 없습니다: ${nodeId}`);
    }

    const task = {
      id: this.generateTaskId(),
      type: taskType,
      data: taskData,
      nodeId: nodeId,
      status: 'queued',
      createdAt: Date.now()
    };

    this.taskQueue.push(task);
    node.currentLoad++;

    try {
      const result = await this.executeOnGPU(node, task);
      return result;
    } finally {
      node.currentLoad--;
    }
  }
}
```

#### GPU 노드 관리 시스템
```javascript
// backend/services/gpuNodeManager.js
class GPUNodeManager {
  /**
   * GPU 노드 상태 모니터링
   */
  async monitorGPUStatus() {
    for (const [nodeId, node] of this.gpuNodes) {
      try {
        const status = await this.checkNodeHealth(node);
        node.status = status.healthy ? 'available' : 'unavailable';
        node.currentLoad = status.currentLoad;
        node.gpuUtilization = status.gpuUtilization;
        node.memoryUsage = status.memoryUsage;
      } catch (error) {
        console.error(`❌ GPU 노드 상태 확인 실패: ${nodeId}`, error);
        node.status = 'error';
      }
    }
  }

  /**
   * 자동 스케일링
   */
  async autoScale() {
    const totalLoad = this.getTotalLoad();
    const availableNodes = this.getAvailableNodes();

    if (totalLoad > availableNodes.length * 0.8) {
      // 새로운 GPU 노드 추가 필요
      await this.addGPUNode();
    } else if (totalLoad < availableNodes.length * 0.3) {
      // 사용하지 않는 노드 제거
      await this.removeIdleNodes();
    }
  }
}
```

### 2.2.2.3 SceneForge AI 워크플로우 통합

#### ComfyUI 연동 시스템
```javascript
// backend/services/comfyUIIntegration.js
class ComfyUIIntegration {
  constructor() {
    this.comfyUIHost = process.env.COMFYUI_HOST || 'http://localhost:8188';
    this.workflowTemplates = this.loadWorkflowTemplates();
  }

  /**
   * 콘티 기반 ComfyUI 워크플로우 생성
   */
  async generateComfyUIWorkflow(conteData) {
    const workflow = {
      "1": {
        "inputs": {
          "text": conteData.description,
          "negative_text": "blurry, low quality, distorted",
          "width": 1024,
          "height": 576,
          "steps": 20,
          "cfg": 7.5,
          "sampler_name": "euler_a",
          "scheduler": "normal"
        },
        "class_type": "KSampler"
      },
      "2": {
        "inputs": {
          "ckpt_name": "sdxl_turbo.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "3": {
        "inputs": {
          "text": conteData.description,
          "clip": ["2", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "text": "blurry, low quality, distorted",
          "clip": ["2", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "5": {
        "inputs": {
          "samples": ["1", 0],
          "vae": ["2", 2]
        },
        "class_type": "VAEDecode"
      },
      "6": {
        "inputs": {
          "filename_prefix": `scene_${conteData.sceneNumber}_cut_${conteData.cutNumber}`,
          "images": ["5", 0]
        },
        "class_type": "SaveImage"
      }
    };

    return workflow;
  }

  /**
   * ComfyUI에서 이미지 생성 실행
   */
  async executeImageGeneration(workflow) {
    try {
      // 워크플로우 큐에 추가
      const response = await fetch(`${this.comfyUIHost}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: workflow
        })
      });

      const result = await response.json();
      const promptId = result.prompt_id;

      // 생성 완료 대기
      const imageResult = await this.waitForCompletion(promptId);
      return imageResult;

    } catch (error) {
      console.error('ComfyUI 이미지 생성 실패:', error);
      throw error;
    }
  }

  /**
   * AnimateDiff를 통한 비디오 생성
   */
  async generateVideoFromImage(imagePath, motionSettings) {
    const videoWorkflow = {
      "1": {
        "inputs": {
          "image": imagePath,
          "motion_bucket_id": motionSettings.bucketId,
          "num_frames": motionSettings.frames,
          "fps": 24
        },
        "class_type": "AnimateDiffLoader"
      },
      "2": {
        "inputs": {
          "samples": ["1", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode"
      },
      "3": {
        "inputs": {
          "filename_prefix": "animated_video",
          "images": ["2", 0]
        },
        "class_type": "SaveVideo"
      }
    };

    return await this.executeVideoGeneration(videoWorkflow);
  }
}
```

### 2.2.2.4 실시간 AI 편집 인터페이스

#### SceneEditModal 개선 (ComfyUI 스타일)
```jsx
// src/components/StoryGeneration/SceneEditModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Grid,
  Typography,
  Slider,
  TextField,
  Chip,
  IconButton
} from '@mui/material';
import { 
  PlayArrow, 
  Stop, 
  Refresh,
  Settings,
  Timeline
} from '@mui/icons-material';

const SceneEditModal = ({ open, onClose, conteData, onUpdate }) => {
  const [workflow, setWorkflow] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [motionSettings, setMotionSettings] = useState({
    bucketId: 127,
    frames: 240, // 10초 @ 24fps
    fps: 24
  });

  /**
   * 실시간 워크플로우 편집
   */
  const handleWorkflowChange = (nodeId, parameter, value) => {
    setWorkflow(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        inputs: {
          ...prev[nodeId].inputs,
          [parameter]: value
        }
      }
    }));
  };

  /**
   * AI 생성 실행
   */
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // 이미지 생성
      const imageResult = await executeImageGeneration(workflow);
      setPreviewImage(imageResult.images[0]);

      // 비디오 생성
      const videoResult = await generateVideoFromImage(
        imageResult.images[0], 
        motionSettings
      );

      // 결과 업데이트
      onUpdate({
        ...conteData,
        aiGenerated: true,
        aiVideoUrl: videoResult.video,
        aiImageUrl: imageResult.images[0]
      });

    } catch (error) {
      console.error('AI 생성 실패:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        AI 비디오 생성 편집기
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* 워크플로우 편집 패널 */}
          <Grid item xs={6}>
            <Typography variant="h6" gutterBottom>
              ComfyUI 워크플로우
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">프롬프트</Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={workflow?.["1"]?.inputs?.text || conteData.description}
                onChange={(e) => handleWorkflowChange("1", "text", e.target.value)}
                placeholder="이미지 생성 프롬프트를 입력하세요..."
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">네거티브 프롬프트</Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={workflow?.["1"]?.inputs?.negative_text || ""}
                onChange={(e) => handleWorkflowChange("1", "negative_text", e.target.value)}
                placeholder="제외할 요소들을 입력하세요..."
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">해상도</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <TextField
                    label="너비"
                    type="number"
                    value={workflow?.["1"]?.inputs?.width || 1024}
                    onChange={(e) => handleWorkflowChange("1", "width", parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="높이"
                    type="number"
                    value={workflow?.["1"]?.inputs?.height || 576}
                    onChange={(e) => handleWorkflowChange("1", "height", parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">생성 설정</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption">Steps</Typography>
                  <Slider
                    value={workflow?.["1"]?.inputs?.steps || 20}
                    onChange={(e, value) => handleWorkflowChange("1", "steps", value)}
                    min={10}
                    max={50}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption">CFG Scale</Typography>
                  <Slider
                    value={workflow?.["1"]?.inputs?.cfg || 7.5}
                    onChange={(e, value) => handleWorkflowChange("1", "cfg", value)}
                    min={1}
                    max={20}
                    step={0.5}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* 모션 설정 패널 */}
          <Grid item xs={6}>
            <Typography variant="h6" gutterBottom>
              비디오 모션 설정
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">모션 버킷 ID</Typography>
              <Slider
                value={motionSettings.bucketId}
                onChange={(e, value) => setMotionSettings(prev => ({
                  ...prev,
                  bucketId: value
                }))}
                min={1}
                max={255}
                marks
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                낮은 값: 정적인 모션, 높은 값: 동적인 모션
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">프레임 수</Typography>
              <TextField
                type="number"
                value={motionSettings.frames}
                onChange={(e) => setMotionSettings(prev => ({
                  ...prev,
                  frames: parseInt(e.target.value)
                }))}
                helperText={`${motionSettings.frames / motionSettings.fps}초`}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">FPS</Typography>
              <TextField
                type="number"
                value={motionSettings.fps}
                onChange={(e) => setMotionSettings(prev => ({
                  ...prev,
                  fps: parseInt(e.target.value)
                }))}
              />
            </Box>
          </Grid>

          {/* 미리보기 패널 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              미리보기
            </Typography>
            
            {previewImage && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <img 
                  src={previewImage} 
                  alt="생성된 이미지" 
                  style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
              </Box>
            )}

            {isGenerating && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" gutterBottom>
                  AI 비디오 생성 중... ({generationProgress}%)
                </Typography>
                <LinearProgress variant="determinate" value={generationProgress} />
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          취소
        </Button>
        <Button 
          onClick={handleGenerate}
          disabled={isGenerating}
          variant="contained"
          startIcon={isGenerating ? <Stop /> : <PlayArrow />}
        >
          {isGenerating ? '생성 중...' : 'AI 비디오 생성'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SceneEditModal;
```

### 2.2.2.5 GPU 클러스터 배포 가이드

#### Docker 기반 GPU 노드 설정
```dockerfile
# Dockerfile.gpu-node
FROM nvidia/cuda:11.8-devel-ubuntu20.04

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    python3.9 \
    python3.9-pip \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ComfyUI 설치
RUN git clone https://github.com/comfyanonymous/ComfyUI.git /app/ComfyUI
WORKDIR /app/ComfyUI

# Python 의존성 설치
RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
RUN pip3 install -r requirements.txt

# 추가 모델 설치
RUN mkdir -p models/checkpoints
RUN mkdir -p models/loras
RUN mkdir -p models/controlnet

# SDXL 모델 다운로드
RUN wget -O models/checkpoints/sdxl_turbo.safetensors \
    https://huggingface.co/stabilityai/stable-diffusion-xl-turbo/resolve/main/sd_xl_turbo.safetensors

# AnimateDiff 모델 다운로드
RUN wget -O models/motion_models/mm_sd_v15.ckpt \
    https://huggingface.co/guoyww/animatediff/resolve/main/mm_sd_v15.ckpt

# GPU 노드 서비스 시작
EXPOSE 8188
CMD ["python3", "main.py", "--listen", "0.0.0.0", "--port", "8188"]
```

#### Kubernetes GPU 클러스터 설정
```yaml
# gpu-cluster.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: sceneforge-ai

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: comfyui-gpu-node
  namespace: sceneforge-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: comfyui-gpu
  template:
    metadata:
      labels:
        app: comfyui-gpu
    spec:
      containers:
      - name: comfyui
        image: sceneforge/comfyui-gpu:latest
        ports:
        - containerPort: 8188
        resources:
          limits:
            nvidia.com/gpu: 1
          requests:
            nvidia.com/gpu: 1
        env:
        - name: CUDA_VISIBLE_DEVICES
          value: "0"
        - name: COMFYUI_HOST
          value: "0.0.0.0"
        - name: COMFYUI_PORT
          value: "8188"
        volumeMounts:
        - name: models-storage
          mountPath: /app/ComfyUI/models
        - name: outputs-storage
          mountPath: /app/ComfyUI/output
      volumes:
      - name: models-storage
        persistentVolumeClaim:
          claimName: models-pvc
      - name: outputs-storage
        persistentVolumeClaim:
          claimName: outputs-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: comfyui-service
  namespace: sceneforge-ai
spec:
  selector:
    app: comfyui-gpu
  ports:
  - port: 8188
    targetPort: 8188
  type: LoadBalancer
```

### 2.2.2.6 성능 최적화 및 모니터링

#### GPU 사용량 모니터링
```javascript
// backend/services/gpuMonitoringService.js
class GPUMonitoringService {
  /**
   * GPU 사용량 실시간 모니터링
   */
  async monitorGPUUsage() {
    const gpuStats = await this.getGPUStats();
    
    return {
      utilization: gpuStats.utilization,
      memoryUsage: gpuStats.memoryUsage,
      temperature: gpuStats.temperature,
      powerConsumption: gpuStats.powerConsumption,
      activeProcesses: gpuStats.activeProcesses
    };
  }

  /**
   * 작업 큐 최적화
   */
  async optimizeTaskQueue() {
    const pendingTasks = this.getPendingTasks();
    const availableGPUs = this.getAvailableGPUs();

    // 우선순위 기반 작업 스케줄링
    const optimizedQueue = this.scheduleTasks(pendingTasks, availableGPUs);
    
    return optimizedQueue;
  }

  /**
   * 자동 스케일링
   */
  async autoScaleGPU() {
    const currentLoad = await this.getCurrentLoad();
    const threshold = 0.8; // 80% 사용률

    if (currentLoad > threshold) {
      await this.addGPUNode();
    } else if (currentLoad < threshold * 0.5) {
      await this.removeIdleNode();
    }
  }
}
```

### 2.2.2.7 비용 최적화 전략

#### GPU 리소스 공유
- **시간대별 스케줄링**: 사용량이 적은 시간대에 배치 작업 실행
- **작업 우선순위**: 긴급한 작업과 배치 작업 분리
- **GPU 풀링**: 여러 프로젝트가 GPU 리소스를 공유

#### 모델 최적화
- **모델 양자화**: INT8/FP16 양자화로 메모리 사용량 절약
- **모델 캐싱**: 자주 사용되는 모델을 메모리에 캐시
- **점진적 로딩**: 필요한 모델만 동적으로 로드

### 2.2.2.8 보안 및 개인정보 보호

#### 로컬 GPU 활용
- **데이터 로컬 처리**: 민감한 콘텐츠는 로컬 GPU에서 처리
- **암호화 전송**: 네트워크 전송 시 데이터 암호화
- **접근 제어**: GPU 노드별 접근 권한 관리

#### 오픈소스 모델 장점
- **데이터 프라이버시**: 외부 API에 데이터 전송 없음
- **비용 절약**: API 호출 비용 없음
- **커스터마이징**: 모델을 프로젝트에 맞게 수정 가능

===============================================

**결론**: 오픈소스 AI 모델과 원격 GPU 클러스터를 활용하여 
SceneForge ver.2의 AI 비디오 생성 기능을 구현하면, 
비용 효율적이고 확장 가능한 솔루션을 제공할 수 있습니다. 