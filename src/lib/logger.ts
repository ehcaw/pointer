// Utility for logging in Tauri production builds

// Declare Tauri global for TypeScript
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __TAURI__?: any;
  }
}

export const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
    if (typeof window !== "undefined" && window.__TAURI__) {
      // In Tauri production, also try to log to a file or alert
      try {
        const logEntry = {
          level: "INFO",
          message,
          data,
          timestamp: new Date().toISOString(),
        };

        const logs = JSON.parse(localStorage.getItem("app_logs") || "[]");
        logs.push(logEntry);

        // Keep only last 50 logs
        const recentLogs = logs.slice(-50);
        localStorage.setItem("app_logs", JSON.stringify(recentLogs));
      } catch (e) {
        console.error("Failed to store log:", e);
      }
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    if (typeof window !== "undefined" && window.__TAURI__) {
      try {
        const logEntry = {
          level: "ERROR",
          message,
          error: error?.message || error,
          stack: error?.stack,
          timestamp: new Date().toISOString(),
        };

        const logs = JSON.parse(localStorage.getItem("app_logs") || "[]");
        logs.push(logEntry);

        const recentLogs = logs.slice(-50);
        localStorage.setItem("app_logs", JSON.stringify(recentLogs));

        // In production, show critical errors as alerts
        if (process.env.NODE_ENV === "production") {
          alert(`Error: ${message}\n\nDetails saved to logs.`);
        }
      } catch (e) {
        console.error("Failed to store error log:", e);
      }
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },

  // Function to export logs for debugging
  exportLogs: () => {
    if (typeof window !== "undefined") {
      const errorLogs = JSON.parse(localStorage.getItem("error_logs") || "[]");
      const appLogs = JSON.parse(localStorage.getItem("app_logs") || "[]");

      const allLogs = {
        errorLogs,
        appLogs,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      };

      return JSON.stringify(allLogs, null, 2);
    }
    return null;
  },

  // Function to clear logs
  clearLogs: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("error_logs");
      localStorage.removeItem("app_logs");
    }
  },
};

// Global error handler for unhandled errors
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    logger.error("Unhandled error:", {
      message: event.error?.message || event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection:", {
      reason: event.reason,
      stack: event.reason?.stack,
    });
  });
}

export default logger;
