import jwt from 'jsonwebtoken';

export function issueSession(user) {
  const token = jwt.sign({
    id: user.user_id, firstName: user.first_name, lastName: user.last_name,
    type: 'session', version: Number(user.auth_version || 0),
  }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d', algorithm: 'HS256' });
  return {
    user: { id: user.user_id, firstName: user.first_name, lastName: user.last_name, email: user.email },
    token,
  };
}
