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

답변 규칙:
1. 산업안전보건법 조항을 먼저 확인해서 답변합니다
2. 산업안전보건기준에 관한 규칙 조항을 추가로 안내합니다
3. 구체적인 수치·치수 기준은 정확하게 명시합니다
4. KOSHA 가이드는 본문에 포함하지 말고 마지막에 "KOSHA 가이드가 필요하시면 안내해 드릴까요?" 한 줄만 추가합니다
5. 마크다운 기호(##, **, ① 등)는 사용하지 말고 일반 텍스트로 답변합니다
6. 답변은 간결하고 현장에서 바로 활용할 수 있도록 작성합니다
7. 항상 한국어로 답변합니다

답변 형식:
[법령 기준]
산업안전보건법 제○조: 내용
산업안전보건기준에 관한 규칙 제○조: 내용 (구체적인 수치 포함)

KOSHA 가이드가 필요하시면 안내해 드릴까요?`,
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
