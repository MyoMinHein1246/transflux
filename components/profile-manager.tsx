"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Save, Edit, Trash2, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileManagerProps {
  currentChain: ChainItem[];
  onLoadProfile: (chain: ChainItem[]) => void;
  profiles: Profile[];
  onSaveProfile: (name: string) => void;
  onDeleteProfile: (id: string) => void;
  onExportProfiles: () => void;
  onImportProfiles: (profiles: Profile[]) => void;
}

export function ProfileManager({
  currentChain,
  onLoadProfile,
  profiles,
  onSaveProfile,
  onDeleteProfile,
  onExportProfiles,
  onImportProfiles,
}: ProfileManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const { toast } = useToast();

  const handleSave = () => {
    if (profileName.trim()) {
      onSaveProfile(profileName.trim());
      setProfileName("");
      setIsDialogOpen(false);
      setEditingProfile(null);
    }
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setProfileName(profile.name);
    setIsDialogOpen(true);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedProfiles = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedProfiles)) {
            onImportProfiles(importedProfiles);
            toast({
              title: "Import Successful",
              description: `Imported ${importedProfiles.length} profiles`,
            });
          } else {
            throw new Error("Invalid format");
          }
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Invalid file format",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Profile List */}
      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No saved profiles yet.
          <br />
          Save your translation chains for quick access.
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {profiles.map((profile) => (
            <div key={profile.id} className="p-3 bg-muted rounded-lg border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">
                    {profile.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.chain.length} languages
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.chain.slice(0, 3).map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {item.language.name} ({item.language.code})
                      </Badge>
                    ))}
                    {profile.chain.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{profile.chain.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLoadProfile(profile.chain)}
                    className="h-6 w-6 p-0"
                    title="Load profile"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(profile)}
                    className="h-6 w-6 p-0"
                    title="Edit profile"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteProfile(profile.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    title="Delete profile"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              size="sm"
              disabled={currentChain.length === 0}
              onClick={() => {
                setEditingProfile(null);
                setProfileName("");
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Current Chain
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? "Edit Profile" : "Save Profile"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Profile Name</label>
                <Input
                  placeholder="Enter profile name..."
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Chain Preview</label>
                <div className="p-2 bg-muted rounded text-xs">
                  {currentChain.length === 0 ? (
                    <span className="text-muted-foreground">
                      No languages in chain
                    </span>
                  ) : (
                    currentChain.map((item, index) => (
                      <span key={item.id}>
                        {item.language.name} ({item.language.code})
                        {index < currentChain.length - 1 && " → "}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={!profileName.trim()}
                  className="flex-1"
                >
                  {editingProfile ? "Update" : "Save"} Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import/Export Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportProfiles}
            disabled={profiles.length === 0}
            className="flex-1 bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
