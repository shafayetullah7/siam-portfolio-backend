export type PublishChecklistItem = {
  code: string;
  message: string;
};

export type PublishChecklistResult = {
  errors: PublishChecklistItem[];
  warnings: PublishChecklistItem[];
};

export type PublishSingletonOptions = {
  confirmWarnings?: boolean;
};
