type TranslationEngine = "google"

type ChainItem = {
    id: string
    language: Language
    engine: TranslationEngine
}

type Language = {
    code: string;
    name: string;
}

// Profile type
type Profile = {
    id: string
    name: string
    chain: ChainItem[]
    createdAt: string
}