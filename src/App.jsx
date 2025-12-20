import { useState, useEffect } from 'react';

// ===========================
// Constants 
// ===========================
const API_URL = import.meta.env.VITE_API_URL || 'http://0.0.0.0:8000';
const EXAMPLE_QUESTIONS = [
  '반려동물 관련 지원을 받을 수 있나요?',
  '평생교육 지원 대상자는?',
  '한부모인데 아이돌봄 지원을 받을 수 있어?',
];

// ===========================
// Utilities
// ===========================
const parseMarkdown = (text) => {
  if (!text) return [];
  const parts = [];
  let currentIndex = 0;
  const boldPattern = /\*\*([^*]+)\*\*/g;
  let match;
  
  while ((match = boldPattern.exec(text)) !== null) {
    if (match.index > currentIndex) {
      parts.push({ type: 'text', content: text.slice(currentIndex, match.index) });
    }
    parts.push({ type: 'bold', content: match[1] });
    currentIndex = match.index + match[0].length;
  }
  
  if (currentIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(currentIndex) });
  }
  
  return parts;
};

const extractLawContent = (chunkContent) => {
  if (!chunkContent) return '';
  const lines = chunkContent.split('\n');
  const contentLines = [];
  let skipMetadata = true;
  
  for (const line of lines) {
    if (line.trim().startsWith('[지자체]') || 
        line.trim().startsWith('[법령제목]') || 
        line.trim().startsWith('[관리부처]')) {
      continue;
    }
    if (line.trim() === '' && skipMetadata) continue;
    skipMetadata = false;
    contentLines.push(line);
  }
  
  return contentLines.join('\n').trim();
};

const getAnswerPreview = (answer) => {
  if (!answer) return '';
  const plainText = answer.replace(/\*\*/g, '');
  return plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText;
};

// ===========================
// Custom Hooks
// ===========================
const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

const useHistory = () => {
  const [history, setHistory] = useLocalStorage('inseek_history', []);
  
  const addToHistory = (question, answer, sources) => {
    const newItem = {
      id: Date.now(),
      question,
      answer,
      sources,
      timestamp: new Date().toISOString(),
    };
    const newHistory = [newItem, ...history].slice(0, 50);
    setHistory(newHistory);
  };

  const deleteFromHistory = (index) => {
    setHistory(history.filter((_, i) => i !== index));
  };

  return { history, addToHistory, deleteFromHistory };
};

// ===========================
// Components
// ===========================
const FormattedText = ({ text }) => {
  const parts = parseMarkdown(text);
  return (
    <>
      {parts.map((part, index) => 
        part.type === 'bold' 
          ? <strong key={index} className="font-bold text-gray-900">{part.content}</strong>
          : <span key={index}>{part.content}</span>
      )}
    </>
  );
};

const Header = ({ isStreaming, onToggleStreaming, onToggleHistory, onToggleSources, hasHistory, hasSources }) => (
  <header className="bg-[#0c3470] text-white shadow-sm sticky top-0 z-20">
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight">INSEEK</h1>
            <p className="text-white/80 text-xs sm:text-sm mt-0.5 hidden sm:block">법령 기반 정확한 답변 제공</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleStreaming}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all ${
              isStreaming ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/20 text-white/70'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isStreaming ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
            <span className="hidden sm:inline text-sm font-medium">
              {isStreaming ? '스트리밍' : '일반'}
            </span>
          </button>

          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={onToggleHistory} className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {hasHistory && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
);

const HistoryItem = ({ item, isSelected, onSelect, onDelete }) => (
  <div className="relative group">
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-xl transition-all ${
        isSelected
          ? 'bg-[#e8eef5] border border-[#0c3470] shadow-sm'
          : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
      }`}
    >
      <p className="text-sm font-medium text-gray-800 mb-1.5 line-clamp-2 leading-snug pr-6">
        {item.question}
      </p>
      <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
        {getAnswerPreview(item.answer)}
      </p>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          {new Date(item.timestamp).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </button>
    
    <button
      onClick={onDelete}
      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-400 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const SourceItem = ({ source }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-[#0c3470] hover:shadow-sm transition-all">
    <div className="flex items-start justify-between gap-3 mb-3">
      <h3 className="text-sm font-semibold text-gray-800 flex-1 leading-snug">
        {source.law_title}
      </h3>
      <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-lg whitespace-nowrap ${
        source.similarity_score >= 0.8
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
          : source.similarity_score >= 0.6
          ? 'bg-gradient-to-r from-[#0c3470] to-[#164a8f]'
          : 'bg-gradient-to-r from-amber-500 to-amber-600'
      }`}>
        {(source.similarity_score * 100).toFixed(0)}%
      </span>
    </div>
    <div className="text-xs text-gray-600 mb-3 space-y-1.5 bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex items-center gap-2">
        <span>📍</span>
        <span className="font-medium">{source.city}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>🏛️</span>
        <span className="font-medium">{source.department}</span>
      </div>
    </div>
    <div className="text-xs text-gray-700 leading-relaxed bg-gradient-to-br from-gray-50 to-white p-3 rounded-lg border border-gray-100 max-h-40 overflow-y-auto">
      {extractLawContent(source.chunk_content)}
    </div>
  </div>
);

