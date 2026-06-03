import { AuditLog } from '../models/AuditLog.js';

export function audit(action, resource) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      AuditLog.create({
        userId: req.user?._id,
        action,
        resource,
        resourceId: req.params.id || body?.data?._id?.toString(),
        ip: req.ip,
        userAgent: req.get('user-agent'),
        details: { method: req.method, path: req.path, statusCode: res.statusCode },
        severity: res.statusCode >= 400 ? 'warning' : 'info',
      }).catch(() => {});
      return originalJson(body);
    };
    next();
  };
}
