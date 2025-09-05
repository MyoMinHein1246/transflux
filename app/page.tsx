"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Copy,
  Trash2,
  Globe,
  Wifi,
  WifiOff,
  X,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/language-selector";
import { ProfileManager } from "@/components/profile-manager";
import { TranslationProgress } from "@/components/translation-progress";
import {
  detectLanguage,
  translateText,
  checkApiStatus,
} from "@/lib/translation-api";

// API status type
type ApiStatus = "checking" | "online" | "offline";

export default function TransfluxApp() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [translationChain, setTranslationChain] = useState<ChainItem[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentTranslationStep, setCurrentTranslationStep] = useState(0);
  const [detectedSourceLanguage, setDetectedSourceLanguage] =
    useState<string>("");
  const { toast } = useToast();

  // Character limit (configurable)
  const CHARACTER_LIMIT = 1000;

  // Load profiles from localStorage on mount
  useEffect(() => {
    const savedProfiles = localStorage.getItem("transflux-profiles");
    if (savedProfiles) {
      try {
        setProfiles(JSON.parse(savedProfiles));
      } catch (error) {
        console.error("Failed to load profiles:", error);
      }
    }
  }, []);

  // Save profiles to localStorage whenever profiles change
  useEffect(() => {
    localStorage.setItem("transflux-profiles", JSON.stringify(profiles));
  }, [profiles]);

  // Check API status
  useEffect(() => {
    const checkStatus = async () => {
      const isOnline = await checkApiStatus();
      setApiStatus(isOnline ? "online" : "offline");
    };

    checkStatus();
    // Check every 60 seconds
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle text input change
  const handleInputChange = (value: string) => {
    if (value.length <= CHARACTER_LIMIT) {
      setInputText(value);
      // Reset detected language when input changes
      if (detectedSourceLanguage) {
        setDetectedSourceLanguage("");
      }
    }
  };

  // Clear text fields
  const clearText = () => {
    setInputText("");
    setOutputText("");
    setDetectedSourceLanguage("");
    setCurrentTranslationStep(0);
  };

  // Copy output text
  const copyOutput = async () => {
    if (outputText) {
      await navigator.clipboard.writeText(outputText);
      toast({
        title: "Copied!",
        description: "Output text copied to clipboard",
      });
    }
  };

  // Get API status icon and color
  const getApiStatusDisplay = () => {
    switch (apiStatus) {
      case "online":
        return { icon: Wifi, color: "text-green-500", text: "Online" };
      case "offline":
        return { icon: WifiOff, color: "text-red-500", text: "Offline" };
      default:
        return { icon: Globe, color: "text-yellow-500", text: "Checking" };
    }
  };

  const statusDisplay = getApiStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  const handleTranslate = async () => {
    if (
      !inputText.trim() ||
      translationChain.length === 0 ||
      apiStatus === "offline"
    ) {
      return;
    }

    setIsTranslating(true);
    setCurrentTranslationStep(0);
    setOutputText("");

    try {
      // First, detect the source language
      // const detection = await detectLanguage(inputText);
      // if (detection.success) {
      //   setDetectedSourceLanguage(detection.detectedLanguage);
      // }

      setDetectedSourceLanguage("auto");
      let currentText = inputText;
      let sourceLanguage = "auto"; // detection.detectedLanguage || "auto";

      // Process each language in the chain sequentially
      for (let i = 0; i < translationChain.length; i++) {
        setCurrentTranslationStep(i);
        const chainItem = translationChain[i];

        const result = await translateText({
          text: currentText,
          targetLanguage: chainItem.language.code,
          engine: chainItem.engine,
          sourceLanguage:
            i === 0 ? sourceLanguage : translationChain[i - 1].language.code,
        });

        if (!result.success) {
          throw new Error(
            result.error || `Translation failed at step ${i + 1}`
          );
        }

        currentText = result.translatedText;
        sourceLanguage = chainItem.language.code;
      }

      setCurrentTranslationStep(translationChain.length);
      setOutputText(currentText);

      toast({
        title: "Translation Complete",
        description: `Text translated through ${translationChain.length} languages`,
      });
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during translation",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  // Add language to chain
  const addLanguageToChain = (
    language: Language,
    engine: TranslationEngine
  ) => {
    const newItem: ChainItem = {
      id: crypto.randomUUID(),
      language: language,
      engine,
    };
    setTranslationChain((prev) => [...prev, newItem]);
    toast({
      title: "Language Added",
      description: `${language} added to translation chain`,
    });
  };

  // Remove language from chain
  const removeLanguageFromChain = (id: string) => {
    setTranslationChain((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Language Removed",
      description: "Language removed from chain",
    });
  };

  // Move language up in chain
  const moveLanguageUp = (index: number) => {
    if (index > 0) {
      setTranslationChain((prev) => {
        const newChain = [...prev];
        const temp = newChain[index];
        newChain[index] = newChain[index - 1];
        newChain[index - 1] = temp;
        return newChain;
      });
    }
  };

  // Move language down in chain
  const moveLanguageDown = (index: number) => {
    if (index < translationChain.length - 1) {
      setTranslationChain((prev) => {
        const newChain = [...prev];
        const temp = newChain[index];
        newChain[index] = newChain[index + 1];
        newChain[index + 1] = temp;
        return newChain;
      });
    }
  };

  // Clear entire chain
  const clearChain = () => {
    setTranslationChain([]);
    toast({
      title: "Chain Cleared",
      description: "All languages removed from chain",
    });
  };

  // Save current chain as profile
  const saveProfile = (name: string) => {
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name,
      chain: [...translationChain],
      createdAt: new Date().toISOString(),
    };
    setProfiles((prev) => [...prev, newProfile]);

    toast({
      title: "Profile Saved",
      description: `Profile "${name}" saved successfully`,
    });
  };

  // Load profile chain
  const loadProfile = (chain: ChainItem[]) => {
    setTranslationChain(chain);
    toast({
      title: "Profile Loaded",
      description: "Translation chain loaded from profile",
    });
  };

  // Delete profile
  const deleteProfile = (id: string) => {
    const profile = profiles.find((p) => p.id === id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    toast({
      title: "Profile Deleted",
      description: `Profile "${profile?.name}" deleted`,
    });
  };

  // Export profiles
  const exportProfiles = () => {
    const dataStr = JSON.stringify(profiles, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transflux-profiles-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: "Profiles exported successfully",
    });
  };

  // Import profiles
  const importProfiles = (importedProfiles: Profile[]) => {
    // Merge with existing profiles, avoiding duplicates by name
    const existingNames = new Set(profiles.map((p) => p.name));
    const newProfiles = importedProfiles.filter(
      (p) => !existingNames.has(p.name)
    );
    setProfiles((prev) => [...prev, ...newProfiles]);
  };

  // Check if character limit is approaching
  const isNearLimit = inputText.length > CHARACTER_LIMIT * 0.9;
  const isAtLimit = inputText.length >= CHARACTER_LIMIT;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with API Status */}
      <header className="border-b bg-card shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Globe className="h-8 w-8 text-primary transition-transform hover:scale-110" />
                {apiStatus === "checking" && (
                  <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-foreground text-balance">
                Transflux
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <StatusIcon
                  className={`h-5 w-5 ${statusDisplay.color} transition-colors duration-300`}
                />
                {apiStatus === "checking" && (
                  <div className="absolute inset-0 animate-spin border-2 border-transparent border-t-current rounded-full opacity-50" />
                )}
              </div>
              <Badge
                variant={apiStatus === "online" ? "default" : "secondary"}
                className="transition-all duration-300 hover:scale-105"
              >
                API {statusDisplay.text}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* API Offline Alert */}
      {apiStatus === "offline" && (
        <div className="container mx-auto px-4 pt-4">
          <Alert
            variant="destructive"
            className="animate-in slide-in-from-top-2 duration-300"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              API is currently offline. Translation functionality is disabled.
              The app will automatically reconnect when the service is
              available.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Translation Panel */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg transition-shadow hover:shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-balance">
                  <Globe className="h-5 w-5" />
                  Sequential Translation
                  {detectedSourceLanguage && (
                    <Badge
                      variant="secondary"
                      className="ml-2 text-xs animate-in fade-in-50 duration-500"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Detected: {detectedSourceLanguage}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Input Text
                    </label>
                    <span
                      className={`text-xs transition-colors duration-200 ${
                        isAtLimit
                          ? "text-destructive font-medium"
                          : isNearLimit
                          ? "text-yellow-600 font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {inputText.length}/{CHARACTER_LIMIT}
                    </span>
                  </div>
                  <div className="relative">
                    <Textarea
                      placeholder="Enter text to translate through the chain..."
                      value={inputText}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className={`min-h-[120px] resize-none transition-all duration-200 ${
                        isAtLimit
                          ? "border-destructive focus:border-destructive"
                          : isNearLimit
                          ? "border-yellow-500 focus:border-yellow-500"
                          : ""
                      }`}
                      disabled={apiStatus === "offline" || isTranslating}
                      aria-describedby="char-count"
                    />
                    {isNearLimit && (
                      <div className="absolute bottom-2 right-2">
                        <Badge
                          variant={isAtLimit ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {isAtLimit ? "Limit reached" : "Near limit"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Translation Progress */}
                <div className="transition-all duration-300">
                  <TranslationProgress
                    chain={translationChain}
                    currentStep={currentTranslationStep}
                    isTranslating={isTranslating}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleTranslate}
                    disabled={
                      !inputText.trim() ||
                      translationChain.length === 0 ||
                      apiStatus === "offline" ||
                      isTranslating ||
                      isAtLimit
                    }
                    className="flex-1 h-10 px-6 rounded-md text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 inline-flex items-center justify-center gap-2 whitespace-nowrap shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      backgroundColor: "#1E3A8A",
                      color: "#FFFFFF",
                      border: "none",
                    }}
                  >
                    {isTranslating ? "Translating..." : "Translate"}
                  </button>
                  <Button
                    variant="outline"
                    onClick={clearText}
                    disabled={isTranslating}
                    className="transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent text-gray-700 border-gray-300 hover:bg-gray-50"
                    size="lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Output Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Final Output
                    </label>
                    {outputText && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyOutput}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <Textarea
                      placeholder="Translation result will appear here..."
                      value={outputText}
                      readOnly
                      className="min-h-[120px] resize-none bg-muted transition-all duration-300"
                    />
                    {outputText && !isTranslating && (
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="default"
                          className="text-xs animate-in fade-in-50 duration-500"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panels */}
          <div className="space-y-6">
            {/* Translation Chain Panel */}
            <Card className="shadow-lg transition-shadow hover:shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Translation Chain</CardTitle>
                  {translationChain.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearChain}
                      disabled={isTranslating}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {translationChain.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm text-muted-foreground text-balance">
                      No languages in chain yet.
                      <br />
                      Add languages to create your translation sequence.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {translationChain.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-3 bg-muted rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-[1.02] animate-in slide-in-from-left-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <span className="text-xs font-medium text-muted-foreground min-w-[20px]">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {item.language.name} ({item.language.code})
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.engine === "google" ? "Google" : "Microsoft"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveLanguageUp(index)}
                            disabled={index === 0 || isTranslating}
                            className="h-6 w-6 p-0 transition-all duration-200 hover:scale-110"
                            title="Move up"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveLanguageDown(index)}
                            disabled={
                              index === translationChain.length - 1 ||
                              isTranslating
                            }
                            className="h-6 w-6 p-0 transition-all duration-200 hover:scale-110"
                            title="Move down"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLanguageFromChain(item.id)}
                            disabled={isTranslating}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive transition-all duration-200 hover:scale-110"
                            title="Remove language"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <LanguageSelector
                    onAddLanguage={addLanguageToChain}
                    disabled={apiStatus === "offline" || isTranslating}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profiles Panel */}
            <Card className="shadow-lg transition-shadow hover:shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Saved Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileManager
                  currentChain={translationChain}
                  onLoadProfile={loadProfile}
                  profiles={profiles}
                  onSaveProfile={saveProfile}
                  onDeleteProfile={deleteProfile}
                  onExportProfiles={exportProfiles}
                  onImportProfiles={importProfiles}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
