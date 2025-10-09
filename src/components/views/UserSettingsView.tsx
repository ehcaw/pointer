"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Database,
  Moon,
  Sun,
  Settings,
  Shield,
  CreditCard,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { useTheme } from "@/providers/ThemeProvider";

export const UserSettingsView = () => {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [collaborativeEditing, setCollaborativeEditing] = useState(false);

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "teams", label: "Teams", icon: Users },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "data", label: "Data", icon: Database },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Workspace
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Manage your workspace settings and preferences.
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div>
          <Label
            htmlFor="workspace-name"
            className="text-sm font-medium mb-2 block"
          >
            Workspace name
          </Label>
          <Input
            id="workspace-name"
            defaultValue="Pointer"
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Pick a name for your workspace. Recommended size is 256×256px.
          </p>
        </div>

        <div>
          <Label
            htmlFor="workspace-url"
            className="text-sm font-medium mb-2 block"
          >
            Workspace URL
          </Label>
          <Input
            id="workspace-url"
            defaultValue="pointer.app/workspace"
            className="max-w-md"
          />
        </div>

        <div className="pt-4">
          <Button size="sm">Update</Button>
        </div>
      </div>

      <div className="border-t border-border dark:border-border pt-8">
        <h3 className="text-lg font-medium text-foreground dark:text-foreground mb-6">
          Preferences
        </h3>

        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between py-3">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Choose your preferred theme
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-20"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 mr-1" />
                  Light
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-1" />
                  Dark
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label className="text-sm font-medium">Auto-save</Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Automatically save your work as you type
              </p>
            </div>
            <Switch checked={autoSave} onCheckedChange={setAutoSave} />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label className="text-sm font-medium">
                Collaborative editing
              </Label>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Enable real-time collaboration features
              </p>
            </div>
            <Switch
              checked={collaborativeEditing}
              onCheckedChange={setCollaborativeEditing}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
          Profile
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground text-sm mb-6">
          Manage your personal information and profile settings.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4 p-4 bg-muted/50 dark:bg-muted/50 rounded-lg">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xl font-semibold">
            {user?.firstName?.[0] ||
              user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
              "U"}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : user?.emailAddresses[0]?.emailAddress || "User"}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {user?.emailAddresses[0]?.emailAddress}
            </p>
          </div>
          <Button variant="outline" size="sm">
            Change avatar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="first-name"
              className="text-sm font-medium mb-2 block"
            >
              First name
            </Label>
            <Input id="first-name" defaultValue={user?.firstName || ""} />
          </div>
          <div>
            <Label
              htmlFor="last-name"
              className="text-sm font-medium mb-2 block"
            >
              Last name
            </Label>
            <Input id="last-name" defaultValue={user?.lastName || ""} />
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium mb-2 block">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            defaultValue={user?.emailAddresses[0]?.emailAddress || ""}
            className="max-w-md"
          />
        </div>

        <div className="pt-4">
          <Button size="sm">Save changes</Button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
          Notifications
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground text-sm mb-6">
          Choose what notifications you receive and how.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div>
          <h3 className="text-lg font-medium text-foreground dark:text-foreground mb-4">
            Email notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <Label className="text-sm font-medium">New notes</Label>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Get notified when someone shares a note with you
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <Label className="text-sm font-medium">Comments</Label>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Get notified when someone comments on your notes
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <Label className="text-sm font-medium">Weekly digest</Label>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Get a weekly summary of your activity
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlaceholderSection = (title: string, description: string) => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground dark:text-foreground mb-2">
          {title}
        </h2>
        <p className="text-muted-foreground dark:text-muted-foreground text-sm mb-6">
          {description}
        </p>
      </div>
      <div className="flex items-center justify-center h-64 bg-muted/50 dark:bg-muted/50 rounded-lg max-w-2xl">
        <p className="text-muted-foreground dark:text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return renderGeneralSettings();
      case "profile":
        return renderProfileSettings();
      case "notifications":
        return renderNotificationSettings();
      case "security":
        return renderPlaceholderSection(
          "Security & Access",
          "Manage your password and authentication settings.",
        );
      case "teams":
        return renderPlaceholderSection(
          "Teams",
          "Manage your team members and permissions.",
        );
      case "billing":
        return renderPlaceholderSection(
          "Billing",
          "Manage your subscription and billing information.",
        );
      case "data":
        return renderPlaceholderSection(
          "Import / Export",
          "Import and export your data.",
        );
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header */}
      <div className="">
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground dark:text-foreground">
              Settings
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground dark:bg-primary"
                    : "text-foreground dark:text-foreground hover:bg-muted/20 dark:hover:bg-muted/20"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">{renderContent()}</div>
    </div>
  );
};
