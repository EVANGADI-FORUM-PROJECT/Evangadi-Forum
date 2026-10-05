import { googleLoginService } from '../service/google.service.js';
export async function googleLoginController(req, res, next) {
  try {
    const result = await googleLoginService(req.body.credential);
    res.status(200).json({ success: true, message: 'Google sign-in successful.', ...result });
  } catch (error) { next(error); }
}
