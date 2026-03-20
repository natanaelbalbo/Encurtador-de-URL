import { Request, Response, NextFunction } from 'express';
import * as urlService from '../url/url.service';
import { AppError } from '../../middlewares/errorHandler';

export async function redirect(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.params.code as string;
    const result = await urlService.resolveUrl(code);

    if (!result) {
      throw new AppError(404, 'Short URL not found');
    }

    // Track click asynchronously — don't block the redirect
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;
    urlService.trackClick(code, ip, userAgent).catch((err) => {
      console.error('Failed to track click:', err.message);
    });

    res.redirect(302, result.originalUrl);
  } catch (err) {
    next(err);
  }
}