const QuestionForm = ({ question, onChange, onSubmit, loading, onExampleClick }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">질문을 입력하세요</h2>
    <div className="space-y-3 sm:space-y-4">
      <input
        type="text"
        value={question}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder="궁금한 내용을 입력하세요"
        className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c3470] transition-all"
        disabled={loading}
      />
      <button
        onClick={onSubmit}
        disabled={loading || !question.trim()}
        className="w-full bg-[#0c3470] hover:bg-[#164a8f] text-white font-semibold py-3 sm:py-4 rounded-xl transition-all disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2 shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>검색하기</span>
      </button>
    </div>
    
    <div className="mt-4 sm:mt-5">
      <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2">💡 질문 예시</div>
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUESTIONS.map((example, index) => (
          <button
            key={index}
            onClick={() => onExampleClick(example)}
            disabled={loading}
            className="px-3 sm:px-4 py-2 bg-white border border-gray-200 hover:border-[#0c3470] hover:bg-[#f0f4f9] rounded-full text-xs sm:text-sm text-gray-700 hover:text-[#0c3470] transition-all disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const AnswerDisplay = ({ loading, error, answer, isStreaming, sources }) => (
  <div className="space-y-4 sm:space-y-6">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">AI 답변</h3>
      
      {loading && !answer && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#e8eef5] border-t-[#0c3470] rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-gray-500">
            {isStreaming ? '실시간으로 답변 생성 중...' : '답변 생성 중...'}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-semibold text-red-800 text-sm">오류가 발생했습니다</p>
          <p className="text-xs mt-2 text-red-600">{error}</p>
        </div>
      )}

      {answer && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 sm:p-6 border border-gray-100">
            <div className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
              <FormattedText text={answer} />
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="w-8 h-8 border-3 border-[#e8eef5] border-t-[#0c3470] rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 font-medium">
                실시간으로 답변 생성 중...
              </p>
            </div>
          )}
        </div>
      )}

      {!loading && !answer && !error && (
        <div className="text-center py-16 text-sm text-gray-400">
          질문을 입력하고 검색 버튼을 눌러주세요
        </div>
      )}
    </div>

    {/* Mobile Sources Section */}
    {sources.length > 0 && (
      <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-[#0c3470]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-bold text-gray-800">출처</h3>
        </div>
        <p className="text-xs text-gray-600 mb-4">답변의 근거가 된 법령</p>
        <div className="space-y-3">
          {sources
            .sort((a, b) => b.similarity_score - a.similarity_score)
            .map((source, index) => (
              <SourceItem key={index} source={source} />
            ))}
        </div>
      </div>
    )}
  </div>
);

