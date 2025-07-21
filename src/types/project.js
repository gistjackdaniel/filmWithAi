/**
 * 프로젝트 관련 타입 정의
 */

/**
 * 프로젝트 상태 타입 (6단계로 간략화)
 * 1. draft: 초안 (시놉시스만 있음)
 * 2. story_ready: 스토리 준비됨 (스토리 생성 완료)
 * 3. conte_ready: 콘티 준비됨 (콘티 생성 완료)
 * 4. cut_generating: 컷 생성 중 (일부 씬만 컷 생성됨)
 * 5. cut_generated: 컷 생성 완료 (모든 씬의 컷 생성됨)
 * 6. production_ready: 제작 준비됨 (최종 완성)
 */
export const ProjectStatus = {
  DRAFT: 'draft',                     // 초안
  STORY_READY: 'story_ready',         // 스토리 준비됨
  CONTE_READY: 'conte_ready',         // 콘티 준비됨
  CUT_GENERATING: 'cut_generating',   // 컷 생성 중
  CUT_GENERATED: 'cut_generated',     // 컷 생성 완료
  PRODUCTION_READY: 'production_ready', // 제작 준비됨
}

/**
 * 콘티 생성 플로우 타입
 */
export const ConteGenerationFlow = {
  PROJECT_BASED: 'project_based',     // 프로젝트 기반 생성
  DIRECT_INPUT: 'direct_input',       // 직접 입력 생성
  TEMPLATE_BASED: 'template_based',   // 템플릿 기반 생성
}

/**
 * 프로젝트 API 응답 타입
 */
export const ProjectApiResponse = {
  success: Boolean,
  message: String,
  data: {
    project: {
      id: String,
      projectTitle: String,
      synopsis: String,
      story: String,
      status: ProjectStatus,
      settings: Object,
      tags: [String],
      createdAt: Date,
      updatedAt: Date,
      conteCount: Number,
      generatedConteCount: Number,
      liveActionConteCount: Number,
    }
  }
}

export default {
  ProjectStatus,
  ConteGenerationFlow,
  ProjectApiResponse,
} 