import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { tasksRouter } from './routes/tasks.js';
import { submissionsRouter } from './routes/submissions.js';
import { reputationRouter } from './routes/reputation.js';
import { storageRouter } from './routes/storage.js';
import { verificationRouter } from './routes/verification.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(createRateLimiter());

// Body parsing
app.use(express.json({ limit: '15mb' }));

// Routes
app.use('/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/submissions', submissionsRouter);
app.use('/api/v1/reputation', reputationRouter);
app.use('/api/v1/storage', storageRouter);
app.use('/api/v1/verification', verificationRouter);

// Error handling (must be last)
app.use(globalErrorHandler);

app.listen(config.port, () => {
  console.log(`BlindBounty backend listening on port ${config.port} (${config.nodeEnv})`);
});

export default app;
