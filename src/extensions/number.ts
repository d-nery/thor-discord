declare global {
  interface Number {
    toTime(): string;
  }
}

/**
 * Convert milliseconds to time string (DD"D" hh:mm:ss).
 *
 * @return String
 */
Number.prototype.toTime = function (in_seconds = false) {
  const seconds = in_seconds ? this : Math.trunc(this / 1000);
  const days = Math.trunc(seconds / 60 / 60 / 24);
  const hours = Math.trunc((seconds / 3600) % 24);
  const minutes = Math.trunc((seconds % 3600) / 60);
  const sec = Math.trunc((seconds % 3600) % 60);

  const uptime = days === 0 ? "" : `${days}D `;

  return uptime.concat(`${hours}:${String(minutes).padStart(2, "0")}:${String(sec).padStart(2, "0")}`);
};

export {};
