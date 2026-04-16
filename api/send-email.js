export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const params = req.body;

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'https://safety-ai-app-xi.vercel.app'
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
          업체명: params['업체명'] || '',
          작업일자: params['작업일자'] || '',
          작업장소: params['작업장소 및 설비명'] || '',
          위험요인: params['위험요인'] || '',
          안전대책: params['안전대책'] || '',
          제출시간: params['제출시간'] || '',
          name: params['업체명'] || '',
          email: 'noreply@safety.com'
        }
      })
    });

    const text = await response.text();
    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      res.status(500).json({ success: false, error: text });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
