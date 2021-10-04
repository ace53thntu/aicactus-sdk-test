import { delay } from './delay';

export async function tryNTimes({ promise, times = 5, interval = 1000 }) {
  if (times < 1)
    throw new Error(
      `Bad argument: 'times' must be greater than 0, but ${times} was received.`
    );
  let attemptCount = 0;
  while (true) {
    try {
      const result = await promise;
      return result;
    } catch (error) {
      if (++attemptCount >= times) throw error;
    }
    await delay(interval);
  }
}
