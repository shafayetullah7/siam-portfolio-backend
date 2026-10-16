import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  userName: varchar('user_name', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminLocalAuth = pgTable('admin_local_auth', {
  adminId: uuid('admin_id')
    .primaryKey()
    .references(() => admins.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  verified: boolean('verified').notNull().default(true),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: text('mfa_secret'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userAgent: text('user_agent'),
  ip: varchar('ip', { length: 64 }),
  revoked: boolean('revoked').notNull().default(false),
  logoutAt: timestamp('logout_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminSessions = pgTable('admin_sessions', {
  adminId: uuid('admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
});

export const pendingAdmins = pgTable('pending_admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  userName: varchar('user_name', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: text('password').notNull(),
  otpHash: text('otp_hash').notNull(),
  otpExpiresAt: timestamp('otp_expires_at', { withTimezone: true }).notNull(),
  otpAttempts: integer('otp_attempts').notNull().default(0),
  otpSentAt: timestamp('otp_sent_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id')
    .notNull()
    .references(() => admins.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
