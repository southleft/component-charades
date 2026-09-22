// Accuracy eval: 40 casually-worded descriptions, run through both question sets.
// Usage: set TYPESAFE_API_KEY (or source .env.local), then `npm run eval`.
// Costs about a cent per run. Add cases as you find misses.

import { evaluateDescription } from "@/lib/jev/evaluate";
import { getComponent } from "@/lib/catalog";

// Casual, need-phrased, short. Written the way a designer types, not the way the catalog reads.
const CASES: [string, string][] = [
  ["inline_validation", "displays when a user enters a wrong credit card number"],
  ["inline_validation", "the red text under a field when you typed something wrong"],
  ["toast", "little popup that says saved and goes away"],
  ["snackbar", "bottom message with an undo"],
  ["banner", "site-wide notice at the top about scheduled maintenance"],
  ["alert", "yellow box in the page warning you your trial ends soon"],
  ["modal", "popup that blocks the page until you deal with it"],
  ["confirmation_dialog", "are you sure you want to delete this"],
  ["drawer", "settings panel that slides in from the right"],
  ["popover", "little card that pops off a button with more options"],
  ["tooltip", "hover over an icon and it tells you what it does"],
  ["select", "pick a country from a list"],
  ["combobox", "type a city and it suggests matches"],
  ["date_picker", "choose a delivery date"],
  ["checkbox", "agree to the terms"],
  ["radio_button", "pick one shipping speed"],
  ["switch", "turn dark mode on"],
  ["slider", "set the volume"],
  ["tabs", "switch between overview and reviews"],
  ["breadcrumb", "home > products > shoes"],
  ["pagination", "page 1 2 3 next"],
  ["sidebar", "left hand menu in a dashboard"],
  ["navbar", "the bar at the top with the logo and links"],
  ["command_palette", "press cmd k and search for anything"],
  ["skeleton", "grey placeholder blocks while loading"],
  ["spinner", "loading circle"],
  ["progress_bar", "shows upload is 60% done"],
  ["empty_state", "you have no messages yet illustration"],
  ["badge", "red dot with a 3 on the bell icon"],
  ["avatar", "the user's profile picture circle"],
  ["card", "a box with an image title and a button for each product"],
  ["accordion", "faq questions that expand when clicked"],
  ["table", "rows and columns of orders you can sort"],
  ["stepper_nav", "step 1 of 4 checkout progress"],
  ["file_upload", "drag your resume here"],
  ["password_input", "type your password with a show/hide eye"],
  ["search_input", "search box with a magnifying glass"],
  ["rating", "give it 4 out of 5 stars"],
  ["chip", "removable filter tags like 'red' 'size m'"],
  ["kanban_board", "todo doing done columns you drag cards between"],
];

function fmt(n: number) {
  return n.toFixed(2);
}

async function run(mode: "charades" | "lostfound") {
  let top1 = 0;
  let top3 = 0;
  const misses: string[] = [];
  for (const [target, text] of CASES) {
    const ev = await evaluateDescription(text, mode);
    const rank = ev.ranking.findIndex((r) => r.id === target) + 1;
    if (rank === 1) top1++;
    if (rank >= 1 && rank <= 3) top3++;
    const top = ev.ranking.slice(0, 3).map((r) => `${getComponent(r.id)?.name} ${fmt(r.p)}`).join(" | ");
    const mark = rank === 1 ? "OK" : rank <= 3 ? "~ " : "XX";
    const line = `${mark} r${rank || "-"} conf ${fmt(ev.confidence)}  want ${getComponent(target)?.name?.padEnd(20)} "${text}"\n      ${top}`;
    if (rank !== 1) misses.push(line);
    else console.log(line);
  }
  console.log(`\n--- ${mode}: top1 ${top1}/${CASES.length}  top3 ${top3}/${CASES.length}\n`);
  console.log("MISSES / NEAR:");
  for (const m of misses) console.log(m);
}

async function main() {
  console.log("===== CHARADES QUESTION =====");
  await run("charades");
  console.log("\n===== FINDER QUESTION =====");
  await run("lostfound");
}
main();
