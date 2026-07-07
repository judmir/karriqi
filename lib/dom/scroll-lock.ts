/** Lock the main app scroll region without layout shift when the scrollbar disappears. */
export function lockAppScroll(): () => void {
  const scrollRoot = document.querySelector<HTMLElement>("[data-app-scroll]");
  if (!scrollRoot) {
    return () => {};
  }

  const scrollbarWidth = scrollRoot.offsetWidth - scrollRoot.clientWidth;
  const previousOverflow = scrollRoot.style.overflow;
  const previousPaddingRight = scrollRoot.style.paddingRight;

  scrollRoot.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    scrollRoot.style.paddingRight = `${scrollbarWidth}px`;
  }

  return () => {
    scrollRoot.style.overflow = previousOverflow;
    scrollRoot.style.paddingRight = previousPaddingRight;
  };
}
