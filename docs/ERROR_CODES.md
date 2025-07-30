# SceneForge 에러 코드 문서

## 📋 개요

이 문서는 SceneForge API에서 발생할 수 있는 에러 코드와 해결 방법을 설명합니다.

## 🔢 HTTP 상태 코드

### 2xx - 성공
- `200 OK`: 요청이 성공적으로 처리됨
- `201 Created`: 리소스가 성공적으로 생성됨

### 4xx - 클라이언트 에러
- `400 Bad Request`: 잘못된 요청 형식
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `409 Conflict`: 리소스 충돌
- `422 Unprocessable Entity`: 요청은 유효하지만 처리할 수 없음

### 5xx - 서버 에러
- `500 Internal Server Error`: 서버 내부 오류
- `502 Bad Gateway`: 게이트웨이 오류
- `503 Service Unavailable`: 서비스 일시적 사용 불가

## 🚨 에러 응답 형식

```json
{
  "error": "에러_타입",
  "message": "사용자 친화적인 에러 메시지",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/project"
}
```

## 📝 에러 타입별 상세 설명

### 인증 관련 에러

#### `UNAUTHORIZED`
- **상태 코드**: 401
- **설명**: 인증이 필요한 리소스에 접근할 때 유효한 토큰이 없음
- **해결 방법**: 
  - 로그인하여 새로운 토큰 발급
  - 토큰이 만료된 경우 갱신

```json
{
  "error": "UNAUTHORIZED",
  "message": "인증이 필요합니다. 로그인 후 다시 시도해주세요.",
  "statusCode": 401
}
```

#### `INVALID_TOKEN`
- **상태 코드**: 401
- **설명**: 제공된 토큰이 유효하지 않음
- **해결 방법**: 새로운 토큰 발급

```json
{
  "error": "INVALID_TOKEN",
  "message": "유효하지 않은 토큰입니다.",
  "statusCode": 401
}
```

#### `TOKEN_EXPIRED`
- **상태 코드**: 401
- **설명**: 토큰이 만료됨
- **해결 방법**: 토큰 갱신 API 호출

```json
{
  "error": "TOKEN_EXPIRED",
  "message": "토큰이 만료되었습니다. 토큰을 갱신해주세요.",
  "statusCode": 401
}
```

### 프로젝트 관련 에러

#### `PROJECT_NOT_FOUND`
- **상태 코드**: 404
- **설명**: 요청한 프로젝트를 찾을 수 없음
- **해결 방법**: 
  - 프로젝트 ID 확인
  - 프로젝트 목록에서 올바른 ID 사용

```json
{
  "error": "PROJECT_NOT_FOUND",
  "message": "프로젝트를 찾을 수 없습니다.",
  "statusCode": 404
}
```

#### `PROJECT_ACCESS_DENIED`
- **상태 코드**: 403
- **설명**: 프로젝트에 대한 접근 권한이 없음
- **해결 방법**: 
  - 프로젝트 소유자에게 권한 요청
  - 올바른 프로젝트 ID 확인

```json
{
  "error": "PROJECT_ACCESS_DENIED",
  "message": "이 프로젝트에 접근할 권한이 없습니다.",
  "statusCode": 403
}
```

#### `PROJECT_ALREADY_EXISTS`
- **상태 코드**: 409
- **설명**: 동일한 이름의 프로젝트가 이미 존재함
- **해결 방법**: 다른 프로젝트 이름 사용

```json
{
  "error": "PROJECT_ALREADY_EXISTS",
  "message": "동일한 이름의 프로젝트가 이미 존재합니다.",
  "statusCode": 409
}
```

### 씬 관련 에러

#### `SCENE_NOT_FOUND`
- **상태 코드**: 404
- **설명**: 요청한 씬을 찾을 수 없음
- **해결 방법**: 
  - 씬 ID 확인
  - 프로젝트 내 씬 목록 확인

```json
{
  "error": "SCENE_NOT_FOUND",
  "message": "씬을 찾을 수 없습니다.",
  "statusCode": 404
}
```

#### `SCENE_ACCESS_DENIED`
- **상태 코드**: 403
- **설명**: 씬에 대한 접근 권한이 없음
- **해결 방법**: 프로젝트 권한 확인

```json
{
  "error": "SCENE_ACCESS_DENIED",
  "message": "이 씬에 접근할 권한이 없습니다.",
  "statusCode": 403
}
```

### 컷 관련 에러

#### `CUT_NOT_FOUND`
- **상태 코드**: 404
- **설명**: 요청한 컷을 찾을 수 없음
- **해결 방법**: 
  - 컷 ID 확인
  - 씬 내 컷 목록 확인

```json
{
  "error": "CUT_NOT_FOUND",
  "message": "컷을 찾을 수 없습니다.",
  "statusCode": 404
}
```

