import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 앱 시작 시 API URL 로깅
console.log('=== INSEEK Frontend Configuration ===');
console.log('API_URL:', API_URL);
console.log('Environment:', import.meta.env.MODE);
console.log('All env vars:', import.meta.env);
console.log('=====================================');

// 마크다운 텍스트를 파싱하는 유틸리티 함수
const parseMarkdown = (text) => {
  if (!text) return [];
  
  const parts = [];
  let currentIndex = 0;
  
  // **텍스트** 패턴을 찾아서 파싱
  const boldPattern = /\*\*([^*]+)\*\*/g;
  let match;
  
  while ((match = boldPattern.exec(text)) !== null) {
    // ** 이전의 일반 텍스트 추가
    if (match.index > currentIndex) {
      parts.push({
        type: 'text',
        content: text.slice(currentIndex, match.index)
      });
    }
    
    // 볼드 텍스트 추가
    parts.push({
      type: 'bold',
      content: match[1]
    });
    
    currentIndex = match.index + match[0].length;
  }
  
  // 남은 텍스트 추가
  if (currentIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(currentIndex)
    });
  }
  
  return parts;
};

// 파싱된 텍스트를 렌더링하는 컴포넌트
const FormattedText = ({ text }) => {
  const parts = parseMarkdown(text);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'bold') {
          return <strong key={index} className="font-bold text-gray-900">{part.content}</strong>;
        }
        return <span key={index}>{part.content}</span>;
      })}
    </>
  );
};

// 법령 본문에서 메타데이터를 제거하는 함수
const extractLawContent = (chunkContent) => {
  if (!chunkContent) return '';
  
  // [지자체], [법령제목], [관리부처] 부분을 제거
  const lines = chunkContent.split('\n');
  const contentLines = [];
  let skipMetadata = true;
  
  for (const line of lines) {
    // 메타데이터 라인인지 확인
    if (line.trim().startsWith('[지자체]') || 
        line.trim().startsWith('[법령제목]') || 
        line.trim().startsWith('[관리부처]')) {
      continue;
    }
    
    // 빈 줄이면서 메타데이터 건너뛰기 모드면 계속 건너뛰기
    if (line.trim() === '' && skipMetadata) {
      continue;
    }
    
    // 실제 내용이 시작됨
    skipMetadata = false;
    contentLines.push(line);
  }
  
  return contentLines.join('\n').trim();
};

