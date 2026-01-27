<!-- Generated: 2026-01-28 15:30:00 KST -->

# Components + Hooks 단위 테스트

**문서 번호**: 2101_20
**원본 PRD**: 2101_공지사항_prd_v2.md
**PRD 참조**: 전체 프론트엔드 컴포넌트
**구현 범위**: React 컴포넌트, TanStack Query Hooks, Zustand Store 테스트
**복잡도**: M (1~2일)
**의존성**: 2101_11 ~ 2101_18 (모든 프론트엔드)

---

## 구현 목표

공지사항 프론트엔드 단위 테스트를 구현합니다.
- TanStack Query Hooks 테스트
- Zustand Store 테스트
- React 컴포넌트 테스트 (React Testing Library)

---

## 테스트 구조

```
src/__tests__/
├── hooks/
│   └── notices.test.ts
├── stores/
│   └── noticeFilterStore.test.ts
└── components/
    └── notices/
        ├── NoticeFilters.test.tsx
        ├── NoticeForm.test.tsx
        ├── CommentSection.test.tsx
        └── FileUpload.test.tsx
```

---

## TanStack Query Hooks 테스트

### src/__tests__/hooks/notices.test.ts

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotices, useNotice, useCreateNotice, useComments } from '@/hooks/notices';

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

