"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { fetchSupportedLanguages } from "@/lib/translation-api";

interface LanguageSelectorProps {
  onAddLanguage: (language: Language, engine: TranslationEngine) => void;
  disabled?: boolean;
}

const translationEngines: {
  value: TranslationEngine;
  label: string;
  recommended?: boolean;
}[] = [{ value: "google", label: "Google Translate", recommended: true }];

export function LanguageSelector({
  onAddLanguage,
  disabled,
}: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null
  );
  const [selectedEngine, setSelectedEngine] =
    useState<TranslationEngine>("google");
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);

  useEffect(() => {
    const loadLanguages = async () => {
      setIsLoadingLanguages(true);
      try {
        const supportedLanguages = await fetchSupportedLanguages();
        const targetLanguages = supportedLanguages.filter(
          (lang) => lang.code !== "auto"
        );
        setLanguages(targetLanguages);
      } catch (error) {
        console.error("Failed to load languages:", error);
      } finally {
        setIsLoadingLanguages(false);
      }
    };

    loadLanguages();
  }, []);

  const handleAdd = () => {
    if (selectedLanguage) {
      onAddLanguage(selectedLanguage, selectedEngine);
      setSelectedLanguage(null);
      setSelectedEngine("google");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full bg-transparent"
          size="sm"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Language
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Language to Chain</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select
              value={selectedLanguage?.code}
              onValueChange={(value) =>
                setSelectedLanguage(
                  languages.find((lang) => lang.code === value) || null
                )
              }
              disabled={isLoadingLanguages}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingLanguages
                      ? "Loading languages..."
                      : "Select a language"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {isLoadingLanguages ? (
                  <SelectItem value="" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading languages...
                    </div>
                  </SelectItem>
                ) : (
                  languages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name} ({language.code})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Translation Engine</label>
            <Select
              value={selectedEngine}
              onValueChange={(value: TranslationEngine) =>
                setSelectedEngine(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {translationEngines.map((engine) => (
                  <SelectItem key={engine.value} value={engine.value}>
                    <div className="flex items-center gap-2">
                      <span>{engine.label}</span>
                      {engine.recommended && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAdd}
              disabled={!selectedLanguage || isLoadingLanguages}
              className="flex-1"
            >
              Add to Chain
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
