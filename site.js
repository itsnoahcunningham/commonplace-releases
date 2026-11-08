// The website's one script: which computer this is, and the Download buttons.
// Plain JavaScript, no build step. Everything to change before going live is in SITE.

export const SITE = {
  /**
   * The public releases repo ("owner/name"), once it exists (ROADMAP Phase 2). While it's
   * empty, Download says downloads open soon and offers an email instead.
   */
  releasesRepo: "itsnoahcunningham/commonplace-releases",
  email: "nohacunningham@gmail.com",
};

/** "mac", "windows", "phone" (iPhone, iPad, Android) or "other". */
export function platformOf(ua = "", touchPoints = 0) {
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return "phone";
  // iPads ask for the desktop site and say "Macintosh"; they have a touch screen.
  if (/Macintosh|Mac OS X/i.test(ua)) return touchPoints > 1 ? "phone" : "mac";
  if (/Windows/i.test(ua)) return "windows";
  return "other";
}

/** Where each installer is, always the newest (the release step keeps these names). */
export function downloadLinks(repo) {
  if (!repo) return null;
  const base = `https://github.com/${repo}/releases/latest/download`;
  return { mac: `${base}/Commonplace-Study-Mac.dmg`, windows: `${base}/Commonplace-Study-Windows-Setup.exe` };
}

export const NAMES = { mac: "Mac", windows: "Windows" };

/** What the main Download button says and where it goes, for this computer. */
export function mainButton(platform, links) {
  if (!links) return { label: "Downloads open soon", href: "download.html", other: null };
  if (platform === "mac" || platform === "windows") {
    const other = platform === "mac" ? "windows" : "mac";
    return { label: `Download for ${NAMES[platform]}`, href: links[platform], other: { label: `Also for ${NAMES[other]}`, href: links[other] } };
  }
  return { label: "Download", href: "download.html", other: null };
}

function fill() {
  const platform = platformOf(navigator.userAgent, navigator.maxTouchPoints || 0);
  const links = downloadLinks(SITE.releasesRepo);
  document.documentElement.dataset.platform = platform;
  document.documentElement.dataset.downloads = links ? "open" : "soon";
  for (const el of document.querySelectorAll("[data-main-download]")) {
    const b = mainButton(platform, links);
    el.textContent = b.label;
    el.href = b.href;
    const other = el.parentElement?.querySelector("[data-other-download]");
    if (other) {
      if (b.other) {
        other.textContent = b.other.label;
        other.href = b.other.href;
      } else other.remove();
    }
  }
  for (const el of document.querySelectorAll("[data-download]")) {
    const which = el.dataset.download;
    if (links) el.href = links[which];
    else el.removeAttribute("href");
    if (which === platform) el.closest(".choice")?.classList.add("this-computer");
  }
  for (const el of document.querySelectorAll("[data-email]")) {
    el.href = `mailto:${SITE.email}${el.dataset.email ? `?subject=${encodeURIComponent(el.dataset.email)}` : ""}`;
    if (!el.textContent.trim()) el.textContent = SITE.email;
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill);
  else fill();
}
