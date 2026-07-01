export function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}