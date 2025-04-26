import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertStreamSchema, insertShowSchema, insertScheduleSchema, insertMediaUploadSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { promises as fsPromises } from 'fs';

// Set up multer storage for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|mp3|wav|mp4/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Set up public routes before authentication middleware
  // Public API (doesn't require authentication)
  app.get("/api/public/current-stream", async (req, res) => {
    try {
      const stream = await storage.getActiveStream();
      if (!stream) {
        return res.status(404).json({ message: "No active stream found" });
      }
      
      // Get current show information if available
      const now = new Date();
      const schedules = await storage.getAllSchedules();
      const currentSchedule = schedules.find(schedule => {
        const start = new Date(schedule.startTime);
        const end = new Date(schedule.endTime);
        return start <= now && end >= now;
      });
      
      let show = undefined;
      if (currentSchedule) {
        show = await storage.getShow(currentSchedule.showId);
      }
      
      res.json({
        stream,
        currentShow: show
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching current stream", error: (error as Error).message });
    }
  });
  
  app.post("/api/public/listener-stat", async (req, res) => {
    try {
      // Record a listener statistic
      const { streamId, location, device, listenTime, ipAddress } = req.body;
      
      const stat = await storage.addListenerStat({
        streamId,
        location,
        device,
        listenTime,
        ipAddress,
        timestamp: new Date()
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error recording listener stat", error: (error as Error).message });
    }
  });

  // All routes below this middleware require authentication
  app.use("/api/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  });
  
  // Stream management
  app.get("/api/streams", async (req, res) => {
    try {
      const streams = await storage.getAllStreams();
      res.json(streams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching streams", error: (error as Error).message });
    }
  });
  
  app.get("/api/streams/active", async (req, res) => {
    try {
      const stream = await storage.getActiveStream();
      if (!stream) {
        return res.status(404).json({ message: "No active stream found" });
      }
      res.json(stream);
    } catch (error) {
      res.status(500).json({ message: "Error fetching active stream", error: (error as Error).message });
    }
  });
  
  app.get("/api/streams/:id", async (req, res) => {
    try {
      const stream = await storage.getStream(parseInt(req.params.id));
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.json(stream);
    } catch (error) {
      res.status(500).json({ message: "Error fetching stream", error: (error as Error).message });
    }
  });
  
  app.post("/api/streams", async (req, res) => {
    try {
      const validated = insertStreamSchema.parse(req.body);
      const stream = await storage.createStream(validated);
      res.status(201).json(stream);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid stream data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating stream", error: (error as Error).message });
    }
  });
  
  app.put("/api/streams/:id", async (req, res) => {
    try {
      const validated = insertStreamSchema.partial().parse(req.body);
      const stream = await storage.updateStream(parseInt(req.params.id), validated);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.json(stream);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid stream data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating stream", error: (error as Error).message });
    }
  });
  
  app.delete("/api/streams/:id", async (req, res) => {
    try {
      const success = await storage.deleteStream(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting stream", error: (error as Error).message });
    }
  });
  
  app.post("/api/streams/:id/activate", async (req, res) => {
    try {
      const success = await storage.setStreamActive(parseInt(req.params.id), true);
      if (!success) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.status(200).json({ message: "Stream activated" });
    } catch (error) {
      res.status(500).json({ message: "Error activating stream", error: (error as Error).message });
    }
  });
  
  // Show management
  app.get("/api/shows", async (req, res) => {
    try {
      const shows = await storage.getAllShows();
      res.json(shows);
    } catch (error) {
      res.status(500).json({ message: "Error fetching shows", error: (error as Error).message });
    }
  });
  
  app.get("/api/shows/:id", async (req, res) => {
    try {
      const show = await storage.getShow(parseInt(req.params.id));
      if (!show) {
        return res.status(404).json({ message: "Show not found" });
      }
      res.json(show);
    } catch (error) {
      res.status(500).json({ message: "Error fetching show", error: (error as Error).message });
    }
  });
  
  app.post("/api/shows", async (req, res) => {
    try {
      const validated = insertShowSchema.parse(req.body);
      const show = await storage.createShow(validated);
      res.status(201).json(show);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid show data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating show", error: (error as Error).message });
    }
  });
  
  app.put("/api/shows/:id", async (req, res) => {
    try {
      const validated = insertShowSchema.partial().parse(req.body);
      const show = await storage.updateShow(parseInt(req.params.id), validated);
      if (!show) {
        return res.status(404).json({ message: "Show not found" });
      }
      res.json(show);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid show data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating show", error: (error as Error).message });
    }
  });
  
  app.delete("/api/shows/:id", async (req, res) => {
    try {
      const success = await storage.deleteShow(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Show not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting show", error: (error as Error).message });
    }
  });
  
  // Schedule management
  app.get("/api/schedules", async (req, res) => {
    try {
      const schedules = await storage.getAllSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedules", error: (error as Error).message });
    }
  });
  
  app.get("/api/schedules/upcoming", async (req, res) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 5;
      const schedules = await storage.getUpcomingSchedules(count);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Error fetching upcoming schedules", error: (error as Error).message });
    }
  });
  
  app.get("/api/schedules/:id", async (req, res) => {
    try {
      const schedule = await storage.getSchedule(parseInt(req.params.id));
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Error fetching schedule", error: (error as Error).message });
    }
  });
  
  app.post("/api/schedules", async (req, res) => {
    try {
      const validated = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(validated);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating schedule", error: (error as Error).message });
    }
  });
  
  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const validated = insertScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateSchedule(parseInt(req.params.id), validated);
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating schedule", error: (error as Error).message });
    }
  });
  
  app.delete("/api/schedules/:id", async (req, res) => {
    try {
      const success = await storage.deleteSchedule(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting schedule", error: (error as Error).message });
    }
  });
  
  // Media uploads
  app.post("/api/media/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const fileData = {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        filePath: req.file.path,
        fileSize: req.file.size,
        uploadedBy: req.user!.id,
      };
      
      const media = await storage.addMediaUpload(fileData);
      res.status(201).json(media);
    } catch (error) {
      res.status(500).json({ message: "Error uploading file", error: (error as Error).message });
    }
  });
  
  app.get("/api/media", async (req, res) => {
    try {
      const media = await storage.getAllMediaUploads();
      res.json(media);
    } catch (error) {
      res.status(500).json({ message: "Error fetching media", error: (error as Error).message });
    }
  });
  
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const success = await storage.deleteMediaUpload(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Media not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting media", error: (error as Error).message });
    }
  });
  
  // Analytics
  app.get("/api/analytics/current", async (req, res) => {
    try {
      const currentListeners = await storage.getCurrentListeners();
      const peakListeners = await storage.getPeakListeners(new Date());
      
      res.json({
        currentListeners,
        peakListeners,
        activeShows: 12, // Mock data, would be calculated from schedules
        storageUsed: "28.4 GB" // Mock data, would be calculated from media uploads
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching analytics", error: (error as Error).message });
    }
  });
  
  // AI Voice Services
  
  // Ensure TTS output directory exists
  const TTS_OUTPUT_DIR = process.env.TTS_OUTPUT_DIR || './uploads/tts';
  async function ensureTTSOutputDirExists() {
    try {
      await fsPromises.mkdir(TTS_OUTPUT_DIR, { recursive: true });
    } catch (error) {
      console.error(`Error creating TTS output directory: ${(error as Error).message}`);
    }
  }
  
  // Initialize the TTS output directory
  ensureTTSOutputDirExists();
  
  // Show introduction announcement
  app.post("/api/ai-voice/show-intro", async (req, res) => {
    try {
      const { showId, voice, includeVerse } = req.body;
      
      if (!showId) {
        return res.status(400).json({ message: 'Show ID is required' });
      }
      
      const aiVoiceService = await import('./services/ai-voice-service');
      const result = await aiVoiceService.default.generateShowIntro(
        parseInt(showId),
        voice || 'nova', 
        includeVerse || false
      );
      
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error in show intro API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Show outro announcement
  app.post("/api/ai-voice/show-outro", async (req, res) => {
    try {
      const { showId, voice } = req.body;
      
      if (!showId) {
        return res.status(400).json({ message: 'Show ID is required' });
      }
      
      const aiVoiceService = await import('./services/ai-voice-service');
      const result = await aiVoiceService.default.generateShowOutro(
        parseInt(showId),
        voice || 'nova'
      );
      
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error in show outro API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Verse announcement
  app.post("/api/ai-voice/verse", async (req, res) => {
    try {
      const { voice } = req.body;
      
      const aiVoiceService = await import('./services/ai-voice-service');
      const result = await aiVoiceService.default.generateVerseAnnouncement(voice || 'nova');
      
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error in verse API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // News announcement
  app.post("/api/ai-voice/news", async (req, res) => {
    try {
      const { voice } = req.body;
      
      const aiVoiceService = await import('./services/ai-voice-service');
      const result = await aiVoiceService.default.generateNewsAnnouncement(voice || 'nova');
      
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error in news API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Station ID announcement
  app.post("/api/ai-voice/station-id", async (req, res) => {
    try {
      const { voice } = req.body;
      
      const aiVoiceService = await import('./services/ai-voice-service');
      const result = await aiVoiceService.default.generateStationId(voice || 'nova');
      
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error in station ID API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Devotional announcement
  app.post("/api/ai-voice/devotional", async (req, res) => {
    try {
      const { voice } = req.body;
      
      const aiVoiceService = await import('./services/ai-voice-service');
      const result = await aiVoiceService.default.generateDevotional(voice || 'nova');
      
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error in devotional API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Custom announcement
  app.post("/api/ai-voice/custom", async (req, res) => {
    try {
      const { prompt, voice, includeVerse, includeTrending } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      const aiVoiceService = await import('./services/ai-voice-service');
      const result = await aiVoiceService.default.generateCustomAnnouncement(
        prompt,
        voice || 'nova',
        {
          includeVerse: includeVerse || false,
          includeTrending: includeTrending || false
        }
      );
      
      return res.status(200).json(result);
    } catch (error) {
      console.error(`Error in custom API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get audio file
  app.get("/api/ai-voice/audio/:filename", async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(TTS_OUTPUT_DIR, filename);
      
      // Check if file exists
      try {
        await fsPromises.access(filePath);
      } catch (error) {
        return res.status(404).json({ message: 'Audio file not found' });
      }
      
      // Stream the file
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error(`Error in audio API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get trending topics
  app.get("/api/ai-voice/trending", async (req, res) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 5;
      
      const rssService = (await import('./services/rss-service')).default;
      const topics = await rssService.getTrendingTopics(count);
      
      return res.status(200).json({ topics });
    } catch (error) {
      console.error(`Error in trending API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get daily verse
  app.get("/api/ai-voice/daily-verse", async (req, res) => {
    try {
      const bibleService = (await import('./services/bible-service')).default;
      const verse = await bibleService.getVerseOfTheDay();
      
      return res.status(200).json(verse);
    } catch (error) {
      console.error(`Error in daily verse API: ${(error as Error).message}`);
      return res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get available voices
  app.get("/api/ai-voice/voices", (_req, res) => {
    const voices = [
      { id: 'alloy', name: 'Alloy', description: 'Versatile, general purpose voice' },
      { id: 'echo', name: 'Echo', description: 'Balanced and clear voice' },
      { id: 'fable', name: 'Fable', description: 'Expressive storytelling voice' },
      { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
      { id: 'nova', name: 'Nova', description: 'Warm, pleasant female voice' },
      { id: 'shimmer', name: 'Shimmer', description: 'Calming, gentle voice' }
    ];
    
    return res.status(200).json({ voices });
  });
  
  app.get("/api/analytics/listener-stats", async (req, res) => {
    try {
      const options: {
        showId?: number;
        streamId?: number;
        startDate?: Date;
        endDate?: Date;
      } = {};
      
      if (req.query.showId) {
        options.showId = parseInt(req.query.showId as string);
      }
      
      if (req.query.streamId) {
        options.streamId = parseInt(req.query.streamId as string);
      }
      
      if (req.query.startDate) {
        options.startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        options.endDate = new Date(req.query.endDate as string);
      }
      
      const stats = await storage.getListenerStats(options);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching listener stats", error: (error as Error).message });
    }
  });
  
  // Public API (doesn't require authentication)
  app.get("/api/public/current-stream", async (req, res) => {
    try {
      const stream = await storage.getActiveStream();
      if (!stream) {
        return res.status(404).json({ message: "No active stream found" });
      }
      
      // Get current show information if available
      const now = new Date();
      const schedules = await storage.getAllSchedules();
      const currentSchedule = schedules.find(schedule => {
        const start = new Date(schedule.startTime);
        const end = new Date(schedule.endTime);
        return start <= now && end >= now;
      });
      
      let show = undefined;
      if (currentSchedule) {
        show = await storage.getShow(currentSchedule.showId);
      }
      
      res.json({
        stream,
        currentShow: show
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching current stream", error: (error as Error).message });
    }
  });
  
  app.post("/api/public/listener-stat", async (req, res) => {
    try {
      // Record a listener statistic
      const { streamId, location, device, listenTime, ipAddress } = req.body;
      
      const stat = await storage.addListenerStat({
        streamId,
        location,
        device,
        listenTime,
        ipAddress,
        timestamp: new Date()
      });
      
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error recording listener stat", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
