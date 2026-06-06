# @home/logger

## Purpose

Logging structuré pour tous les packages. Expose un port `LoggerPort` interchangeable. L'adapter par défaut utilise Pino et injecte automatiquement le contexte OTel (`traceId`, `spanId`) dans chaque entrée de log.

## Public API

```typescript
import { createPinoLogger, type LoggerPort } from '@home/logger';

const logger: LoggerPort = createPinoLogger({ level: 'info' });

logger.info('server started', { port: 3000 });
// → { level: 'info', msg: 'server started', port: 3000, traceId: '...', spanId: '...' }

const childLogger = logger.child({ requestId: 'abc-123' });
childLogger.info('request received');
// → { ..., requestId: 'abc-123', traceId: '...', spanId: '...' }
```

## Port

```typescript
interface LoggerPort {
  debug(msg: string, data?: object): void;
  info(msg: string, data?: object): void;
  warn(msg: string, data?: object): void;
  error(msg: string, err?: Error, data?: object): void;
  child(bindings: Record<string, unknown>): LoggerPort;
}
```

## Décisions clés

- `child()` obligatoire pour la corrélation par contexte (→ ADR-0003)
- `traceId`/`spanId` injectés automatiquement depuis le span OTel actif (→ ADR-0003)
- Dépend de `@opentelemetry/api` uniquement (API légère, pas le SDK)

## Dépendances

- `@home/config` — pour `LOG_LEVEL`
- `@opentelemetry/api` — lecture du contexte de trace actif
- `pino` — implémentation par défaut
