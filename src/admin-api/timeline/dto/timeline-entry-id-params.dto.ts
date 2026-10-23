import { z } from 'zod';

export const timelineEntryIdParamSchema = z.string().uuid();
