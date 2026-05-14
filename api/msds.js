export default async function handler(req, res) {
  const { path, download } = req.query;

  if (!path) return res.status(400).json({ error: 'path 파라미터가 필요합니다.' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GitHub 토큰이 설정되지 않았습니다.' });

  try {
    const encoded = path.split('/').map(encodeURIComponent).join('/');

    // ✅ 다운로드 모드: 파일 바이너리를 직접 전달
    if (download === 'true') {
      const rawUrl = `https://raw.githubusercontent.com/gsgjsh2049-del/safety-ai-app/main/${encoded}`;
      const fileRes = await fetch(rawUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const fileName = path.split('/').pop();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
      const buffer = await fileRes.arrayBuffer();
      res.send(Buffer.from(buffer));
      return;
    }

    // 기존: 폴더 목록 조회
    const apiUrl = `https://api.github.com/repos/gsgjsh2049-del/safety-ai-app/contents/${encoded}?ref=main`;
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
