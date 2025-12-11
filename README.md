# Plant Simulation UI

Plant Simulation UI는 WebGL을 사용한 2D 플랜트 시뮬레이션 프레임 편집 애플리케이션입니다.

## 기능

- **상단 메뉴바**: 원, 삼각형, 사각형, 연결선 컴포넌트 선택
- **왼쪽 사이드바**: 프레임 및 컴포넌트 트리 구조 표시
- **메인 화면**: WebGL 2D 프레임 뷰어 및 탭 관리
- **컴포넌트 조작**: 드래그 앤 드롭, 크기 조절, 컨텍스트 메뉴

## 기술 스택

### Backend
- Python 3.10+
- FastAPI
- SQLAlchemy
- PostgreSQL

### Frontend
- React 18
- TypeScript
- Three.js / React Three Fiber
- Axios

## 설치 및 실행

### 사전 요구사항
- Python 3.10 이상
- Node.js 18 이상
- PostgreSQL 접근 권한

### Backend 설정

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 데이터베이스 생성
python create_db.py

# 서버 실행
python run.py
```

Backend는 `http://localhost:8601`에서 실행됩니다.

### Frontend 설정

```bash
cd frontend
npm install
npm start
```

Frontend는 `http://localhost:8600`에서 실행됩니다.

## 프로젝트 구조

```
PS-UI-test3/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI 애플리케이션
│   │   ├── config.py        # 설정 관리
│   │   ├── database.py      # 데이터베이스 연결
│   │   ├── models.py        # SQLAlchemy 모델
│   │   ├── schemas.py       # Pydantic 스키마
│   │   └── crud.py          # CRUD 작업
│   ├── requirements.txt
│   ├── create_db.py
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   ├── contexts/        # React Context
│   │   ├── services/        # API 서비스
│   │   └── types.ts         # TypeScript 타입
│   └── package.json
├── config/
│   └── config.local.env     # 로컬 환경 설정
└── README.md
```

## API 엔드포인트

### Health Check
- `GET /api/health` - 서비스 상태 확인

### Frames
- `GET /api/frames` - 모든 프레임 조회
- `GET /api/frames/{id}` - 특정 프레임 조회
- `POST /api/frames` - 프레임 생성
- `PUT /api/frames/{id}` - 프레임 수정
- `DELETE /api/frames/{id}` - 프레임 삭제

### Components
- `GET /api/components/{id}` - 컴포넌트 조회
- `GET /api/frames/{frame_id}/components` - 프레임의 모든 컴포넌트 조회
- `POST /api/components` - 컴포넌트 생성
- `PUT /api/components/{id}` - 컴포넌트 수정
- `DELETE /api/components/{id}` - 컴포넌트 삭제

## 개발 가이드

자세한 개발 가이드는 `DevGuide.md`와 `CommonWebDevGuide.md`를 참고하세요.

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.

