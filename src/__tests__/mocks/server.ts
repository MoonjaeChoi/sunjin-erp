// Generated: 2026-01-26 17:45:00 KST

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
