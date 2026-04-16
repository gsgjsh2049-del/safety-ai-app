export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

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

현장 안전관리자와 작업자의 질문에 법적 근거를 바탕으로 정확하고 실용적으로 답변합니다.

답변 기준:
1. 산업안전보건법 및 시행규칙·시행령
2. KOSHA 가이드 및 기술지침
3. 관련 고시·공고

답변 형식:
① 핵심 기준 요약
② 관련 법령 조항 명시 (예: 산업안전보건법 제○조, 안전보건규칙 제○조)
③ KOSHA 가이드 내용 (있을 경우)
④ 실무 주의사항

항상 한국어로 답변하고 현장에서 바로 활용할 수 있도록 구체적으로 설명하세요.`,
        messages: messages
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || '응답을 받지 못했습니다.';
    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
