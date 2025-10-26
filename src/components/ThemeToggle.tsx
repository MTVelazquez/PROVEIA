import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-full bg-[#E9EAED] dark:bg-slate-800 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155]" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-10 w-10 rounded-full bg-[#E9EAED] dark:bg-slate-800 shadow-[8px_8px_16px_#c7ccd3,-8px_-8px_16px_#ffffff] dark:shadow-[8px_8px_16px_#0f172a,-8px_-8px_16px_#334155] hover:shadow-[12px_12px_20px_#c7ccd3,-12px_-12px_20px_#ffffff] dark:hover:shadow-[12px_12px_20px_#0f172a,-12px_-12px_20px_#334155] transition-all grid place-items-center"
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-[#11386E]" />
      )}
    </button>
  );
};
