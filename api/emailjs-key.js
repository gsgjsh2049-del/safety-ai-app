export default function handler(req, res) {
  res.status(200).json({
    publicKey: process.env.EMAILJS_PUBLIC_KEY
  });
}