function App() {
  const [question, setQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentSources, setCurrentSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);

  // 질문 예시 목록
  const exampleQuestions = [
    '반려동물 관련 지원을 받을 수 있나요?',
    '평생교육 지원 대상자는?',
    '빅데이터 산업을 위해 추진하는 사업이 뭐가 있나요?',
  ];

  // localStorage에서 히스토리 불러오기
  useEffect(() => {
    const savedHistory = localStorage.getItem('inseek_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  // 히스토리 저장
  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem('inseek_history', JSON.stringify(newHistory));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setError('');
    setCurrentAnswer('');
    setCurrentSources([]);
    setSelectedHistoryIndex(null);

    const requestUrl = `${API_URL}/api/ask`;
    const requestBody = { question: question.trim() };

    console.log('=== API Request ===');
    console.log('URL:', requestUrl);
    console.log('Question:', requestBody.question);
    console.log('Timestamp:', new Date().toISOString());

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('=== API Response ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Response Body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}\nResponse: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response Data:', data);
      
      if (data.success) {
        setCurrentAnswer(data.answer);
        setCurrentSources(data.search_results || []);
        
        // 히스토리에 추가 (최대 50개 유지)
        const newHistoryItem = {
          id: Date.now(),
          question: question.trim(),
          answer: data.answer,
          sources: data.search_results || [],
          timestamp: new Date().toISOString(),
        };
        
        const newHistory = [newHistoryItem, ...history].slice(0, 50);
        saveHistory(newHistory);
        
        setQuestion('');
      } else {
        const errorMsg = data.error_message || '응답을 처리하는 중 오류가 발생했습니다.';
        console.error('API Error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('=== Request Failed ===');
      console.error('Error Type:', err.name);
      console.error('Error Message:', err.message);
      console.error('Error Stack:', err.stack);
      console.error('API URL:', requestUrl);
      
      let userMessage = '서버와 통신하는 중 오류가 발생했습니다.';
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        userMessage += '\n\n네트워크 연결을 확인해주세요.';
        console.error('Network error detected. Check if backend server is running and accessible.');
      } else if (err.message.includes('CORS')) {
        userMessage += '\n\nCORS 오류가 발생했습니다.';
        console.error('CORS error. Check backend CORS configuration.');
      } else if (err.message.includes('404')) {
        userMessage += '\n\nAPI 엔드포인트를 찾을 수 없습니다.';
        console.error('404 error. Check if the API endpoint exists.');
      } else if (err.message.includes('500')) {
        userMessage += '\n\n서버 내부 오류입니다.';
        console.error('500 error. Check backend server logs.');
      }
      
      userMessage += `\n\n상세 오류: ${err.message}`;
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuestion = () => {
    setQuestion('');
    setCurrentAnswer('');
    setCurrentSources([]);
    setSelectedHistoryIndex(null);
    setError('');
  };

  const handleSelectHistory = (index) => {
    const item = history[index];
    setSelectedHistoryIndex(index);
    setCurrentAnswer(item.answer);
    setCurrentSources(item.sources);
    setQuestion(item.question); // 히스토리의 질문을 입력창에 표시
    setError('');
  };

  const handleExampleClick = async (exampleQuestion) => {
    setQuestion(exampleQuestion);
    
    // 자동으로 검색 실행
    setLoading(true);
    setError('');
    setCurrentAnswer('');
    setCurrentSources([]);
    setSelectedHistoryIndex(null);

    const requestUrl = `${API_URL}/api/ask`;
    const requestBody = { question: exampleQuestion };

    console.log('=== API Request (Example) ===');
    console.log('URL:', requestUrl);
    console.log('Question:', requestBody.question);
    console.log('Timestamp:', new Date().toISOString());

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('=== API Response (Example) ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Response Body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}\nResponse: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response Data:', data);
      
      if (data.success) {
        setCurrentAnswer(data.answer);
        setCurrentSources(data.search_results || []);
        
        // 히스토리에 추가 (최대 50개 유지)
        const newHistoryItem = {
          id: Date.now(),
          question: exampleQuestion,
          answer: data.answer,
          sources: data.search_results || [],
          timestamp: new Date().toISOString(),
        };
        
        const newHistory = [newHistoryItem, ...history].slice(0, 50);
        saveHistory(newHistory);
        
        setQuestion('');
      } else {
        const errorMsg = data.error_message || '응답을 처리하는 중 오류가 발생했습니다.';
        console.error('API Error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('=== Request Failed (Example) ===');
      console.error('Error Type:', err.name);
      console.error('Error Message:', err.message);
      console.error('Error Stack:', err.stack);
      console.error('API URL:', requestUrl);
      
      let userMessage = '서버와 통신하는 중 오류가 발생했습니다.';
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        userMessage += '\n\n네트워크 연결을 확인해주세요.';
      } else if (err.message.includes('CORS')) {
        userMessage += '\n\nCORS 오류가 발생했습니다.';
      }
      
      userMessage += `\n\n상세 오류: ${err.message}`;
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAnswerPreview = (answer) => {
    if (!answer) return '';
    const plainText = answer.replace(/\*\*/g, '');
    return plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">⚖️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">INSEEK</h1>
              <p className="text-primary-100 text-sm mt-0.5">법령 기반 정확한 답변 제공</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - History */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            <button
              onClick={handleNewQuestion}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>새 질문</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-sm font-semibold text-gray-700">검색 히스토리</h2>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">
                    아직 검색 기록이 없습니다
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectHistory(index)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                        selectedHistoryIndex === index
                          ? 'bg-primary-50 border border-primary-200 shadow-sm'
                          : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-800 mb-1.5 line-clamp-2 leading-snug">
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center Panel - Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-8 py-8 max-w-4xl">
            {/* Question Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    질문을 입력하세요
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="궁금한 내용을 입력하세요"
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !question.trim()}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>검색하기</span>
                    </button>
                  </form>
                  
                  {/* 질문 예시 태그들 */}
                  <div className="mt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-500">💡</span>
                      <span className="text-sm font-medium text-gray-600">질문 예시</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {exampleQuestions.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => handleExampleClick(example)}
                          disabled={loading}
                          className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 hover:border-primary-400 hover:bg-primary-50 rounded-full text-sm text-gray-700 hover:text-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">AI 답변</h3>
                  
                  {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative mb-4">
                        <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm text-gray-500">답변을 생성하고 있습니다...</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                      <div className="flex gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="font-semibold text-red-800">오류가 발생했습니다</p>
                          <p className="text-sm mt-2 text-red-600 whitespace-pre-wrap">{error}</p>
                          <p className="text-xs mt-3 text-red-500">
                            💡 브라우저 콘솔(F12)에서 자세한 로그를 확인할 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentAnswer && !loading && (
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
                      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                        <FormattedText text={currentAnswer} />
                      </div>
                    </div>
                  )}

                  {!loading && !currentAnswer && !error && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">
                        질문을 입력하고 검색 버튼을 눌러주세요
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Sources */}
        <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white sticky top-0 z-10">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-lg font-bold text-gray-800">출처</h2>
            </div>
            <p className="text-xs text-gray-600">답변의 근거가 된 법령</p>
          </div>
          
          <div className="p-4">
            {currentSources.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400">
                  검색 결과가 없습니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentSources
                  .sort((a, b) => b.similarity_score - a.similarity_score)
                  .map((source, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-sm font-semibold text-gray-800 flex-1 leading-snug">
                        {source.law_title}
                      </h3>
                      <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-lg whitespace-nowrap shadow-sm ${
                        source.similarity_score >= 0.8
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : source.similarity_score >= 0.6
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                          : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                      }`}>
                        {(source.similarity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-3 space-y-1.5 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">📍</span>
                        <span className="font-medium">{source.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🏛️</span>
                        <span className="font-medium">{source.department}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-700 leading-relaxed bg-gradient-to-br from-gray-50 to-white p-3 rounded-lg border border-gray-100 max-h-40 overflow-y-auto">
                      {extractLawContent(source.chunk_content)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
