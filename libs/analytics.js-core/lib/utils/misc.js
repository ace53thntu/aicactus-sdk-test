export const isElement = (value) =>
  value !== undefined &&
  typeof HTMLElement !== 'undefined' &&
  value instanceof HTMLElement &&
  value.nodeType === 1;

export function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
