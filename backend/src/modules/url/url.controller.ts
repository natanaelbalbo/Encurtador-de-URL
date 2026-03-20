import { Request, Response, NextFunction } from 'express';
import * as urlService from './url.service';
import { listUrlsQuerySchema } from './url.schema';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const url = await urlService.createUrl(req.body, req.user!.sub);
    res.status(201).json(url);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listUrlsQuerySchema.parse(req.query);
    const result = await urlService.listUrls(req.user!.sub, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await urlService.deleteUrl(req.params.id as string, req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
