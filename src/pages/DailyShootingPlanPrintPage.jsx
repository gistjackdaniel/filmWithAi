import React, { useEffect, useState } from 'react';

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'Malgun Gothic, Arial, sans-serif',
  fontSize: '13px',
  background: '#fff',
  color: '#222',
};
const thStyle = {
  border: '1.5px solid #222',
  background: '#eaeaea',
  fontWeight: 'bold',
  padding: '4px 6px',
  textAlign: 'center',
};
const tdStyle = {
  border: '1px solid #888',
  padding: '4px 6px',
  textAlign: 'left',
  verticalAlign: 'top',
};
const sectionTitleStyle = {
  background: '#d0d0d0',
  fontWeight: 'bold',
  fontSize: '15px',
  textAlign: 'center',
  border: '1.5px solid #222',
  padding: '6px',
};

function parsePlanToTableRows(planText) {
  // 단순 마크다운/텍스트 표 파싱 (|로 구분된 행만 추출)
  const lines = planText.split('\n').filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
  if (lines.length < 2) return null;
  const header = lines[0].split('|').slice(1, -1).map(cell => cell.trim());
  const rows = lines.slice(1).map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
  return { header, rows };
}

const DailyShootingPlanPrintPage = () => {
  const [plan, setPlan] = useState('');
  const [tableBlocks, setTableBlocks] = useState([]);

  useEffect(() => {
    // 1. localStorage에서 shootingPlanResult 읽기
    const planText = localStorage.getItem('shootingPlanResult') || '';
    setPlan(planText);
    // 2. 자동 인쇄
    setTimeout(() => window.print(), 500);
  }, []);

  useEffect(() => {
    if (!plan) return;
    // 여러 표가 있을 수 있으니, 마크다운 표 블록별로 분리
    const blocks = plan.split(/\n## [^\n]+/g)
      .map(block => parsePlanToTableRows(block))
      .filter(Boolean);
    setTableBlocks(blocks);
  }, [plan]);

  return (
    <div style={{ padding: 24, background: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 16 }}>영화 일일촬영계획표</h2>
      {!plan && <div style={{ color: '#888', textAlign: 'center' }}>일일촬영계획표 데이터가 없습니다.</div>}
      {tableBlocks.length > 0 ? (
        tableBlocks.map((block, idx) => (
          <table key={idx} style={{ ...tableStyle, marginBottom: 32 }}>
            <thead>
              <tr>
                {block.header.map((cell, i) => (
                  <th key={i} style={thStyle}>{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={tdStyle}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ))
      ) : plan && (
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#444' }}>{plan}</div>
      )}
    </div>
  );
};

export default DailyShootingPlanPrintPage; 