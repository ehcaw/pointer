import { memo } from "react";

const StatusBadge = memo(
  ({
    connectionStatus,
    isInitialContentLoaded,
    onReconnect,
  }: {
    connectionStatus: "connecting" | "connected" | "disconnected";
    isInitialContentLoaded: boolean;
    onReconnect: () => void;
  }) => {
    const getStatusConfig = () => {
      switch (connectionStatus) {
        case "connected":
          return {
            color: "#10b981",
            bgColor: "#10b98120",
            text: "Connected",
            subtitle: isInitialContentLoaded ? "Synced" : "Loading...",
            isClickable: false,
            showPulse: false,
          };
        case "connecting":
          return {
            color: "#f59e0b",
            bgColor: "#f59e0b20",
            text: "Connecting",
            subtitle: "Establishing connection...",
            isClickable: false,
            showPulse: true,
          };
        case "disconnected":
          return {
            color: "#ef4444",
            bgColor: "#ef444420",
            text: "Disconnected",
            subtitle: "Connection lost",
            isClickable: true,
            showPulse: false,
          };
      }
    };

    const config = getStatusConfig();

    return (
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 10px",
            backgroundColor: config.bgColor,
            border: `1px solid ${config.color}30`,
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "500",
            color: config.color,
            fontFamily: "system-ui, -apple-system, sans-serif",
            backdropFilter: "blur(8px)",
            cursor: config.isClickable ? "pointer" : "default",
            transition: "all 0.2s ease",
          }}
          onClick={config.isClickable ? onReconnect : undefined}
          title={config.isClickable ? "Click to reconnect" : config.subtitle}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: config.color,
              boxShadow: config.showPulse
                ? `0 0 0 2px ${config.color}40`
                : "none",
              animation: config.showPulse
                ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                : "none",
            }}
          />
          <span>{config.text}</span>
          {config.isClickable && (
            <span
              style={{
                fontSize: "10px",
                opacity: 0.7,
                marginLeft: "2px",
              }}
            >
              ↻
            </span>
          )}
        </div>
        {config.subtitle && (
          <div
            style={{
              fontSize: "10px",
              color: config.color,
              opacity: 0.7,
              fontFamily: "system-ui, -apple-system, sans-serif",
              marginRight: "16px",
            }}
          >
            {config.subtitle}
          </div>
        )}
      </div>
    );
  },
);

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
