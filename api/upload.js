import { google } from 'googleapis';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const drive = google.drive({ version: 'v3', auth });

    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const boundary = req.headers['content-type'].split('boundary=')[1];
    const parts = buffer.toString().split('--' + boundary);
    
    let fileName = 'upload.pdf';
    let fileContent = null;

    for (const part of parts) {
      if (part.includes('filename=')) {
        const nameMatch = part.match(/filename="([^"]+)"/);
        if (nameMatch) fileName = nameMatch[1];
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        fileContent = buffer.slice(
          buffer.indexOf(part.slice(dataStart, dataStart + 20)),
          buffer.indexOf(part.slice(dataStart, dataStart + 20)) + (dataEnd - dataStart)
        );
      }
    }

    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    };

    const media = {
      mimeType: 'application/pdf',
      body: Readable.from(fileContent || buffer)
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    res.status(200).json({
      success: true,
      fileId: file.data.id,
      fileName: file.data.name,
      link: file.data.webViewLink
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
