-- build_files 테이블 생성
CREATE TABLE IF NOT EXISTS build_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  build_id UUID NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  content_preview TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- builds 테이블에 새 필드 추가
ALTER TABLE builds
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
ADD COLUMN IF NOT EXISTS step INTEGER DEFAULT 1;

-- source_url 컬럼을 source_urls 배열로 변경
ALTER TABLE builds 
RENAME COLUMN source_url TO source_urls;

-- source_urls 컬럼 타입을 TEXT[]로 변경
ALTER TABLE builds
ALTER COLUMN source_urls TYPE TEXT[] USING 
  CASE 
    WHEN source_urls IS NULL THEN '{}'::TEXT[]
    WHEN source_urls = '' THEN '{}'::TEXT[]
    ELSE ARRAY[source_urls]
  END;

-- source_urls 컬럼 설명 업데이트
COMMENT ON COLUMN builds.source_urls IS '컨텐츠 소스 URL 배열';

-- 빌드 파일에 대한 RLS 정책 설정
ALTER TABLE build_files ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 조회 가능한 정책
CREATE POLICY "빌드 파일 조회 정책" 
ON build_files FOR SELECT USING (
  (build_id IN (
    SELECT id FROM builds WHERE is_public = true
  ))
  OR (auth.uid() = user_id)
);

-- 본인 소유 빌드에 대한 삽입 정책
CREATE POLICY "빌드 파일 삽입 정책" 
ON build_files FOR INSERT WITH CHECK (
  (auth.uid() = user_id) AND
  (build_id IN (SELECT id FROM builds WHERE user_id = auth.uid()))
);

-- 본인 소유 빌드에 대한 업데이트 정책
CREATE POLICY "빌드 파일 업데이트 정책" 
ON build_files FOR UPDATE USING (
  auth.uid() = user_id
);

-- 본인 소유 빌드에 대한 삭제 정책
CREATE POLICY "빌드 파일 삭제 정책" 
ON build_files FOR DELETE USING (
  auth.uid() = user_id
);

-- storage bucket 생성 (supabase UI에서 수동으로 수행)
-- 1. build-files 버킷을 생성하고 public access를 설정합니다
-- 2. 다음 RLS 정책 적용:
--    - 공개 빌드 파일은 누구나 읽기 가능
--    - 본인 소유 파일만 쓰기/삭제 가능 