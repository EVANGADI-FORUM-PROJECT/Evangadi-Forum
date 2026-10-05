import { forgotPasswordService, resetPasswordService, RECOVERY_MESSAGE } from '../service/recovery.service.js';

export async function forgotPasswordController(req, res, next) {
  try {
    await forgotPasswordService(req.body.email);
    res.status(200).json({ success: true, message: RECOVERY_MESSAGE });
  } catch (error) { next(error); }
}
export async function resetPasswordController(req, res, next) {
  try {
    await resetPasswordService(req.body);
    res.status(200).json({ success: true, message: 'Password updated. Please sign in with your new password.' });
  } catch (error) { next(error); }
}
