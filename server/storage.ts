import { users, type User, type InsertUser, streams, type Stream, type InsertStream, shows, type Show, type InsertShow, schedules, type Schedule, type InsertSchedule, listenerStats, type ListenerStat, type InsertListenerStat, mediaUploads, type MediaUpload, type InsertMediaUpload, analytics, type Analytic, type InsertAnalytic } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private streams: Map<number, Stream>;
  private shows: Map<number, Show>;
  private schedules: Map<number, Schedule>;
  private listenerStats: ListenerStat[];
  private mediaUploads: Map<number, MediaUpload>;
  private analyticsData: Map<number, Analytic>;
  private currentId: { [key: string]: number };
  public sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.streams = new Map();
    this.shows = new Map();
    this.schedules = new Map();
    this.listenerStats = [];
    this.mediaUploads = new Map();
    this.analyticsData = new Map();
    this.currentId = {
      users: 1,
      streams: 1,
      shows: 1,
      schedules: 1,
      listenerStats: 1,
      mediaUploads: 1,
      analytics: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Add some initial data
    this._initializeData();
  }

  private _initializeData() {
    // Example to initialize some data for development
    // This would be removed in a production environment with real DB
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Stream methods
  async createStream(insertStream: InsertStream): Promise<Stream> {
    const id = this.currentId.streams++;
    const stream: Stream = { ...insertStream, id };
    
    // If this stream is set to active, deactivate all other streams
    if (stream.isActive) {
      for (const [streamId, existingStream] of this.streams.entries()) {
        if (existingStream.isActive) {
          this.streams.set(streamId, { ...existingStream, isActive: false });
        }
      }
    }
    
    this.streams.set(id, stream);
    return stream;
  }
  
  async getStream(id: number): Promise<Stream | undefined> {
    return this.streams.get(id);
  }
  
  async getAllStreams(): Promise<Stream[]> {
    return Array.from(this.streams.values());
  }
  
  async getActiveStream(): Promise<Stream | undefined> {
    return Array.from(this.streams.values()).find(stream => stream.isActive);
  }
  
  async updateStream(id: number, streamUpdate: Partial<InsertStream>): Promise<Stream | undefined> {
    const existingStream = this.streams.get(id);
    if (!existingStream) return undefined;
    
    // If setting this stream to active, deactivate all other streams
    if (streamUpdate.isActive) {
      for (const [streamId, stream] of this.streams.entries()) {
        if (stream.isActive && streamId !== id) {
          this.streams.set(streamId, { ...stream, isActive: false });
        }
      }
    }
    
    const updatedStream = { ...existingStream, ...streamUpdate };
    this.streams.set(id, updatedStream);
    return updatedStream;
  }
  
  async deleteStream(id: number): Promise<boolean> {
    return this.streams.delete(id);
  }
  
  async setStreamActive(id: number, active: boolean): Promise<boolean> {
    const stream = this.streams.get(id);
    if (!stream) return false;
    
    // If activating this stream, deactivate all others
    if (active) {
      for (const [streamId, existingStream] of this.streams.entries()) {
        if (existingStream.isActive && streamId !== id) {
          this.streams.set(streamId, { ...existingStream, isActive: false });
        }
      }
    }
    
    this.streams.set(id, { ...stream, isActive: active });
    return true;
  }
  
  // Show methods
  async createShow(insertShow: InsertShow): Promise<Show> {
    const id = this.currentId.shows++;
    const show: Show = { ...insertShow, id };
    this.shows.set(id, show);
    return show;
  }
  
  async getShow(id: number): Promise<Show | undefined> {
    return this.shows.get(id);
  }
  
  async getAllShows(): Promise<Show[]> {
    return Array.from(this.shows.values());
  }
  
  async updateShow(id: number, showUpdate: Partial<InsertShow>): Promise<Show | undefined> {
    const existingShow = this.shows.get(id);
    if (!existingShow) return undefined;
    
    const updatedShow = { ...existingShow, ...showUpdate };
    this.shows.set(id, updatedShow);
    return updatedShow;
  }
  
  async deleteShow(id: number): Promise<boolean> {
    // Also delete any schedules for this show
    for (const [scheduleId, schedule] of this.schedules.entries()) {
      if (schedule.showId === id) {
        this.schedules.delete(scheduleId);
      }
    }
    
    return this.shows.delete(id);
  }
  
  // Schedule methods
  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentId.schedules++;
    const schedule: Schedule = { ...insertSchedule, id };
    this.schedules.set(id, schedule);
    return schedule;
  }
  
  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }
  
  async getAllSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
  }
  
  async getUpcomingSchedules(count: number): Promise<Schedule[]> {
    const now = new Date();
    return Array.from(this.schedules.values())
      .filter(schedule => new Date(schedule.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, count);
  }
  
  async updateSchedule(id: number, scheduleUpdate: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const existingSchedule = this.schedules.get(id);
    if (!existingSchedule) return undefined;
    
    const updatedSchedule = { ...existingSchedule, ...scheduleUpdate };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  async deleteSchedule(id: number): Promise<boolean> {
    return this.schedules.delete(id);
  }
  
  // Listener statistics methods
  async addListenerStat(insertStat: InsertListenerStat): Promise<ListenerStat> {
    const id = this.currentId.listenerStats++;
    const stat: ListenerStat = { ...insertStat, id };
    this.listenerStats.push(stat);
    return stat;
  }
  
  async getListenerStats(options: { showId?: number, streamId?: number, startDate?: Date, endDate?: Date }): Promise<ListenerStat[]> {
    let stats = this.listenerStats;
    
    if (options.showId !== undefined) {
      stats = stats.filter(stat => stat.showId === options.showId);
    }
    
    if (options.streamId !== undefined) {
      stats = stats.filter(stat => stat.streamId === options.streamId);
    }
    
    if (options.startDate) {
      stats = stats.filter(stat => new Date(stat.timestamp) >= options.startDate!);
    }
    
    if (options.endDate) {
      stats = stats.filter(stat => new Date(stat.timestamp) <= options.endDate!);
    }
    
    return stats;
  }
  
  async getCurrentListeners(): Promise<number> {
    // For simplicity, return a random number between 50-200
    return Math.floor(Math.random() * 150) + 50;
  }
  
  async getPeakListeners(date: Date): Promise<number> {
    // For simplicity, return a random number between 150-300
    return Math.floor(Math.random() * 150) + 150;
  }
  
  // Media uploads methods
  async addMediaUpload(insertMedia: InsertMediaUpload): Promise<MediaUpload> {
    const id = this.currentId.mediaUploads++;
    const media: MediaUpload = { ...insertMedia, id, uploadDate: new Date() };
    this.mediaUploads.set(id, media);
    return media;
  }
  
  async getMediaUpload(id: number): Promise<MediaUpload | undefined> {
    return this.mediaUploads.get(id);
  }
  
  async getAllMediaUploads(): Promise<MediaUpload[]> {
    return Array.from(this.mediaUploads.values());
  }
  
  async deleteMediaUpload(id: number): Promise<boolean> {
    return this.mediaUploads.delete(id);
  }
  
  // Analytics methods
  async addAnalytic(insertAnalytic: InsertAnalytic): Promise<Analytic> {
    const id = this.currentId.analytics++;
    const analytic: Analytic = { ...insertAnalytic, id };
    this.analyticsData.set(id, analytic);
    return analytic;
  }
  
  async getLatestAnalytic(): Promise<Analytic | undefined> {
    const analytics = Array.from(this.analyticsData.values());
    if (analytics.length === 0) return undefined;
    
    return analytics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }
  
  async getAnalytics(startDate: Date, endDate: Date): Promise<Analytic[]> {
    return Array.from(this.analyticsData.values())
      .filter(analytic => {
        const date = new Date(analytic.date);
        return date >= startDate && date <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

export const storage = new MemStorage();
