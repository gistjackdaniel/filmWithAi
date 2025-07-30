import React, { forwardRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { SceneType } from '../../../types/conte';

/**
 * 접근성이 개선된 씬 카드 컴포넌트
 * 키보드 네비게이션, 스크린 리더 지원, ARIA 라벨 포함
 */
const AccessibleSceneCard = forwardRef(({
  scene,
  selected = false,
  loading = false,
  onClick,
  onEdit,
  onInfo,
  onKeyDown,
  ...props
}, ref) => {
  // 씬 타입별 아이콘과 라벨
  const getTypeInfo = (type) => {
    switch (type) {
    case SceneType.GENERATED_VIDEO:
      return { icon: '🎬', label: 'AI 비디오 생성' };
    case SceneType.LIVE_ACTION:
      return { icon: '🎥', label: '실사 촬영' };
    default:
      return { icon: '📹', label: '기타' };
    }
  };

  const typeInfo = getTypeInfo(scene.type);
  const sceneNumber = scene.scene || scene.components?.sceneNumber || 'N/A';
  const description = scene.description || scene.components?.description || '설명 없음';

  // ARIA 라벨 생성
  const getAriaLabel = () => {
    const parts = [
      `씬 ${sceneNumber}`,
      typeInfo.label,
      description.length > 50 ? `${description.substring(0, 50)}...` : description,
    ];
    if (selected) parts.push('선택됨');
    return parts.join(', ');
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (event) => {
    switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      onClick?.(scene);
      break;
    case 'e':
    case 'E':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        onEdit?.(scene);
      }
      break;
    case 'i':
    case 'I':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        onInfo?.(scene);
      }
      break;
    default:
      onKeyDown?.(event);
    }
  };

  // 로딩 상태 스켈레톤
  if (loading) {
    return (
      <Box
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label="씬 로딩 중"
        aria-busy="true"
        sx={{
          width: '280px',
          height: '200px',
          backgroundColor: 'var(--color-card-bg)',
          borderRadius: 'var(--spacing-border-radius)',
          padding: 'var(--spacing-card-padding)',
          border: '2px solid var(--color-border)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            animation: 'loading 1.5s infinite',
          },
          '@keyframes loading': {
            '0%': { left: '-100%' },
            '100%': { left: '100%' },
          },
        }}
        {...props}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            로딩 중...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label={getAriaLabel()}
      aria-pressed={selected}
      aria-describedby={`scene-${scene.id}-description`}
      onClick={() => onClick?.(scene)}
      onKeyDown={handleKeyDown}
      sx={{
        width: '280px',
        minHeight: '200px',
        backgroundColor: selected ? 'var(--color-accent-bg)' : 'var(--color-card-bg)',
        borderRadius: 'var(--spacing-border-radius)',
        padding: 'var(--spacing-card-padding)',
        border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-card-gap)',
        
        // 포커스 스타일 (접근성)
        '&:focus': {
          outline: '3px solid var(--color-accent)',
          outlineOffset: '2px',
          transform: 'scale(1.02)',
        },
        
        // 호버 효과
        '&:hover': {
          backgroundColor: selected ? 'var(--color-accent-bg-hover)' : 'var(--color-card-bg-hover)',
          borderColor: 'var(--color-accent)',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        
        // 선택 상태
        '&[aria-pressed="true"]': {
          backgroundColor: 'var(--color-accent-bg)',
          borderColor: 'var(--color-accent)',
        },
        
        // 키보드 포커스 표시
        '&:focus-visible': {
          outline: '3px solid var(--color-accent)',
          outlineOffset: '2px',
        },
      }}
      {...props}
    >
      {/* 씬 헤더 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1,
      }}>
        <Typography 
          variant="h6" 
          component="h3"
          sx={{ 
            font: 'var(--font-heading-2)',
            color: 'var(--color-text-primary)',
            fontWeight: 'bold',
          }}
        >
          씬 {sceneNumber}
        </Typography>
        
        <Chip
          label={typeInfo.label}
          size="small"
          icon={<span role="img" aria-label={typeInfo.label}>{typeInfo.icon}</span>}
          sx={{
            backgroundColor: scene.type === SceneType.GENERATED_VIDEO 
              ? 'var(--color-success-bg)' 
              : 'var(--color-accent-bg)',
            color: 'var(--color-text-primary)',
            fontSize: '0.75rem',
            height: '24px',
          }}
        />
      </Box>

      {/* 씬 설명 */}
      <Typography 
        id={`scene-${scene.id}-description`}
        variant="body2" 
        sx={{ 
          font: 'var(--font-body-2)',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.4,
          flexGrow: 1,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {description}
      </Typography>

      {/* 씬 푸터 */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mt: 'auto',
        pt: 1,
        borderTop: '1px solid var(--color-border)',
      }}>
        <Typography 
          variant="caption" 
          sx={{ 
            font: 'var(--font-caption)',
            color: 'var(--color-text-secondary)',
          }}
        >
          지속시간: {scene.duration || 30}초
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              font: 'var(--font-caption)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Ctrl+E: 편집
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              font: 'var(--font-caption)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Ctrl+I: 정보
          </Typography>
        </Box>
      </Box>

      {/* 접근성을 위한 숨겨진 설명 */}
      <Box sx={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
        <span>
          {`씬 ${sceneNumber}입니다. ${typeInfo.label}입니다. ${description}`}
          {selected && ' 현재 선택된 씬입니다.'}
          {' Enter 키를 누르면 상세 정보를 볼 수 있습니다.'}
        </span>
      </Box>
    </Box>
  );
});

AccessibleSceneCard.displayName = 'AccessibleSceneCard';

export default AccessibleSceneCard; 