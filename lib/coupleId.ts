import connectDB from './mongodb';
import User from './models/User';

// Always read coupleId fresh from DB — never trust stale JWT token.
// This means games and chat work even if the user set up their couple
// after logging in (before the token was refreshed).
export async function getSessionCoupleId(userId: string, tokenCoupleId?: string): Promise<string | null> {
  if (tokenCoupleId) return tokenCoupleId;
  try {
    await connectDB();
    const user = await User.findById(userId).select('coupleId');
    return user?.coupleId?.toString() ?? null;
  } catch {
    return null;
  }
}
