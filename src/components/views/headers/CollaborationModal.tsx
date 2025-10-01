"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, X, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useNotesStore } from "@/lib/stores/notes-store";

import useSWR from "swr";
import { createDataFetchers } from "@/lib/utils/dataFetchers";

interface Collaborator {
  email: string;
  id: string;
}

interface CollaborationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CollaborationModal({
  isOpen,
  onOpenChange,
}: CollaborationModalProps) {
  const { currentNote } = useNotesStore();
  const [isCollaborationEnabled, setIsCollaborationEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [localCollaborators, setLocalCollaborators] = useState<Collaborator[]>(
    [],
  );
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [error, setError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const lastAddAttempt = useRef<number>(0);
  const prevCollaborators = useRef<Collaborator[]>([]);

  const convex = useConvex();
  const { user } = useUser();
  const dataFetchers = createDataFetchers(convex);

  // Constants for validation
  const MAX_COLLABORATORS = 50;
  const RATE_LIMIT_MS = 2000; // 2 seconds between additions
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Reset state when current note changes
  useEffect(() => {
    setIsCollaborationEnabled(currentNote?.collaborative || false);
    setEmail("");
    setError("");
    setEmailError("");
    setIsAddingCollaborator(false);
    // Reset the previous collaborators ref when note changes
    prevCollaborators.current = [];
  }, [currentNote?._id, currentNote?.collaborative]);

  // Validate email in real-time
  useEffect(() => {
    if (email && !EMAIL_REGEX.test(email)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  }, [email]);

  const { data: collaborators = [], isLoading } = useSWR(
    currentNote?._id ? `collaborators-${currentNote._id}` : null,
    async () => {
      if (!currentNote?._id) return [];
      const collaborators = await dataFetchers.fetchSharedUsers(
        currentNote._id,
      );
      return collaborators;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Sync SWR data with local state for modifications
  useEffect(() => {
    // Only update if we're not loading and have valid data
    if (!isLoading && Array.isArray(collaborators)) {
      const collaboratorsString = JSON.stringify(collaborators);
      const prevCollaboratorsString = JSON.stringify(prevCollaborators.current);

      if (collaboratorsString !== prevCollaboratorsString) {
        setLocalCollaborators(collaborators);
        prevCollaborators.current = collaborators;
      }
    } else if (!isLoading && !collaborators) {
      // Handle case where API returns null/undefined (should be empty array)
      if (prevCollaborators.current.length !== 0) {
        setLocalCollaborators([]);
        prevCollaborators.current = [];
      }
    }
  }, [collaborators, isLoading, currentNote?._id]);

  const validateCollaboratorAddition = (emailToAdd: string): string | null => {
    // Clear previous errors
    setError("");

    // Check if email is empty or just whitespace
    if (!emailToAdd || !emailToAdd.trim()) {
      return "Please enter an email address";
    }

    // Validate email format
    if (!EMAIL_REGEX.test(emailToAdd.trim())) {
      return "Please enter a valid email address";
    }

    // Check if user is trying to add themselves
    if (
      user?.emailAddresses?.some(
        (addr) => addr.emailAddress.toLowerCase() === emailToAdd.toLowerCase(),
      )
    ) {
      return "You cannot add yourself as a collaborator";
    }

    // Check for duplicates (case insensitive)
    if (
      localCollaborators.some(
        (c) => c.email.toLowerCase() === emailToAdd.toLowerCase(),
      )
    ) {
      return "This collaborator has already been added";
    }

    // Check maximum collaborators limit
    if (localCollaborators.length >= MAX_COLLABORATORS) {
      return `Maximum of ${MAX_COLLABORATORS} collaborators allowed`;
    }

    // Check rate limiting
    const now = Date.now();
    if (now - lastAddAttempt.current < RATE_LIMIT_MS) {
      return "Please wait a moment before adding another collaborator";
    }

    return null;
  };

  const handleAddCollaborator = async () => {
    const trimmedEmail = email.trim();

    // Validate the addition
    const validationError = validateCollaboratorAddition(trimmedEmail);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Prevent double-clicking and set loading state
    if (isAddingCollaborator) return;
    setIsAddingCollaborator(true);
    setError("");
    lastAddAttempt.current = Date.now();

    try {
      const userId = await convex.action(api.shared.getUserIdByEmail, {
        userEmail: trimmedEmail,
      });

      if (!userId) {
        setError(
          "No user found with that email address. Please make sure they have an account.",
        );
        return;
      }

      const newCollaborator: Collaborator = {
        email: trimmedEmail,
        id: userId,
      };

      setLocalCollaborators([...localCollaborators, newCollaborator]);
      setEmail("");
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Error adding collaborator:", err);
      setError("Failed to add collaborator. Please try again.");
    } finally {
      setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = (id: string) => {
    setLocalCollaborators(localCollaborators.filter((c) => c.id !== id));
  };

  const handleSave = async () => {
    // Here you would typically save the collaboration settings
    if (
      currentNote &&
      currentNote._id &&
      user &&
      user.emailAddresses.length > 0
    ) {
      const users = localCollaborators
        .filter((collaborator) => collaborator.id !== "unknown")
        .map((collaborator) => ({
          userEmail: collaborator.email,
          userId: collaborator.id,
        }));

      await convex.mutation(api.notes.toggleCollaboration, {
        docId: currentNote._id,
        collaborative: isCollaborationEnabled,
      });

      await convex.mutation(api.notes.shareNote, {
        dId: currentNote._id,
        users: users,
        ownerEmail: user.emailAddresses[0]?.emailAddress || "",
        ownerId: user.id,
      });

      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Manage collaboration"
        >
          <Users className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Collaboration Settings</DialogTitle>
          <DialogDescription>
            Manage collaboration for this note. Add collaborators by email and
            control access.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="collaboration-enabled"
              checked={isCollaborationEnabled}
              onCheckedChange={setIsCollaborationEnabled}
            />
            <Label htmlFor="collaboration-enabled">Enable collaboration</Label>
          </div>
          {isCollaborationEnabled && (
            <>
              {(error || emailError) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error || emailError}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="collaborator@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      !isAddingCollaborator &&
                      !emailError &&
                      handleAddCollaborator()
                    }
                    className={emailError ? "border-red-500" : ""}
                  />
                  <Button
                    onClick={handleAddCollaborator}
                    size="sm"
                    disabled={
                      isAddingCollaborator || !!emailError || !email.trim()
                    }
                  >
                    {isAddingCollaborator ? "Adding..." : "Add"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Current Collaborators ({localCollaborators.length}/
                  {MAX_COLLABORATORS})
                </Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {localCollaborators.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No collaborators added yet.
                    </p>
                  ) : (
                    localCollaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="flex items-center justify-between"
                      >
                        <Badge variant="secondary">{collaborator.email}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveCollaborator(collaborator.id)
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
