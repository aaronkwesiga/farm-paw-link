import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language } from "@/contexts/LanguageContext";

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "runyankole", name: "Runyankole", nativeName: "Runyankole" },
  { code: "rukiga", name: "Rukiga", nativeName: "Rukiga" },
  { code: "runyoro", name: "Runyoro", nativeName: "Runyoro" },
  { code: "rutooro", name: "Rutooro", nativeName: "Rutooro" },
];

const LanguageSelector = () => {
  const { language, setLanguage, t } = useLanguage();

  const currentLanguage = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1 px-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">
            {currentLanguage?.nativeName || "English"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? "bg-accent" : ""}
          >
            <span className="font-medium">{lang.nativeName}</span>
            {lang.code !== "en" && (
              <span className="ml-2 text-muted-foreground text-xs">
                ({lang.name})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
