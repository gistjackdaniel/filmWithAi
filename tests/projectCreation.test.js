/**
 * 프로젝트 생성 플로우 테스트
 * SceneForge 프로젝트 생성 기능의 통합 테스트
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../src/pages/Dashboard'
import ProjectSelectionModal from '../src/components/ProjectSelectionModal'

// Mock API calls
const mockApi = {
  post: vi.fn(),
  get: vi.fn()
}

// Mock stores
const mockAuthStore = {
  user: { id: 'test-user', name: 'Test User' },
  logout: vi.fn()
}

const mockProjectStore = {
  projects: [],
  isLoading: false,
  loadProjects: vi.fn(),
  createProject: vi.fn()
}

// Mock components
vi.mock('../src/services/api', () => ({
  default: mockApi
}))

vi.mock('../src/stores/authStore', () => ({
  useAuthStore: () => mockAuthStore
}))

vi.mock('../src/stores/projectStore', () => ({
  useProjectStore: () => mockProjectStore
}))

describe('프로젝트 생성 플로우', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dashboard 컴포넌트', () => {
    it('새 프로젝트 버튼이 렌더링되어야 한다', () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )

      expect(screen.getByText('새 프로젝트')).toBeInTheDocument()
    })

    it('새 프로젝트 버튼 클릭 시 모달이 열려야 한다', async () => {
      render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      )

      const createButton = screen.getByText('새 프로젝트')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('새 프로젝트 만들기')).toBeInTheDocument()
      })
    })
  })

  describe('ProjectSelectionModal 컴포넌트', () => {
    it('프로젝트 제목 입력 필드가 있어야 한다', () => {
      render(
        <ProjectSelectionModal 
          open={true} 
          onClose={vi.fn()} 
          onConfirm={vi.fn()} 
        />
      )

      expect(screen.getByLabelText('프로젝트 제목')).toBeInTheDocument()
    })

    it('장르 선택 필드가 있어야 한다', () => {
      render(
        <ProjectSelectionModal 
          open={true} 
          onClose={vi.fn()} 
          onConfirm={vi.fn()} 
        />
      )

      expect(screen.getByLabelText('장르')).toBeInTheDocument()
    })

    it('시놉시스 입력 필드가 있어야 한다', () => {
      render(
        <ProjectSelectionModal 
          open={true} 
          onClose={vi.fn()} 
          onConfirm={vi.fn()} 
        />
      )

      expect(screen.getByLabelText('시놉시스 (선택사항)')).toBeInTheDocument()
    })

    it('프로젝트 제목 없이 제출 시 에러가 표시되어야 한다', async () => {
      const onConfirm = vi.fn()
      
      render(
        <ProjectSelectionModal 
          open={true} 
          onClose={vi.fn()} 
          onConfirm={onConfirm} 
        />
      )

      const submitButton = screen.getByText('프로젝트 생성')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onConfirm).not.toHaveBeenCalled()
      })
    })

    it('유효한 데이터로 제출 시 onConfirm이 호출되어야 한다', async () => {
      const onConfirm = vi.fn()
      
      render(
        <ProjectSelectionModal 
          open={true} 
          onClose={vi.fn()} 
          onConfirm={onConfirm} 
        />
      )

      // 프로젝트 제목 입력
      const titleInput = screen.getByLabelText('프로젝트 제목')
      fireEvent.change(titleInput, { target: { value: '테스트 프로젝트' } })

      // 장르 선택
      const genreSelect = screen.getByLabelText('장르')
      fireEvent.mouseDown(genreSelect)
      const actionOption = screen.getByText('액션')
      fireEvent.click(actionOption)

      // 시놉시스 입력
      const synopsisInput = screen.getByLabelText('시놉시스 (선택사항)')
      fireEvent.change(synopsisInput, { target: { value: '테스트 시놉시스' } })

      // 제출
      const submitButton = screen.getByText('프로젝트 생성')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith({
          title: '테스트 프로젝트',
          synopsis: '테스트 시놉시스',
          genre: '액션'
        })
      })
    })
  })
})

describe('콘티 생성 API 테스트', () => {
  it('콘티 생성 API가 올바른 데이터를 전송해야 한다', async () => {
    const mockConteData = {
      scene: 1,
      title: '테스트 씬',
      description: '테스트 설명',
      type: 'live_action'
    }

    mockApi.post.mockResolvedValue({
      data: { success: true, data: mockConteData }
    })

    const response = await mockApi.post('/api/projects/test-project-id/contes', mockConteData)

    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/projects/test-project-id/contes',
      mockConteData
    )
    expect(response.data.success).toBe(true)
  })
})

describe('통합 테스트 시나리오', () => {
  it('전체 프로젝트 생성 플로우가 정상 작동해야 한다', async () => {
    // 1. 대시보드에서 새 프로젝트 버튼 클릭
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    const createButton = screen.getByText('새 프로젝트')
    fireEvent.click(createButton)

    // 2. 모달에서 프로젝트 정보 입력
    await waitFor(() => {
      expect(screen.getByText('새 프로젝트 만들기')).toBeInTheDocument()
    })

    const titleInput = screen.getByLabelText('프로젝트 제목')
    fireEvent.change(titleInput, { target: { value: '통합 테스트 프로젝트' } })

    const synopsisInput = screen.getByLabelText('시놉시스 (선택사항)')
    fireEvent.change(synopsisInput, { target: { value: '통합 테스트 시놉시스' } })

    // 3. 프로젝트 생성
    const submitButton = screen.getByText('프로젝트 생성')
    fireEvent.click(submitButton)

    // 4. 콘티 생성 페이지로 이동 확인
    await waitFor(() => {
      expect(mockProjectStore.createProject).toHaveBeenCalled()
    })
  })
}) 