#### `IMAGE_GENERATION_FAILED`
- **상태 코드**: 500
- **설명**: AI 이미지 생성 실패
- **해결 방법**: 
  - 잠시 후 다시 시도
  - 컷 설명 수정 후 재시도

```json
{
  "error": "IMAGE_GENERATION_FAILED",
  "message": "이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
  "statusCode": 500
}
```

#### `INVALID_IMAGE_FORMAT`
- **상태 코드**: 400
- **설명**: 지원하지 않는 이미지 형식
- **해결 방법**: 
  - JPG, PNG, GIF, WEBP 형식 사용
  - 파일 크기 10MB 이하 확인

```json
{
  "error": "INVALID_IMAGE_FORMAT",
  "message": "지원하지 않는 이미지 형식입니다. JPG, PNG, GIF, WEBP 형식을 사용해주세요.",
  "statusCode": 400
}
```

### 스케줄러 관련 에러

#### `SCHEDULER_NOT_FOUND`
- **상태 코드**: 404
- **설명**: 요청한 스케줄러를 찾을 수 없음
- **해결 방법**: 
  - 스케줄러 ID 확인
  - 프로젝트 내 스케줄러 목록 확인

```json
{
  "error": "SCHEDULER_NOT_FOUND",
  "message": "스케줄러를 찾을 수 없습니다.",
  "statusCode": 404
}
```

#### `INVALID_SCHEDULE_DATE`
- **상태 코드**: 400
- **설명**: 잘못된 스케줄 날짜
- **해결 방법**: 
  - 시작일이 종료일보다 이전인지 확인
  - 유효한 날짜 형식 사용 (YYYY-MM-DD)

```json
{
  "error": "INVALID_SCHEDULE_DATE",
  "message": "잘못된 스케줄 날짜입니다. 시작일은 종료일보다 이전이어야 합니다.",
  "statusCode": 400
}
```

### 유효성 검증 에러

#### `VALIDATION_ERROR`
- **상태 코드**: 400
- **설명**: 요청 데이터 유효성 검증 실패
- **해결 방법**: 
  - 필수 필드 확인
  - 데이터 형식 확인
  - 필드 길이 제한 확인

```json
{
  "error": "VALIDATION_ERROR",
  "message": "입력 데이터가 올바르지 않습니다.",
  "statusCode": 400,
  "details": [
    {
      "field": "title",
      "message": "제목은 1자 이상 100자 이하여야 합니다."
    }
  ]
}
```

### 서버 에러

#### `INTERNAL_SERVER_ERROR`
- **상태 코드**: 500
- **설명**: 서버 내부 오류
- **해결 방법**: 
  - 잠시 후 다시 시도
  - 개발팀에 문의

```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  "statusCode": 500
}
```

#### `SERVICE_UNAVAILABLE`
- **상태 코드**: 503
- **설명**: 서비스 일시적 사용 불가
- **해결 방법**: 
  - 잠시 후 다시 시도
  - 서비스 상태 확인

```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.",
  "statusCode": 503
}
```

## 🔧 에러 처리 가이드

### 클라이언트 측 에러 처리

```javascript
async function handleApiRequest(url, options) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      
      switch (errorData.statusCode) {
        case 401:
          // 토큰 갱신 또는 로그인 페이지로 리다이렉트
          await refreshToken();
          break;
        case 403:
          // 권한 없음 처리
          showPermissionError(errorData.message);
          break;
        case 404:
          // 리소스 없음 처리
          showNotFoundError(errorData.message);
          break;
        case 500:
          // 서버 오류 처리
          showServerError(errorData.message);
          break;
        default:
          // 기타 에러 처리
          showGenericError(errorData.message);
      }
      
      throw new Error(errorData.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
}
```

### 토큰 갱신 처리

```javascript
async function refreshToken() {
  try {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        refresh_token: localStorage.getItem('refresh_token') 
      })
    });
    
    if (refreshResponse.ok) {
      const { access_token, refresh_token } = await refreshResponse.json();
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      return access_token;
    } else {
      // 토큰 갱신 실패 시 로그인 페이지로 이동
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    window.location.href = '/login';
  }
}
```

## 📞 지원 및 문의

에러가 지속적으로 발생하거나 해결되지 않는 경우:

1. **에러 로그 확인**: 브라우저 개발자 도구의 콘솔 확인
2. **네트워크 상태 확인**: 인터넷 연결 상태 확인
3. **서버 상태 확인**: `http://localhost:5001/docs` 접속 확인
4. **개발팀 문의**: GitHub Issues 또는 이메일로 문의

### 문의 시 포함할 정보

- 에러 메시지 전체
- 발생 시점의 사용자 액션
- 브라우저 정보 (Chrome, Firefox 등)
- 네트워크 탭의 요청/응답 정보
- 콘솔 로그 