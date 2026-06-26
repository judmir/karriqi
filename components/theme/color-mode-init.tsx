import { COLOR_MODE_STORAGE_KEY } from "@/lib/theme/color-mode-dom";

/** Runs before paint so the saved color mode applies without a light flash. */
export function ColorModeInit() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var k=${JSON.stringify(COLOR_MODE_STORAGE_KEY)};var t=localStorage.getItem(k);var r=document.documentElement;if(t==="light"){r.classList.remove("dark");r.classList.add("light");}else{r.classList.add("dark");r.classList.remove("light");}}catch(e){document.documentElement.classList.add("dark");document.documentElement.classList.remove("light");}})();`,
      }}
    />
  );
}