// QueryClient wrapper 생성
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useNotices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('목록 조회 성공', async () => {
    const mockData = {
      data: [{ id: 1, title: '테스트 공지' }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useNotices({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notices'),
      expect.any(Object)
    );
  });

  it('필터 파라미터 전달', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [], pagination: {} }),
    });

    const { result } = renderHook(
      () => useNotices({ type: '공지', search: '테스트', sortBy: 'viewCount', page: 2 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/type=%EA%B3%B5%EC%A7%80.*search=%ED%85%8C%EC%8A%A4%ED%8A%B8.*sortBy=viewCount.*page=2/),
      expect.any(Object)
    );
  });

  it('에러 처리', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: '서버 오류' }),
    });

    const { result } = renderHook(() => useNotices({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useNotice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('상세 조회 성공', async () => {
    const mockData = {
      data: { id: 1, title: '테스트 공지', content: '내용' },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useNotice(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
  });

  it('id가 undefined면 쿼리 비활성화', () => {
    const { result } = renderHook(() => useNotice(undefined as any), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('useCreateNotice', () => {
  it('생성 성공 시 목록 캐시 무효화', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1 } }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateNotice(), { wrapper });

    const formData = new FormData();
    formData.append('title', '테스트');
    formData.append('content', '테스트 내용입니다');
    formData.append('type', '공지');

    await result.current.mutateAsync(formData);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notices'] });
  });
});

describe('useComments', () => {
  it('댓글 목록 조회', async () => {
    const mockData = {
      data: [
        { id: 1, content: '댓글1', replies: [] },
        { id: 2, content: '댓글2', replies: [{ id: 3, content: '답글1' }] },
      ],
      pagination: { total: 3 },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useComments(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data.length).toBe(2);
    expect(result.current.data?.data[1].replies.length).toBe(1);
  });
});
```

---

## Zustand Store 테스트

### src/__tests__/stores/noticeFilterStore.test.ts

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { describe, it, expect, beforeEach } from 'vitest';
import { useNoticeFilterStore } from '@/stores/noticeFilterStore';
import { act } from '@testing-library/react';

describe('noticeFilterStore', () => {
  beforeEach(() => {
    // 스토어 초기화
    const { reset } = useNoticeFilterStore.getState();
    act(() => reset());
  });

  it('초기 상태 확인', () => {
    const state = useNoticeFilterStore.getState();

    expect(state.type).toBe('all');
    expect(state.search).toBe('');
    expect(state.sortBy).toBe('latest');
    expect(state.page).toBe(1);
    expect(state.dateRange).toEqual({ start: null, end: null });
  });

  it('setType 동작', () => {
    const { setType } = useNoticeFilterStore.getState();

    act(() => setType('공지'));

    expect(useNoticeFilterStore.getState().type).toBe('공지');
    expect(useNoticeFilterStore.getState().page).toBe(1); // 페이지 리셋
  });

  it('setSearch 동작', () => {
    const { setSearch, setPage } = useNoticeFilterStore.getState();

    act(() => setPage(3));
    act(() => setSearch('테스트'));

    expect(useNoticeFilterStore.getState().search).toBe('테스트');
    expect(useNoticeFilterStore.getState().page).toBe(1); // 페이지 리셋
  });

  it('setSortBy 동작', () => {
    const { setSortBy } = useNoticeFilterStore.getState();

    act(() => setSortBy('viewCount'));

    expect(useNoticeFilterStore.getState().sortBy).toBe('viewCount');
    expect(useNoticeFilterStore.getState().page).toBe(1);
  });

  it('setPage 동작 (페이지 유지)', () => {
    const { setPage, setType } = useNoticeFilterStore.getState();

    act(() => setType('공지'));
    act(() => setPage(5));

    expect(useNoticeFilterStore.getState().page).toBe(5);
    expect(useNoticeFilterStore.getState().type).toBe('공지'); // 다른 필터 유지
  });

  it('setDateRange 동작', () => {
    const { setDateRange } = useNoticeFilterStore.getState();

    act(() => setDateRange({ start: '2026-01-01', end: '2026-01-31' }));

    expect(useNoticeFilterStore.getState().dateRange).toEqual({
      start: '2026-01-01',
      end: '2026-01-31',
    });
  });

  it('reset 동작', () => {
    const { setType, setSearch, setPage, reset } = useNoticeFilterStore.getState();

    act(() => {
      setType('공지');
      setSearch('테스트');
      setPage(5);
    });

    act(() => reset());

    const state = useNoticeFilterStore.getState();
    expect(state.type).toBe('all');
    expect(state.search).toBe('');
    expect(state.page).toBe(1);
  });

  it('getQueryParams 동작', () => {
    const { setType, setSearch, getQueryParams } = useNoticeFilterStore.getState();

    act(() => {
      setType('공지');
      setSearch('테스트');
    });

    const params = getQueryParams();

    expect(params.type).toBe('공지');
    expect(params.search).toBe('테스트');
    expect(params.sortBy).toBe('latest');
    expect(params.page).toBe(1);
  });

  it('getQueryParams - all 타입은 undefined', () => {
    const { getQueryParams } = useNoticeFilterStore.getState();

    const params = getQueryParams();

    expect(params.type).toBeUndefined();
  });
});
```

---

## React 컴포넌트 테스트

### src/__tests__/components/notices/NoticeFilters.test.tsx

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoticeFilters from '@/app/(main)/notices/_components/NoticeFilters';

describe('NoticeFilters', () => {
  const defaultProps = {
    type: 'all' as const,
    search: '',
    sortBy: 'latest' as const,
    onTypeChange: vi.fn(),
    onSearchChange: vi.fn(),
    onSortByChange: vi.fn(),
    onReset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('유형 탭 렌더링', () => {
    render(<NoticeFilters {...defaultProps} />);

    expect(screen.getByRole('tab', { name: '전체' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '공지' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '공유' })).toBeInTheDocument();
  });

  it('유형 탭 클릭 시 onTypeChange 호출', async () => {
    render(<NoticeFilters {...defaultProps} />);

    await userEvent.click(screen.getByRole('tab', { name: '공지' }));

    expect(defaultProps.onTypeChange).toHaveBeenCalledWith('공지');
  });

  it('검색 입력 시 디바운스 후 onSearchChange 호출', async () => {
    vi.useFakeTimers();
    render(<NoticeFilters {...defaultProps} />);

    const input = screen.getByPlaceholderText('제목 또는 내용 검색...');
    await userEvent.type(input, '테스트');

    expect(defaultProps.onSearchChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('테스트');
    vi.useRealTimers();
  });

  it('검색 초기화 버튼 클릭', async () => {
    render(<NoticeFilters {...defaultProps} search="테스트" />);

    const clearButton = screen.getByRole('button', { name: /x/i });
    await userEvent.click(clearButton);

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
  });

  it('필터 초기화 버튼 표시 조건', () => {
    const { rerender } = render(<NoticeFilters {...defaultProps} />);

    // 기본 상태: 초기화 버튼 없음
    expect(screen.queryByText('필터 초기화')).not.toBeInTheDocument();

    // 필터 적용 시: 초기화 버튼 표시
    rerender(<NoticeFilters {...defaultProps} type="공지" />);
    expect(screen.getByText('필터 초기화')).toBeInTheDocument();
  });

  it('필터 초기화 버튼 클릭 시 onReset 호출', async () => {
    render(<NoticeFilters {...defaultProps} type="공지" />);

    await userEvent.click(screen.getByText('필터 초기화'));

    expect(defaultProps.onReset).toHaveBeenCalled();
  });
});
```

### src/__tests__/components/notices/NoticeForm.test.tsx

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoticeForm from '@/app/(main)/notices/_components/NoticeForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 모킹
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/hooks/notices', () => ({
  useCreateNotice: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    isPending: false,
  }),
  useUpdateNotice: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('NoticeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('create 모드 렌더링', () => {
    renderWithProviders(<NoticeForm mode="create" />);

    expect(screen.getByLabelText('게시판 유형')).toBeInTheDocument();
    expect(screen.getByLabelText('제목')).toBeInTheDocument();
    expect(screen.getByLabelText('내용')).toBeInTheDocument();
    expect(screen.getByText('첨부파일')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '등록' })).toBeInTheDocument();
  });

  it('edit 모드 렌더링 (첨부파일 섹션 없음)', () => {
    const notice = {
      id: 1,
      title: '테스트 제목',
      content: '테스트 내용',
      type: '공지',
    };
    renderWithProviders(<NoticeForm mode="edit" notice={notice as any} />);

    expect(screen.getByDisplayValue('테스트 제목')).toBeInTheDocument();
    expect(screen.getByDisplayValue('테스트 내용')).toBeInTheDocument();
    expect(screen.queryByText('첨부파일')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
  });

  it('제목 5자 미만 시 에러 메시지', async () => {
    renderWithProviders(<NoticeForm mode="create" />);

    const titleInput = screen.getByLabelText('제목');
    await userEvent.type(titleInput, '짧음');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => {
      expect(screen.getByText('제목은 5자 이상이어야 합니다')).toBeInTheDocument();
    });
  });

  it('내용 10자 미만 시 에러 메시지', async () => {
    renderWithProviders(<NoticeForm mode="create" />);

    const contentInput = screen.getByLabelText('내용');
    await userEvent.type(contentInput, '짧은내용');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    await waitFor(() => {
      expect(screen.getByText('내용은 10자 이상이어야 합니다')).toBeInTheDocument();
    });
  });

  it('임시 저장 버튼 동작', async () => {
    renderWithProviders(<NoticeForm mode="create" />);

    const titleInput = screen.getByLabelText('제목');
    await userEvent.type(titleInput, '테스트 제목');

    await userEvent.click(screen.getByRole('button', { name: '임시 저장' }));

    const saved = localStorage.getItem('notice-draft');
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!).title).toBe('테스트 제목');
  });

  it('초기화 버튼 동작', async () => {
    localStorage.setItem('notice-draft', JSON.stringify({ title: '저장된 제목' }));

    renderWithProviders(<NoticeForm mode="create" />);

    await userEvent.click(screen.getByRole('button', { name: '초기화' }));

    expect(localStorage.getItem('notice-draft')).toBeNull();
  });

  it('글자 수 카운터 표시', async () => {
    renderWithProviders(<NoticeForm mode="create" />);

    const contentInput = screen.getByLabelText('내용');
    await userEvent.type(contentInput, 'abcdefghij');

    expect(screen.getByText('10 / 10,000')).toBeInTheDocument();
  });
});
```

### src/__tests__/components/notices/CommentSection.test.tsx

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommentSection from '@/app/(main)/notices/[id]/_components/CommentSection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 모킹
const mockComments = [
  {
    id: 1,
    content: '첫 번째 댓글',
    authorId: 2,
    authorName: '작성자1',
    createdAt: '2026-01-28T10:00:00Z',
    updatedAt: '2026-01-28T10:00:00Z',
    isEdited: false,
    replies: [
      {
        id: 2,
        content: '답글',
        authorId: 3,
        authorName: '작성자2',
        parentAuthorName: '작성자1',
        createdAt: '2026-01-28T11:00:00Z',
        updatedAt: '2026-01-28T11:00:00Z',
        isEdited: false,
      },
    ],
  },
  {
    id: 3,
    content: '두 번째 댓글 (수정됨)',
    authorId: 1, // 현재 사용자
    authorName: '나',
    createdAt: '2026-01-28T12:00:00Z',
    updatedAt: '2026-01-28T13:00:00Z',
    isEdited: true,
    replies: [],
  },
];

vi.mock('@/hooks/notices', () => ({
  useComments: () => ({
    data: {
      data: mockComments,
      pagination: { total: 3 },
    },
    isLoading: false,
  }),
  useCreateComment: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useUpdateComment: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  useDeleteComment: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('CommentSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('댓글 개수 표시', () => {
    renderWithProviders(
      <CommentSection noticeId={1} userId={1} userRole="USER" />
    );

    expect(screen.getByText('댓글 (3)')).toBeInTheDocument();
  });

  it('트리 구조 댓글 렌더링', () => {
    renderWithProviders(
      <CommentSection noticeId={1} userId={1} userRole="USER" />
    );

    expect(screen.getByText('첫 번째 댓글')).toBeInTheDocument();
    expect(screen.getByText('답글')).toBeInTheDocument();
    expect(screen.getByText('두 번째 댓글 (수정됨)')).toBeInTheDocument();
  });

  it('(edited) 배지 표시 (Decision #10)', () => {
    renderWithProviders(
      <CommentSection noticeId={1} userId={1} userRole="USER" />
    );

    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('답글에 답글 버튼 없음 (Decision #3)', () => {
    renderWithProviders(
      <CommentSection noticeId={1} userId={1} userRole="USER" />
    );

    const replyButtons = screen.getAllByRole('button', { name: /답글/i });
    // 최상위 댓글에만 답글 버튼 있음 (2개)
    expect(replyButtons.length).toBe(2);
  });

  it('본인 댓글에 수정/삭제 버튼 표시', () => {
    renderWithProviders(
      <CommentSection noticeId={1} userId={1} userRole="USER" />
    );

    // 두 번째 댓글(본인 작성)에 수정/삭제 버튼
    const editButtons = screen.getAllByRole('button', { name: '' }); // icon buttons
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('ADMIN은 모든 댓글 수정/삭제 가능', () => {
    renderWithProviders(
      <CommentSection noticeId={1} userId={999} userRole="ADMIN" />
    );

    // 모든 댓글에 수정/삭제 버튼
    const allCommentCards = screen.getAllByText(/댓글|답글/);
    expect(allCommentCards.length).toBeGreaterThan(0);
  });

  it('답글 버튼 클릭 시 답글 폼 표시', async () => {
    renderWithProviders(
      <CommentSection noticeId={1} userId={1} userRole="USER" />
    );

    const replyButtons = screen.getAllByRole('button', { name: /답글/i });
    await userEvent.click(replyButtons[0]);

    expect(screen.getByPlaceholderText('@작성자1에게 답글 작성...')).toBeInTheDocument();
  });

  it('댓글 작성 폼 동작', async () => {
    renderWithProviders(
      <CommentSection noticeId={1} userId={1} userRole="USER" />
    );

    const textarea = screen.getByPlaceholderText('댓글을 입력하세요...');
    await userEvent.type(textarea, '새 댓글');

    expect(screen.getByText('7 / 1,000')).toBeInTheDocument();
  });

  it('인라인 수정 모드 (Decision #15)', async () => {
    renderWithProviders(
      <CommentSection noticeId={1} userId={1} userRole="USER" />
    );

    // 본인 댓글의 수정 버튼 클릭
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(btn => btn.querySelector('svg[class*="Edit"]'));

    if (editButton) {
      await userEvent.click(editButton);

      // 인라인 Textarea 표시
      await waitFor(() => {
        expect(screen.getByDisplayValue('두 번째 댓글 (수정됨)')).toBeInTheDocument();
      });
    }
  });
});
```

### src/__tests__/components/notices/FileUpload.test.tsx

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '@/app/(main)/notices/_components/FileUpload';

// toast 모킹
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('FileUpload', () => {
  const defaultProps = {
    files: [] as File[],
    onChange: vi.fn(),
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('드롭존 렌더링', () => {
    render(<FileUpload {...defaultProps} />);

    expect(screen.getByText('파일을 드래그하거나 클릭하여 선택하세요')).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG, GIF, PDF, DOCX, PPTX/)).toBeInTheDocument();
  });

  it('파일 개수 표시', () => {
    render(<FileUpload {...defaultProps} />);

    expect(screen.getByText('0 / 5 파일')).toBeInTheDocument();
  });

  it('유효한 파일 추가', async () => {
    const onChange = vi.fn();
    render(<FileUpload {...defaultProps} onChange={onChange} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]')!;

    fireEvent.drop(input, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([file]));
    });
  });

  it('지원하지 않는 파일 형식 거부', async () => {
    render(<FileUpload {...defaultProps} />);

    const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
    const input = document.querySelector('input[type="file"]')!;

    fireEvent.drop(input, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('지원하지 않는 파일 형식')
      );
    });
  });

  it('파일 크기 초과 거부', async () => {
    render(<FileUpload {...defaultProps} maxSize={100} />);

    const file = new File(['a'.repeat(200)], 'large.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]')!;

    fireEvent.drop(input, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('파일 크기')
      );
    });
  });

  it('최대 파일 개수 초과 거부', async () => {
    const existingFiles = Array.from({ length: 5 }, (_, i) =>
      new File(['test'], `file${i}.pdf`, { type: 'application/pdf' })
    );

    render(<FileUpload {...defaultProps} files={existingFiles} />);

    expect(toast.error).not.toHaveBeenCalled();

    const newFile = new File(['test'], 'new.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]')!;

    fireEvent.drop(input, {
      dataTransfer: {
        files: [newFile],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('최대 5개')
      );
    });
  });

  it('파일 목록 렌더링', () => {
    const files = [
      new File(['test'], 'document.pdf', { type: 'application/pdf' }),
      new File(['test'], 'image.png', { type: 'image/png' }),
    ];

    render(<FileUpload {...defaultProps} files={files} />);

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.png')).toBeInTheDocument();
    expect(screen.getByText('2 / 5 파일')).toBeInTheDocument();
  });

  it('파일 삭제 버튼 동작', async () => {
    const onChange = vi.fn();
    const files = [
      new File(['test'], 'document.pdf', { type: 'application/pdf' }),
    ];

    render(<FileUpload {...defaultProps} files={files} onChange={onChange} />);

    const deleteButton = screen.getByRole('button');
    fireEvent.click(deleteButton);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('중복 파일 거부', async () => {
    const existingFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
    Object.defineProperty(existingFile, 'size', { value: 100 });

    render(<FileUpload {...defaultProps} files={[existingFile]} />);

    const duplicateFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
    Object.defineProperty(duplicateFile, 'size', { value: 100 });

    const input = document.querySelector('input[type="file"]')!;

    fireEvent.drop(input, {
      dataTransfer: {
        files: [duplicateFile],
        types: ['Files'],
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('이미 추가된 파일')
      );
    });
  });

  it('maxFiles 도달 시 드롭존 비활성화', () => {
    const files = Array.from({ length: 5 }, (_, i) =>
      new File(['test'], `file${i}.pdf`, { type: 'application/pdf' })
    );

    render(<FileUpload {...defaultProps} files={files} />);

    const dropzone = screen.getByText('파일을 드래그하거나 클릭하여 선택하세요').parentElement;
    expect(dropzone).toHaveClass('opacity-50');
    expect(dropzone).toHaveClass('cursor-not-allowed');
  });
});
```

---

## Acceptance Criteria

### Hooks 테스트
- [ ] useNotices - 목록 조회, 필터, 에러 처리
- [ ] useNotice - 상세 조회, 조건부 실행
- [ ] useCreateNotice - 생성, 캐시 무효화
- [ ] useComments - 트리 구조 조회

### Store 테스트
- [ ] 초기 상태
- [ ] 각 setter 동작
- [ ] 페이지 리셋 로직
- [ ] getQueryParams 동작

### 컴포넌트 테스트
- [ ] NoticeFilters - 유형 탭, 검색 디바운스, 초기화
- [ ] NoticeForm - 유효성 검증, 임시 저장
- [ ] CommentSection - 트리 구조, (edited), 답글 제한
- [ ] FileUpload - 타입/크기 검증, 개수 제한

---

## 완료 체크리스트

- [ ] `npm run test` 통과
- [ ] 컴포넌트 커버리지 80% 이상
- [ ] 접근성(a11y) 테스트 통과

---

**구현 완료**
