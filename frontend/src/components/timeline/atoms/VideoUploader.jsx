import React, { useState, useCallback, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  LinearProgress, 
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  CloudUpload, 
  VideoFile, 
  Delete, 
  PlayArrow,
  Pause,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

/**
 * 동영상 파일 업로드 컴포넌트
 * 드래그 앤 드롭과 파일 선택을 지원하며, 업로드된 동영상 미리보기 제공
 */
const VideoUploader = ({ 
  onVideoUpload, 
  onVideoRemove,
  acceptedFormats = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
  maxFileSize = 100 * 1024 * 1024, // 100MB
  disabled = false, 
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * 파일 유효성 검사
   */
  const validateFile = useCallback((file) => {
    // 파일 크기 검사
    if (file.size > maxFileSize) {
      throw new Error(`파일 크기가 너무 큽니다. 최대 ${Math.round(maxFileSize / 1024 / 1024)}MB까지 업로드 가능합니다.`);
    }

    // 파일 형식 검사
    if (!acceptedFormats.includes(file.type)) {
      throw new Error('지원하지 않는 동영상 형식입니다. MP4, AVI, MOV, WMV 형식을 지원합니다.');
    }

    return true;
  }, [maxFileSize, acceptedFormats]);

  /**
   * 파일 처리
   */
  const processFile = useCallback(async (file) => {
    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      // 파일 유효성 검사
      validateFile(file);

      // 실제 업로드 로직 (외부 핸들러 호출)
      if (onVideoUpload) {
        await onVideoUpload(file, (progress) => {
          setUploadProgress(progress);
        });
        
        // 업로드 성공 후 다이얼로그 닫기
        setIsUploading(false);
        setUploadProgress(100);
      } else {
        // onVideoUpload가 없는 경우 내부에서 처리
        const videoUrl = URL.createObjectURL(file);
        
        setUploadedVideo({
          file,
          url: videoUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        });
        
        setIsUploading(false);
        setUploadProgress(100);
      }

    } catch (err) {
      setError(err.message);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [validateFile, onVideoUpload]);

  /**
   * 파일 선택 핸들러
   */
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  /**
   * 드래그 앤 드롭 핸들러
   */
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  /**
   * 동영상 재생/일시정지 토글
   */
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  /**
   * 동영상 제거
   */
  const handleRemoveVideo = useCallback(() => {
    if (uploadedVideo?.url) {
      URL.revokeObjectURL(uploadedVideo.url);
    }
    setUploadedVideo(null);
    setError(null);
    setUploadProgress(0);
    
    if (onVideoRemove) {
      onVideoRemove();
    }
  }, [uploadedVideo, onVideoRemove]);

  /**
   * 파일 선택 버튼 클릭
   */
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      {/* 파일 입력 (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* 업로드 영역 */}
      {(!uploadedVideo || onVideoUpload) && (
        <Box
          sx={{
            border: `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            backgroundColor: isDragOver ? theme.palette.primary.light + '20' : 'transparent',
            transition: 'all 0.3s ease',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!disabled ? handleUploadClick : undefined}
        >
          <CloudUpload 
            sx={{ 
              fontSize: 48, 
              color: theme.palette.primary.main,
              mb: 2, 
            }} 
          />
          
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
            동영상 파일 업로드
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            동영상 파일을 드래그 앤 드롭하거나 클릭하여 선택하세요
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            지원 형식: MP4, AVI, MOV, WMV (최대 100MB)
          </Typography>
        </Box>
      )}

      {/* 업로드 진행률 */}
      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            업로드 중... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* 업로드된 동영상 미리보기 (onVideoUpload가 없을 때만 표시) */}
      {uploadedVideo && !onVideoUpload && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
            <video
              ref={videoRef}
              src={uploadedVideo.url}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '300px',
                objectFit: 'cover',
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* 재생/일시정지 버튼 */}
            <IconButton
              onClick={handlePlayPause}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.8)',
                },
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Box>

          {/* 동영상 정보 */}
          <Box sx={{ mt: 2, p: 2, backgroundColor: theme.palette.grey[100], borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {uploadedVideo.name}
              </Typography>
              
              <Tooltip title="동영상 제거">
                <IconButton size="small" onClick={handleRemoveVideo}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              크기: {(uploadedVideo.size / 1024 / 1024).toFixed(2)}MB | 
              형식: {uploadedVideo.type}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default VideoUploader; 