import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "runyankole" | "rukiga" | "runyoro" | "rutooro";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.findVets": "Find Vets",
    "nav.login": "Login",
    "nav.getStarted": "Get Started",
    "nav.dashboard": "Dashboard",
    "nav.messages": "Messages",
    "nav.profile": "Profile",
    "nav.signOut": "Sign Out",
    "nav.myAccount": "My Account",
    
    // Find Vets Page
    "findVets.title": "Find Veterinarians",
    "findVets.subtitle": "Discover qualified veterinarians in your area",
    "findVets.searchPlaceholder": "Search by name, location, or specialization...",
    "findVets.vetLocations": "Vet Locations",
    "findVets.found": "Found",
    "findVets.veterinarian": "Veterinarian",
    "findVets.veterinarians": "Veterinarians",
    "findVets.noVets": "No veterinarians found",
    "findVets.noLocationData": "No veterinarians with location data available",
    "findVets.viewProfile": "View Profile",
    "findVets.verified": "Verified",
    "findVets.available": "Available",
    "findVets.online": "Online Now",
    "findVets.offline": "Offline",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.submit": "Submit",
    
    // Theme
    "theme.light": "Light",
    "theme.dark": "Dark",
    "theme.system": "System",
    
    // Language names
    "lang.en": "English",
    "lang.runyankole": "Runyankole",
    "lang.rukiga": "Rukiga",
    "lang.runyoro": "Runyoro",
    "lang.rutooro": "Rutooro",
  },
  runyankole: {
    // Navigation
    "nav.findVets": "Shanga Abashaaho",
    "nav.login": "Yingira",
    "nav.getStarted": "Tandika",
    "nav.dashboard": "Ekibaho",
    "nav.messages": "Obubaka",
    "nav.profile": "Ebikukwataho",
    "nav.signOut": "Fuluma",
    "nav.myAccount": "Akauntu Yange",
    
    // Find Vets Page
    "findVets.title": "Shanga Abashaaho",
    "findVets.subtitle": "Kushanga abashaaho abakugu omu kitundu kyawe",
    "findVets.searchPlaceholder": "Shanga na izina, ehantu nari obumanyi...",
    "findVets.vetLocations": "Ahantu h'Abashaaho",
    "findVets.found": "Bashangiwe",
    "findVets.veterinarian": "Omushaaho",
    "findVets.veterinarians": "Abashaaho",
    "findVets.noVets": "Tihariho abashaaho bashangiwe",
    "findVets.noLocationData": "Tihariho abashaaho abaine ehantu haabo",
    "findVets.viewProfile": "Laba Ebikumukwataho",
    "findVets.verified": "Akakasizibwe",
    "findVets.available": "Aliho",
    "findVets.online": "Ariho Hati",
    "findVets.offline": "Tarikuriho",
    
    // Common
    "common.loading": "Nikureeba...",
    "common.error": "Ensobi",
    "common.success": "Kibuzire",
    "common.save": "Bika",
    "common.cancel": "Rekaho",
    "common.delete": "Siba",
    "common.edit": "Hindura",
    "common.submit": "Sindika",
    
    // Theme
    "theme.light": "Ekitangaaza",
    "theme.dark": "Ekiziruguru",
    "theme.system": "System",
    
    // Language names
    "lang.en": "Engereza",
    "lang.runyankole": "Runyankole",
    "lang.rukiga": "Rukiga",
    "lang.runyoro": "Runyoro",
    "lang.rutooro": "Rutooro",
  },
  rukiga: {
    // Navigation
    "nav.findVets": "Shanga Abashaaho",
    "nav.login": "Yingira",
    "nav.getStarted": "Tandika",
    "nav.dashboard": "Ekibaho",
    "nav.messages": "Amabara",
    "nav.profile": "Ebikukwataho",
    "nav.signOut": "Vaaho",
    "nav.myAccount": "Akauntu Yangye",
    
    // Find Vets Page
    "findVets.title": "Shanga Abashaaho",
    "findVets.subtitle": "Kushanga abashaaho abakugu omu kitundu kyawe",
    "findVets.searchPlaceholder": "Shanga na izina, ahantu nari obumanyi...",
    "findVets.vetLocations": "Ahantu h'Abashaaho",
    "findVets.found": "Bashangiwe",
    "findVets.veterinarian": "Omushaaho",
    "findVets.veterinarians": "Abashaaho",
    "findVets.noVets": "Tihariho abashaaho bashangiwe",
    "findVets.noLocationData": "Tihariho abashaaho abaine ehantu haabo",
    "findVets.viewProfile": "Reeba Ebikumukwataho",
    "findVets.verified": "Akakasizibwe",
    "findVets.available": "Ariho",
    "findVets.online": "Ariho Hati",
    "findVets.offline": "Tari kuriho",
    
    // Common
    "common.loading": "Nikureeba...",
    "common.error": "Ensobi",
    "common.success": "Kibuzire",
    "common.save": "Biika",
    "common.cancel": "Rekaho",
    "common.delete": "Siba",
    "common.edit": "Hindura",
    "common.submit": "Sindika",
    
    // Theme
    "theme.light": "Ekitangaaza",
    "theme.dark": "Ekiziruguru",
    "theme.system": "System",
    
    // Language names
    "lang.en": "Engereza",
    "lang.runyankole": "Runyankole",
    "lang.rukiga": "Rukiga",
    "lang.runyoro": "Runyoro",
    "lang.rutooro": "Rutooro",
  },
  runyoro: {
    // Navigation
    "nav.findVets": "Yingura Abasawo",
    "nav.login": "Yingira",
    "nav.getStarted": "Tandika",
    "nav.dashboard": "Ekibaho",
    "nav.messages": "Obubaka",
    "nav.profile": "Ebikukukwataho",
    "nav.signOut": "Vaamu",
    "nav.myAccount": "Akauntu Yange",
    
    // Find Vets Page
    "findVets.title": "Yingura Abasawo",
    "findVets.subtitle": "Kuyingura abasawo abakugu omu kitundu kyawe",
    "findVets.searchPlaceholder": "Yingura na izina, ehantu nari obumanyi...",
    "findVets.vetLocations": "Ehantu hy'Abasawo",
    "findVets.found": "Bayinguriwe",
    "findVets.veterinarian": "Omusawo",
    "findVets.veterinarians": "Abasawo",
    "findVets.noVets": "Tihariho abasawo bayinguriwe",
    "findVets.noLocationData": "Tihariho abasawo abaine ehantu haabo",
    "findVets.viewProfile": "Reba Ebikumukwataho",
    "findVets.verified": "Akakasizibwe",
    "findVets.available": "Aliho",
    "findVets.online": "Aliho Hati",
    "findVets.offline": "Tarikuriho",
    
    // Common
    "common.loading": "Nikuleba...",
    "common.error": "Ensobi",
    "common.success": "Kibuzire",
    "common.save": "Biika",
    "common.cancel": "Rekaho",
    "common.delete": "Siba",
    "common.edit": "Hindura",
    "common.submit": "Sindika",
    
    // Theme
    "theme.light": "Ekitangaala",
    "theme.dark": "Ekiziruguru",
    "theme.system": "System",
    
    // Language names
    "lang.en": "Engereza",
    "lang.runyankole": "Runyankole",
    "lang.rukiga": "Rukiga",
    "lang.runyoro": "Runyoro",
    "lang.rutooro": "Rutooro",
  },
  rutooro: {
    // Navigation
    "nav.findVets": "Bwera Abasawo",
    "nav.login": "Yingira",
    "nav.getStarted": "Tandika",
    "nav.dashboard": "Ekibaho",
    "nav.messages": "Obubaka",
    "nav.profile": "Ebikukukwataho",
    "nav.signOut": "Vaamu",
    "nav.myAccount": "Akauntu Yange",
    
    // Find Vets Page
    "findVets.title": "Bwera Abasawo",
    "findVets.subtitle": "Kubwera abasawo abakugu omu kitundu kyawe",
    "findVets.searchPlaceholder": "Bwera na izina, ehantu nari obumanyi...",
    "findVets.vetLocations": "Ahantu h'Abasawo",
    "findVets.found": "Babwerirwe",
    "findVets.veterinarian": "Omusawo",
    "findVets.veterinarians": "Abasawo",
    "findVets.noVets": "Tihariho abasawo babwerirwe",
    "findVets.noLocationData": "Tihariho abasawo abaine ehantu haabo",
    "findVets.viewProfile": "Reba Ebikumukwataho",
    "findVets.verified": "Akakasizibwe",
    "findVets.available": "Aliho",
    "findVets.online": "Aliho Hati",
    "findVets.offline": "Tarikuriho",
    
    // Common
    "common.loading": "Nikuleba...",
    "common.error": "Ensobi",
    "common.success": "Kibuzire",
    "common.save": "Biika",
    "common.cancel": "Rekaho",
    "common.delete": "Siba",
    "common.edit": "Hindura",
    "common.submit": "Sindika",
    
    // Theme
    "theme.light": "Ekitangaala",
    "theme.dark": "Ekiziruguru",
    "theme.system": "System",
    
    // Language names
    "lang.en": "Engereza",
    "lang.runyankole": "Runyankole",
    "lang.rukiga": "Rukiga",
    "lang.runyoro": "Runyoro",
    "lang.rutooro": "Rutooro",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