// ===========================
// Main App
// ===========================
function App() {
  const [question, setQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentSources, setCurrentSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isStreaming, setIsStreaming] = useLocalStorage('inseek_streaming', true);
  const { history, addToHistory, deleteFromHistory } = useHistory();

  const resetState = () => {
    setLoading(true);
    setError('');
    setCurrentAnswer('');
    setCurrentSources([]);
    setSelectedHistoryIndex(null);
    setShowHistory(false);
    setShowSources(false);
  };

  const handleStreamingResponse = async (questionText) => {
    resetState();

    try {
      const response = await fetch(`${API_URL}/api/ask/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullAnswer = '';
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.type === 'answer_chunk') {
                fullAnswer += parsed.data;
                setCurrentAnswer(fullAnswer);
              } else if (parsed.type === 'search_results') {
                sources = parsed.data;
                setCurrentSources(sources);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      if (fullAnswer) addToHistory(questionText, fullAnswer, sources);
      setQuestion('');
    } catch (err) {
      setError(`스트리밍 중 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNormalResponse = async (questionText) => {
    resetState();

    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      
      if (data.success) {
        setCurrentAnswer(data.answer);
        setCurrentSources(data.search_results || []);
        addToHistory(questionText, data.answer, data.search_results || []);
        setQuestion('');
      } else {
        setError(data.error_message || '오류가 발생했습니다.');
      }
    } catch (err) {
      setError(`서버 통신 오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!question.trim() || loading) return;
    const questionText = question.trim();
    isStreaming ? handleStreamingResponse(questionText) : handleNormalResponse(questionText);
  };

  const handleExampleClick = (example) => {
    setQuestion(example);
    isStreaming ? handleStreamingResponse(example) : handleNormalResponse(example);
  };

  const handleSelectHistory = (index) => {
    const item = history[index];
    setSelectedHistoryIndex(index);
    setCurrentAnswer(item.answer);
    setCurrentSources(item.sources);
    setQuestion(item.question);
    setError('');
    setShowHistory(false);
  };

  const handleDeleteHistory = (index, e) => {
    e.stopPropagation();
    deleteFromHistory(index);
    if (selectedHistoryIndex === index) {
      setSelectedHistoryIndex(null);
      setCurrentAnswer('');
      setCurrentSources([]);
      setQuestion('');
    } else if (selectedHistoryIndex !== null && selectedHistoryIndex > index) {
      setSelectedHistoryIndex(selectedHistoryIndex - 1);
    }
  };

  const handleNewQuestion = () => {
    setQuestion('');
    setCurrentAnswer('');
    setCurrentSources([]);
    setSelectedHistoryIndex(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming(!isStreaming)}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onToggleSources={() => setShowSources(!showSources)}
        hasHistory={history.length > 0}
        hasSources={currentSources.length > 0}
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Desktop History Panel */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-gray-200 flex-col shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            <button
              onClick={handleNewQuestion}
              className="w-full bg-[#0c3470] hover:bg-[#164a8f] text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>새 질문</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">검색 히스토리</h2>
            {history.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">
                아직 검색 기록이 없습니다
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item, index) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    isSelected={selectedHistoryIndex === index}
                    onSelect={() => handleSelectHistory(index)}
                    onDelete={(e) => handleDeleteHistory(index, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
            <QuestionForm
              question={question}
              onChange={setQuestion}
              onSubmit={handleSubmit}
              loading={loading}
              onExampleClick={handleExampleClick}
            />
            <AnswerDisplay
              loading={loading}
              error={error}
              answer={currentAnswer}
              isStreaming={isStreaming}
              sources={currentSources}
            />
          </div>
        </div>

        {/* Desktop Sources Panel */}
        <aside className="hidden lg:flex w-80 bg-white border-l border-gray-200 flex-col shadow-sm overflow-y-auto">
          <div className="p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-gray-800">출처</h2>
            <p className="text-xs text-gray-600">답변의 근거가 된 법령</p>
          </div>
          
          <div className="p-4">
            {currentSources.length === 0 ? (
              <div className="text-center py-16 text-sm text-gray-400">
                검색 결과가 없습니다
              </div>
            ) : (
              <div className="space-y-3">
                {currentSources
                  .sort((a, b) => b.similarity_score - a.similarity_score)
                  .map((source, index) => (
                    <SourceItem key={index} source={source} />
                  ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Mobile History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowHistory(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">검색 히스토리</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">
                  아직 검색 기록이 없습니다
                </div>
              ) : (
                history.map((item, index) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    isSelected={selectedHistoryIndex === index}
                    onSelect={() => handleSelectHistory(index)}
                    onDelete={(e) => handleDeleteHistory(index, e)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sources Drawer */}
      {showSources && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowSources(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">출처</h2>
              <button onClick={() => setShowSources(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentSources.length === 0 ? (
                <div className="text-center py-16 text-sm text-gray-400">
                  검색 결과가 없습니다
                </div>
              ) : (
                currentSources
                  .sort((a, b) => b.similarity_score - a.similarity_score)
                  .map((source, index) => (
                    <SourceItem key={index} source={source} />
                  ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Mobile Sources Drawer */}
      {showSources && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setShowSources(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">출처</h2>
              <button onClick={() => setShowSources(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentSources.length === 0 ? (
                <div className="text-center py-16 text-sm text-gray-400">
                  검색 결과가 없습니다
                </div>
              ) : (
                currentSources
                  .sort((a, b) => b.similarity_score - a.similarity_score)
                  .map((source, index) => (
                    <SourceItem key={index} source={source} />
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;