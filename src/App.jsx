import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      return;
    }

    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnswer(data.answer);
      } else {
        setError(data.error_message || '응답을 처리하는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('서버와 통신하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="bg-primary-500 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">INSEEK</h1>
          <p className="text-primary-100 text-sm mt-1">법령 기반 정확한 답변을 제공합니다 | 대한민국 정부 공식 서비스</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Question Section */}
        <div className="bg-white rounded-lg shadow-md border-2 border-dashed border-primary-200 p-6 mb-6">
          <div className="flex items-start mb-4">
            <span className="text-2xl mr-3">📝</span>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                질문: "초본 신청서에 주민등록번호가 없으면 발급 가능한가?"
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="초본 신청서에 주민등록번호가 없으면 발급 가능한가?"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary-400 transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="bg-primary-400 hover:bg-primary-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <span>🔍</span>
                  <span>검색</span>
                </button>
              </form>
              <p className="text-sm text-gray-500 mt-3">
                💡 질문 예시: "초본 신청서에 주민등록번호가 없으면 발급 가능한가?", "가족관계증명서 발급 조건은?", "전입신고 기한은?"
              </p>
            </div>
          </div>
        </div>

        {/* Answer Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start mb-4">
            <div className="bg-primary-100 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-4">AI 답변</h3>
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="font-semibold">오류가 발생했습니다</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}

              {answer && !loading && (
                <div className="space-y-4">
                  <div className="flex items-start">
                    <span className="text-green-500 text-xl mr-2">✅</span>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      <FormattedText text={answer} />
                    </div>
                  </div>
                </div>
              )}

              {!loading && !answer && !error && (
                <div className="text-gray-400 text-center py-8">
                  질문을 입력하고 검색 버튼을 눌러주세요
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
