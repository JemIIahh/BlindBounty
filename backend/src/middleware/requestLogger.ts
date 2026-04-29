import type { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? 31 : status >= 400 ? 33 : status >= 300 ? 36 : 32;
    console.log(`\x1b[${color}m${status}\x1b[0m ${method} ${url} \x1b[2m${ms}ms\x1b[0m`);
  });

  next();
}
