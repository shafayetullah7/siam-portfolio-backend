import type { PublishStatus } from '../../../common/publishing/publish-status';
import type { TalkRole, TalkType } from '../../../domain/talks/talks.types';

export type TalkAdminSummary = {
  id: string;
  slug: string;
  title: string;
  eventName: string;
  startsAt: string;
  timezone: string;
  publishStatus: PublishStatus;
  role: TalkRole;
  talkType: TalkType;
  updatedAt: string;
};
