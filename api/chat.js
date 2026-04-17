import fs from 'fs';
import path from 'path';

function findRelevantSections(question, regulationText) {
  const sections = regulationText.split(/\[([^\]]+)\]/g).filter(s => s.trim());
  const keywords = question.replace(/[?？.]/g, '').split(/\s+/);
  
  const results = [];
  for (let i = 0; i < sections.length - 1; i += 2) {
    const title = sections[i].trim();
    const content = sections[i + 1]?.trim() || '';
    const score = keywords.filter(k => 
      title.includes(k) || content.includes(k)
    ).length;
    if (score > 0) results.push({ title, content, score });
  }
  
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  const lastQuestion = messages[messages.length - 1]?.content || '';

  let regulationResult = '';
  try {
    const regPath = path.join(process.cwd(), 'regulations.txt');
    const regText = fs.readFileSync(regPath, 'utf-8');
    const sections = findRelevantSections(lastQuestion, regText);
    
    if (sections.length > 0) {
      regulationResult = sections.map(r => `[${r.title}]\n${r.content}`).join('\n\n');
      return res.status(200).json({ 
        reply: `회사 안전보건규정에서 관련 내용을 찾았습니다.\n\n${regulationResult}\n\n산업안전보건법이나 KOSHA 가이드가 필요하시면 말씀해 주세요.`,
        fromRegulation: true
      });
    }
  } catch(e) {}

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `당신은 제일연마공업(주) 현장 안전 전문 AI 어시스턴트입니다.

회사 안전보건규정에서 관련 내용을 찾지 못한 경우에만 답변합니다.

답변 규칙:
- 산업안전보건법 및 시행규칙 조항 기준으로 답변
- 마크다운 기호(##, **, * 등) 사용 금지
- 일반 텍스트로 간결하게 답변
- 마지막에 "KOSHA 가이드가 필요하시면 안내해 드릴까요?" 한 줄 추가
- 항상 한국어로 답변`,
        messages: messages
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || '응답을 받지 못했습니다.';
    res.status(200).json({ reply, fromRegulation: false });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
