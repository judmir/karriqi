/** Runs before paint so the saved color mode applies without a light flash. */
export function ColorModeInit() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var k="karriqi.color-mode";var t=localStorage.getItem(k);var r=document.documentElement;if(t==="light"){r.classList.remove("dark");}else{r.classList.add("dark");}}catch(e){document.documentElement.classList.add("dark");}})();`,
      }}
    />
  );
}
