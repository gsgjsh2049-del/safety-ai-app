import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  let pdfText = '';
  try {
    const pdfPath = path.join(process.cwd(), 'safety-manual.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64PDF = pdfBuffer.toString('base64');

    const pdfResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64PDF
              }
            },
            {
              type: 'text',
              text: '이 PDF의 전체 내용을 텍스트로 추출해주세요.'
            }
          ]
        }]
      })
    });

    const pdfData = await pdfResponse.json();
    pdfText = pdfData.content?.[0]?.text || '';
  } catch(e) {
    pdfText = '';
  }

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
        system: `당신은 대한민국 산업현장 안전 전문 AI 어시스턴트입니다.

아래는 회사 안전보호구 매뉴얼 내용입니다. 보호구 관련 질문은 이 매뉴얼을 우선 참조하세요.

[회사 안전보호구 매뉴얼]
${pdfText}

답변 규칙:
1. 보호구 관련 질문은 위 매뉴얼을 먼저 참조해서 답변합니다
2. 법령 기준은 산업안전보건법, 산업안전보건기준에 관한 규칙 순으로 안내합니다
3. 마크다운 기호(##, **, ① 등)는 사용하지 말고 일반 텍스트로 답변합니다
4. 보호구 규정 원본이 필요하면 "원본 매뉴얼 보기" 버튼을 안내합니다
5. KOSHA 가이드는 마지막에 "KOSHA 가이드가 필요하시면 안내해 드릴까요?" 한 줄만 추가합니다
6. 항상 한국어로 답변합니다`,
        messages: messages
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || '응답을 받지 못했습니다.';
    res.status(200).json({ reply, hasPDF: true });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
