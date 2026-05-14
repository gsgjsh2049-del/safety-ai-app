export default async function handler(req, res) {
  const { path, preview, download } = req.query;

  if (!path) return res.status(400).json({ error: 'path 파라미터가 필요합니다.' });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'GitHub 토큰이 설정되지 않았습니다.' });

  try {
    const encoded = path.split('/').map(encodeURIComponent).join('/');

    if (preview === 'true' || download === 'true') {
      const rawUrl = `https://raw.githubusercontent.com/gsgjsh2049-del/safety-ai-app/main/${encoded}`;
      const fileRes = await fetch(rawUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!fileRes.ok) {
        return res.status(fileRes.status).json({ error: '파일을 가져올 수 없습니다.' });
      }

      const fileName = path.split('/').pop();
      res.setHeader('Content-Type', 'application/pdf');

      if (download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
      }

      const buffer = await fileRes.arrayBuffer();
      return res.send(Buffer.from(buffer));
    }

    const apiUrl = `https://api.github.com/repos/gsgjsh2049-del/safety-ai-app/contents/${encoded}?ref=main`;
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
