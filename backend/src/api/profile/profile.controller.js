import { StatusCodes } from 'http-status-codes';
import { getProfileService, updateProfileService } from './profile.service.js';

export const getProfileController = async (req, res, next) => {
  try {
    res.status(StatusCodes.OK).json({ success: true, user: await getProfileService(req.user.id) });
  } catch (error) { next(error); }
};

export const updateProfileController = async (req, res, next) => {
  try {
    const user = await updateProfileService(req.user.id, req.body);
    res.status(StatusCodes.OK).json({ success: true, message: 'Profile updated successfully.', user });
  } catch (error) { next(error); }
};
