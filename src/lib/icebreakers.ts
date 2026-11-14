export const ICEBREAKERS = [
  "What's the weirdest food combination you secretly love?",
  "If you had $50,000 to spend in the next 1 hour, what are you buying?",
  "What's a movie or show everyone loves that you secretly dislike?",
  "If you could teleport anywhere on Earth right this second, where are we going?",
  "What is the most useless piece of trivia living rent-free in your brain?",
  "If your pet could talk for 1 minute, what's the first thing it would say?",
  "Would you rather explore deep ocean trenches or distant galaxies?",
  "What is the absolute best late-night snack on planet Earth?",
  "What was your all-time favorite cartoon or video game growing up?",
  "If you could have dinner with anyone alive or dead, who would it be?",
  "What's a hill you are 100% willing to die on?",
  "Are you a night owl, early bird, or permanently exhausted pigeon?",
  "What's the most underrated superpower you wish you had?",
  "If your life had a theme song every time you entered a room, what is it?",
  "Do you believe in aliens? What's your theory?",
  "What is something you tried once and will NEVER do again?",
  "If you could master any skill in 5 seconds, what would you choose?",
  "What's the best concert or live event you've ever experienced?",
  "Coffee, tea, energy drinks, or pure chaos?",
  "What's the most spontaneous thing you've ever done?",
];

let lastIndex = -1;

export const getRandomIcebreaker = (): string => {
  let index = Math.floor(Math.random() * ICEBREAKERS.length);
  while (index === lastIndex && ICEBREAKERS.length > 1) {
    index = Math.floor(Math.random() * ICEBREAKERS.length);
  }
  lastIndex = index;
  return ICEBREAKERS[index];
};
