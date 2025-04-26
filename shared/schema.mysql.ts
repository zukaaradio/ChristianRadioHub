import { 
  mysqlTable, 
  text, 
  serial, 
  int, 
  boolean, 
  timestamp, 
  mysqlEnum, 
  json
} from 'drizzle-orm/mysql-core';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("admin"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Stream schema
export const streams = mysqlTable("streams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  streamUrl: text("stream_url").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(false),
});

export const insertStreamSchema = createInsertSchema(streams).pick({
  title: true,
  streamUrl: true,
  description: true,
  isActive: true,
});

export type InsertStream = z.infer<typeof insertStreamSchema>;
export type Stream = typeof streams.$inferSelect;

// Show schema
export const shows = mysqlTable("shows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  host: text("host").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image"),
  isRecorded: boolean("is_recorded").notNull().default(false),
  audioFile: text("audio_file"),
  autoRotation: boolean("auto_rotation").notNull().default(false),
});

export const insertShowSchema = createInsertSchema(shows).pick({
  title: true,
  host: true,
  description: true,
  coverImage: true,
  isRecorded: true,
  audioFile: true,
  autoRotation: true,
});

export type InsertShow = z.infer<typeof insertShowSchema>;
export type Show = typeof shows.$inferSelect;

// Schedule schema
export const schedules = mysqlTable("schedules", {
  id: serial("id").primaryKey(),
  showId: int("show_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringDays: text("recurring_days"),
  status: text("status").notNull().default("scheduled"),
});

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  showId: true,
  startTime: true,
  endTime: true,
  isRecurring: true,
  recurringDays: true,
  status: true,
});

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;

// Listener statistic schema
export const listenerStats = mysqlTable("listener_stats", {
  id: serial("id").primaryKey(),
  showId: int("show_id"),
  streamId: int("stream_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  location: text("location"),
  device: text("device"),
  listenTime: int("listen_time").notNull(),
  ipAddress: text("ip_address"),
});

export const insertListenerStatSchema = createInsertSchema(listenerStats).pick({
  showId: true,
  streamId: true,
  timestamp: true,
  location: true,
  device: true,
  listenTime: true,
  ipAddress: true,
});

export type InsertListenerStat = z.infer<typeof insertListenerStatSchema>;
export type ListenerStat = typeof listenerStats.$inferSelect;

// Media uploads schema
export const mediaUploads = mysqlTable("media_uploads", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: int("file_size").notNull(),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  uploadedBy: int("uploaded_by").notNull(),
});

export const insertMediaUploadSchema = createInsertSchema(mediaUploads).pick({
  fileName: true,
  fileType: true,
  filePath: true,
  fileSize: true,
  uploadedBy: true,
});

export type InsertMediaUpload = z.infer<typeof insertMediaUploadSchema>;
export type MediaUpload = typeof mediaUploads.$inferSelect;

// Analytics schema (for summary data)
export const analytics = mysqlTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalListeners: int("total_listeners").notNull(),
  peakListeners: int("peak_listeners").notNull(),
  averageListenTime: int("average_listen_time").notNull(),
  topLocations: json("top_locations").notNull(),
  topDevices: json("top_devices").notNull(),
  topShows: json("top_shows").notNull(),
});

export const insertAnalyticSchema = createInsertSchema(analytics).pick({
  date: true,
  totalListeners: true,
  peakListeners: true,
  averageListenTime: true,
  topLocations: true,
  topDevices: true,
  topShows: true,
});

export type InsertAnalytic = z.infer<typeof insertAnalyticSchema>;
export type Analytic = typeof analytics.$inferSelect;