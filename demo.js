// The homepage's moving demo: a small copy of the app's screens, drawn in HTML and CSS and
// stepped through by this script (no video, nothing fetched from anywhere). Three scenes on a
// loop: outlining a text, everything on a passage, and preaching from it.
//
// Each scene is a list of steps. A step is only a number put on the scene (data-step); the
// stylesheet says what each step shows, so the motion is all CSS transitions. That keeps it
// light, and for anyone who has asked their computer to reduce motion (or with ?still=scene.step
// in the address, for taking pictures) every scene simply shows its finished state.

// `say` is the one line the little window beside the demo shows for the whole scene: a nudge, not a tour
// (Noah, 2026-11-10: a caption per step went by too quickly).
const SCENES = [
  {
    id: "passage",
    label: "Everything on a passage",
    steps: [1400, 1700, 1700, 1700, 3200],
    say: "Your sermons, books and notes, beside the passage.",
  },
  {
    id: "outline",
    label: "Outline a text",
    steps: [1300, 1700, 2100, 1900, 2100, 3200],
    say: "Break a text into lines, bracket it, mark your points.",
  },
  {
    id: "preach",
    label: "Preach it",
    steps: [1400, 1900, 4200],
    say: "Preach from the manuscript, with a timer.",
  },
];

/** Type words into an element, a letter at a time. */
function type(el, text, ms) {
  if (!el) return () => {};
  el.textContent = "";
  let i = 0;
  const t = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(t);
  }, Math.max(18, ms / text.length));
  return () => clearInterval(t);
}

export function startDemo(root) {
  if (!root) return;
  const still = new URLSearchParams(location.search).get("still");
  const calm = !!still || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scenes = SCENES.map((s) => ({ ...s, el: root.querySelector(`[data-scene="${s.id}"]`) }));
  const tabs = [...root.querySelectorAll("[data-tab]")];
  const clock = root.querySelector("[data-clock]");
  const sayBox = root.querySelector("[data-say]");
  const preach = scenes.find((s) => s.id === "preach");
  /** The little window's line: it steps back, changes, and pops in again. */
  let sayTimer;
  const say = (text) => {
    if (!sayBox || sayBox.dataset.text === text) return;
    sayBox.dataset.text = text;
    clearTimeout(sayTimer);
    if (root.classList.contains("still")) return void ((sayBox.textContent = text), sayBox.classList.add("in"));
    sayBox.classList.remove("in");
    sayTimer = setTimeout(() => ((sayBox.textContent = text), sayBox.classList.add("in")), 220);
  };
  let at = 0;
  let timers = [];
  let stops = [];
  let seconds = 0;
  const clear = () => {
    timers.forEach(clearTimeout);
    stops.forEach((f) => f());
    timers = [];
    stops = [];
  };
  /** Put a scene on a step: the stylesheet shows everything up to it (classes ge1, ge2…). */
  const setStep = (el, step) => {
    el.dataset.step = String(step);
    for (let i = 1; i <= 8; i++) el.classList.toggle(`ge${i}`, step >= i);
  };
  const show = (n, step) => {
    scenes.forEach((s, k) => {
      s.el.classList.toggle("on", k === n);
      if (k !== n) setStep(s.el, 0);
    });
    tabs.forEach((t, k) => {
      t.classList.toggle("on", k === n);
      t.setAttribute("aria-selected", String(k === n));
    });
    setStep(scenes[n].el, step);
    say(scenes[n].say);
  };
  const typed = (scene, step) => {
    for (const el of scene.el.querySelectorAll(`[data-type-at="${step}"]`)) stops.push(type(el, el.dataset.text, 700));
  };
  const play = (n) => {
    clear();
    at = n;
    const scene = scenes[n];
    show(n, 0);
    // The words that get typed start empty.
    scene.el.querySelectorAll("[data-type-at]").forEach((el) => (el.textContent = ""));
    let when = 0;
    scene.steps.forEach((ms, step) => {
      when += ms;
      timers.push(
        setTimeout(() => {
          if (step + 1 < scene.steps.length) {
            setStep(scene.el, step + 1);
            say(scene.say);
            typed(scene, step + 1);
          } else play((n + 1) % scenes.length);
        }, when),
      );
    });
    root.style.setProperty("--scene-ms", `${scene.steps.reduce((a, b) => a + b, 0)}ms`);
    tabs[n]?.classList.remove("run");
    void tabs[n]?.offsetWidth;
    tabs[n]?.classList.add("run");
  };

  // The preaching timer ticks whenever its scene is up.
  setInterval(() => {
    if (!clock || calm || !preach.el.classList.contains("on")) return;
    seconds = (seconds + 1) % 1800;
    const s = 12 * 60 + 5 + seconds;
    clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }, 1000);

  tabs.forEach((t, k) => t.addEventListener("click", () => (calm ? finished(k) : play(k))));
  /** A scene as it ends: everything drawn, every word typed. */
  const finished = (n, step) => {
    clear();
    root.classList.add("still");
    const scene = scenes[n];
    scene.el.querySelectorAll("[data-type-at]").forEach((el) => (el.textContent = el.dataset.text));
    show(n, step ?? scene.steps.length - 1);
  };
  if (calm) {
    const [name, step] = (still ?? "").split(".");
    const n = Math.max(0, scenes.findIndex((s) => s.id === name));
    return finished(n, step === undefined ? undefined : Number(step));
  }
  // Only runs while it's on screen (and starts again from the top when it comes back).
  if ("IntersectionObserver" in window) {
    let running = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) ((running = true), play(at));
      else if (!e.isIntersecting && running) ((running = false), clear());
    }, { threshold: 0.25 }).observe(root);
  } else play(0);
}

if (typeof document !== "undefined") startDemo(document.querySelector("[data-demo]"));
