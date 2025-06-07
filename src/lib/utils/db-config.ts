import { database, dbService } from "../services/index";

// MongoDB configuration options
interface MongoDBConfig {
  /**
   * MongoDB connection URI
   */
  uri: string;
  
  /**
   * Auto-connect to MongoDB on app startup
   */
  autoConnect: boolean;
  
  /**
   * Retry connection if it fails
   */
  retryConnection: boolean;
  
  /**
   * Number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Delay between retry attempts (ms)
   */
  retryDelay: number;
}

// Default configuration
const defaultConfig: MongoDBConfig = {
  uri: "mongodb://localhost:27017",
  autoConnect: true,
  retryConnection: true,
  maxRetries: 5,
  retryDelay: 2000
};

/**
 * Initialize MongoDB connection with configuration
 * In a Tauri app, this would typically be called during app initialization
 */
export async function initializeDatabase(config: Partial<MongoDBConfig> = {}): Promise<void> {
  // Merge provided config with defaults
  const finalConfig: MongoDBConfig = { ...defaultConfig, ...config };
  
  console.log(`Initializing database with ${dbService.isUsingDevService() ? 'development' : 'production'} service`);
  
  if (finalConfig.autoConnect) {
    return connectWithRetry(finalConfig);
  }
}

/**
 * Connect to MongoDB with retry logic
 */
async function connectWithRetry(config: MongoDBConfig, attempt = 1): Promise<void> {
  try {
    await database.connect(config.uri);
    console.log("Successfully connected to database");
  } catch (error) {
    console.error(`Database connection attempt ${attempt} failed:`, error);
    
    if (config.retryConnection && attempt < config.maxRetries) {
      console.log(`Retrying in ${config.retryDelay / 1000} seconds...`);
      
      // Wait for retry delay
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      
      // Retry connection
      return connectWithRetry(config, attempt + 1);
    } else {
      console.error("Failed to connect to database after maximum retry attempts");
      throw error;
    }
  }
}

/**
 * Get the MongoDB connection URI from environment or configuration
 * 
 * This is useful for handling different connection strings in different environments
 */
export function getMongoDBUri(): string {
  // For Tauri app, fetch from .env, app config, or secure storage
  // In a web context, could use process.env
  
  // For development with Tauri, try to get from env var
  const envUri = import.meta.env?.VITE_MONGODB_URI;
  if (envUri) return envUri;
  
  // You could add Tauri-specific storage here
  // Example:
  // if (window.__TAURI__) {
  //   try {
  //     const storedUri = await window.__TAURI__.invoke('get_mongodb_uri');
  //     if (storedUri) return storedUri;
  //   } catch (e) {
  //     console.error('Failed to get MongoDB URI from Tauri:', e);
  //   }
  // }
  
  // Fallback to default
  return defaultConfig.uri;
}

/**
 * Close MongoDB connection
 * Typically called when shutting down the app
 */
export async function closeDatabase(): Promise<void> {
  try {
    await database.disconnect();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing database connection:", error);
    throw error;
  }
}