/* =========================================================
   MUFFIN GAME — player-sketch.js
   Each player loads: player.html?player=YourName

   This page only SENDS messages — it never receives anything
   back, and there is no confirmation from the Game Master.
   The "presses remaining" shown here is a local convenience
   counter for the player's own display only; the Game Master
   Center is the true authority on the actual game state.
   ========================================================= */

let playerName = "Unknown";
let pressesRemainingLocal = MAX_PRESSES;

let channel;
let channelReady = false;

let pressesText, statusText, dedicationInput;

function setup() {
  noCanvas(); // this page is just a simple form, no drawing needed

  const params = new URLSearchParams(window.location.search);
  playerName = params.get("player") || "Unknown";

  createElement("h1", playerName);

  pressesText = createP(pressesLabel());
  pressesText.style("font-family", "monospace");

  const pressButton = createButton("Become the Runner");
  pressButton.mousePressed(handlePress);
  pressButton.style("font-size", "20px");
  pressButton.style("padding", "12px 24px");

  createElement("hr");

  createP("Type your dedication exactly like this, then press Send:");
  createP('"I officially dedicate 5.3 muffins to Charlie"').style("font-style", "italic");

  dedicationInput = createInput("");
  dedicationInput.attribute("size", "50");
  dedicationInput.attribute("placeholder", "I officially dedicate ___ muffins to ___");

  const dedicateButton = createButton("Send Dedication");
  dedicateButton.mousePressed(handleDedicate);

  statusText = createP("");
  statusText.style("color", "#666");

  connectToSupabase();
}

function connectToSupabase() {
  channel = supabaseClient.channel(CHANNEL_NAME);
  channel.subscribe((status) => {
    channelReady = status === "SUBSCRIBED";
  });
}

function pressesLabel() {
  return `Presses remaining: ${pressesRemainingLocal} / ${MAX_PRESSES}`;
}

function handlePress() {
  if (!channelReady) {
    statusText.html("Still connecting, try again in a moment...");
    return;
  }
  if (pressesRemainingLocal <= 0) {
    statusText.html("You have no presses left.");
    return;
  }

  pressesRemainingLocal--;
  pressesText.html(pressesLabel());

  channel.send({
    type: "broadcast",
    event: EVENTS.PRESS,
    payload: { player: playerName }
  });

  statusText.html("Sent: you pressed your button.");
}

function handleDedicate() {
  if (!channelReady) {
    statusText.html("Still connecting, try again in a moment...");
    return;
  }

  const text = dedicationInput.value();
  if (!text || !text.trim()) {
    statusText.html("Type a dedication first.");
    return;
  }

  channel.send({
    type: "broadcast",
    event: EVENTS.DEDICATE,
    payload: { player: playerName, text: text }
  });

  statusText.html(`Sent: "${text}"`);
  dedicationInput.value("");
}
