/** Contenitore scroll dell'app shell (sidebar + top bar). */
export function getAppMainElement(): HTMLElement | null {
  return document.querySelector("main[data-app-main]");
}

export function resetAppMainScroll() {
  const main = getAppMainElement();
  if (main) main.scrollTop = 0;
}

export function scrollAppMainToElement(
  id: string,
  options?: { behavior?: ScrollBehavior },
): boolean {
  const target = document.getElementById(id);
  const main = getAppMainElement();
  if (!target || !main) return false;

  const scrollMarginTop =
    parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
  const top =
    main.scrollTop +
    target.getBoundingClientRect().top -
    main.getBoundingClientRect().top -
    scrollMarginTop;

  main.scrollTo({
    top: Math.max(0, top),
    behavior: options?.behavior ?? "smooth",
  });
  return true;
}
