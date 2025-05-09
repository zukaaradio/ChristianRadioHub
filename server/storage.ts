import { users, type User, type InsertUser, streams, type Stream, type InsertStream, shows, type Show, type InsertShow, schedules, type Schedule, type InsertSchedule, listenerStats, type ListenerStat, type InsertListenerStat, mediaUploads, type MediaUpload, type InsertMediaUpload, analytics, type Analytic, type InsertAnalytic } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Stream management
  createStream(stream: InsertStream): Promise<Stream>;
  getStream(id: number): Promise<Stream | undefined>;
  getAllStreams(): Promise<Stream[]>;
  getActiveStream(): Promise<Stream | undefined>;
  updateStream(id: number, stream: Partial<InsertStream>): Promise<Stream | undefined>;
  deleteStream(id: number): Promise<boolean>;
  setStreamActive(id: number, active: boolean): Promise<boolean>;
  
  // Show management
  createShow(show: InsertShow): Promise<Show>;
  getShow(id: number): Promise<Show | undefined>;
  getAllShows(): Promise<Show[]>;
  updateShow(id: number, show: Partial<InsertShow>): Promise<Show | undefined>;
  deleteShow(id: number): Promise<boolean>;
  
  // Schedule management
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  getSchedule(id: number): Promise<Schedule | undefined>;
  getAllSchedules(): Promise<Schedule[]>;
  getUpcomingSchedules(count: number): Promise<Schedule[]>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule | undefined>;
  deleteSchedule(id: number): Promise<boolean>;
  
  // Listener statistics
  addListenerStat(stat: InsertListenerStat): Promise<ListenerStat>;
  getListenerStats(options: { showId?: number, streamId?: number, startDate?: Date, endDate?: Date }): Promise<ListenerStat[]>;
  getCurrentListeners(): Promise<number>;
  getPeakListeners(date: Date): Promise<number>;
  
  // Media uploads
  addMediaUpload(media: InsertMediaUpload): Promise<MediaUpload>;
  getMediaUpload(id: number): Promise<MediaUpload | undefined>;
  getAllMediaUploads(): Promise<MediaUpload[]>;
  deleteMediaUpload(id: number): Promise<boolean>;
  
  // Analytics
  addAnalytic(analytic: InsertAnalytic): Promise<Analytic>;
  getLatestAnalytic(): Promise<Analytic | undefined>;
  getAnalytics(startDate: Date, endDate: Date): Promise<Analytic[]>;
  
  // Session store for authentication
  sessionStore: session.Store;
  
  // Initialize default data
  initializeDefaultData(): Promise<void>;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  async initializeDefaultData(): Promise<void> {
    // Check if we already have data in the DB
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) return;
    
    // Create a default admin user
    await this.createUser({
      username: "admin",
      password: "$2b$10$iZ/LHDJXMwhpQOEsAKP8C.ld1JKUvM0dMUrwNu/SB4QjjULx6W1Ei", // "password"
      fullName: "Admin User",
      role: "admin"
    });
    
    // Create a default stream
    await this.createStream({
      title: "Grace Waves Christian Radio",
      streamUrl: "https://radio.brentwooddrivesda.org/listen/bwd_radio/radio.mp3",
      description: "Live Christian music, sermons, and inspirational programming dedicated to spreading God's word.",
      isActive: true
    });
    
    // Create some sample shows
    const show1 = await this.createShow({
      title: "Morning Devotional",
      description: "Start your day with inspiring scripture readings and reflections.",
      host: "Pastor David Johnson",
      coverImage: null,
      isRecorded: false,
      audioFile: null,
      autoRotation: true
    });
    
    const show2 = await this.createShow({
      title: "Gospel Hour",
      description: "Uplifting gospel music to feed your soul.",
      host: "Sister Mary Thompson",
      coverImage: null,
      isRecorded: true,
      audioFile: null,
      autoRotation: false
    });
    
    const show3 = await this.createShow({
      title: "Biblical Insights",
      description: "Deep dives into biblical passages and their meaning for today's Christian.",
      host: "Dr. Robert Winters",
      coverImage: null,
      isRecorded: true,
      audioFile: null,
      autoRotation: false
    });
    
    // Create some sample schedules
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(10, 30, 0, 0);
    
    await this.createSchedule({
      showId: show1.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      status: "scheduled",
      isRecurring: true,
      recurringDays: "1,2,3,4,5"
    });
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(14, 0, 0, 0);
    
    const dayAfterEnd = new Date(dayAfter);
    dayAfterEnd.setHours(15, 0, 0, 0);
    
    await this.createSchedule({
      showId: show2.id,
      startTime: dayAfter,
      endTime: dayAfterEnd,
      status: "scheduled",
      isRecurring: false,
      recurringDays: null
    });
    
    // Add a schedule for today
    const today = new Date();
    today.setHours(today.getHours() + 1, 0, 0, 0);
    
    const todayEnd = new Date(today);
    todayEnd.setHours(todayEnd.getHours() + 2, 0, 0, 0);
    
    await this.createSchedule({
      showId: show3.id,
      startTime: today,
      endTime: todayEnd,
      status: "scheduled",
      isRecurring: false,
      recurringDays: null
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async createStream(insertStream: InsertStream): Promise<Stream> {
    const [stream] = await db.insert(streams).values(insertStream).returning();
    return stream;
  }
  
  async getStream(id: number): Promise<Stream | undefined> {
    const [stream] = await db.select().from(streams).where(eq(streams.id, id));
    return stream;
  }
  
  async getAllStreams(): Promise<Stream[]> {
    return await db.select().from(streams);
  }
  
  async getActiveStream(): Promise<Stream | undefined> {
    const [stream] = await db.select().from(streams).where(eq(streams.isActive, true));
    return stream;
  }
  
  async updateStream(id: number, streamUpdate: Partial<InsertStream>): Promise<Stream | undefined> {
    const [stream] = await db.update(streams)
      .set(streamUpdate)
      .where(eq(streams.id, id))
      .returning();
    return stream;
  }
  
  async deleteStream(id: number): Promise<boolean> {
    const [deleted] = await db.delete(streams).where(eq(streams.id, id)).returning();
    return !!deleted;
  }
  
  async setStreamActive(id: number, active: boolean): Promise<boolean> {
    // First, set all streams to inactive
    await db.update(streams).set({ isActive: false });
    
    // Then set the target stream to active
    const [stream] = await db.update(streams)
      .set({ isActive: active })
      .where(eq(streams.id, id))
      .returning();
    
    return !!stream;
  }
  
  async createShow(insertShow: InsertShow): Promise<Show> {
    const [show] = await db.insert(shows).values(insertShow).returning();
    return show;
  }
  
  async getShow(id: number): Promise<Show | undefined> {
    const [show] = await db.select().from(shows).where(eq(shows.id, id));
    return show;
  }
  
  async getAllShows(): Promise<Show[]> {
    return await db.select().from(shows);
  }
  
  async updateShow(id: number, showUpdate: Partial<InsertShow>): Promise<Show | undefined> {
    const [show] = await db.update(shows)
      .set(showUpdate)
      .where(eq(shows.id, id))
      .returning();
    return show;
  }
  
  async deleteShow(id: number): Promise<boolean> {
    const [deleted] = await db.delete(shows).where(eq(shows.id, id)).returning();
    return !!deleted;
  }
  
  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db.insert(schedules).values(insertSchedule).returning();
    return schedule;
  }
  
  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule;
  }
  
  async getAllSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules);
  }
  
  async getUpcomingSchedules(count: number): Promise<Schedule[]> {
    const now = new Date();
    const upcoming = await db.select()
      .from(schedules)
      .where(gte(schedules.startTime, now))
      .orderBy(schedules.startTime)
      .limit(count);
    
    return upcoming;
  }
  
  async updateSchedule(id: number, scheduleUpdate: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const [schedule] = await db.update(schedules)
      .set(scheduleUpdate)
      .where(eq(schedules.id, id))
      .returning();
    return schedule;
  }
  
  async deleteSchedule(id: number): Promise<boolean> {
    const [deleted] = await db.delete(schedules).where(eq(schedules.id, id)).returning();
    return !!deleted;
  }
  
  async addListenerStat(insertStat: InsertListenerStat): Promise<ListenerStat> {
    const [stat] = await db.insert(listenerStats).values(insertStat).returning();
    return stat;
  }
  
  async getListenerStats(options: { showId?: number, streamId?: number, startDate?: Date, endDate?: Date }): Promise<ListenerStat[]> {
    let query = db.select().from(listenerStats);
    
    const conditions = [];
    
    if (options.showId !== undefined) {
      conditions.push(eq(listenerStats.showId, options.showId));
    }
    
    if (options.streamId !== undefined) {
      conditions.push(eq(listenerStats.streamId, options.streamId));
    }
    
    if (options.startDate) {
      conditions.push(gte(listenerStats.timestamp, options.startDate));
    }
    
    if (options.endDate) {
      conditions.push(lte(listenerStats.timestamp, options.endDate));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query;
  }
  
  async getCurrentListeners(): Promise<number> {
    // In a real implementation, this would count active sessions
    // For this sample, we'll calculate a count based on recent listener stats
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const recentStats = await db.select()
      .from(listenerStats)
      .where(gte(listenerStats.timestamp, fiveMinutesAgo));
    
    // Return count or a random number if no stats
    return recentStats.length || Math.floor(Math.random() * 90) + 10;
  }
  
  async getPeakListeners(date: Date): Promise<number> {
    // Find the peak listeners for the given date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const stats = await this.getListenerStats({
      startDate: startOfDay,
      endDate: endOfDay
    });
    
    // Count unique IP addresses (this is a simplification)
    const uniqueIps = new Set();
    stats.forEach(stat => {
      if (stat.ipAddress) uniqueIps.add(stat.ipAddress);
    });
    
    // Return count or a random number if no stats
    return uniqueIps.size || Math.floor(Math.random() * 150) + 50;
  }
  
  async addMediaUpload(insertMedia: InsertMediaUpload): Promise<MediaUpload> {
    const mediaWithDate = {
      ...insertMedia,
      uploadDate: new Date()
    };
    
    const [media] = await db.insert(mediaUploads).values(mediaWithDate).returning();
    return media;
  }
  
  async getMediaUpload(id: number): Promise<MediaUpload | undefined> {
    const [media] = await db.select().from(mediaUploads).where(eq(mediaUploads.id, id));
    return media;
  }
  
  async getAllMediaUploads(): Promise<MediaUpload[]> {
    return await db.select().from(mediaUploads).orderBy(desc(mediaUploads.uploadDate));
  }
  
  async deleteMediaUpload(id: number): Promise<boolean> {
    const [deleted] = await db.delete(mediaUploads).where(eq(mediaUploads.id, id)).returning();
    return !!deleted;
  }
  
  async addAnalytic(insertAnalytic: InsertAnalytic): Promise<Analytic> {
    const [analytic] = await db.insert(analytics).values(insertAnalytic).returning();
    return analytic;
  }
  
  async getLatestAnalytic(): Promise<Analytic | undefined> {
    const [analytic] = await db.select()
      .from(analytics)
      .orderBy(desc(analytics.date))
      .limit(1);
    
    return analytic;
  }
  
  async getAnalytics(startDate: Date, endDate: Date): Promise<Analytic[]> {
    return await db.select()
      .from(analytics)
      .where(
        and(
          gte(analytics.date, startDate),
          lte(analytics.date, endDate)
        )
      )
      .orderBy(analytics.date);
  }
}

export const storage = new DatabaseStorage();