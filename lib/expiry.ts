export function calculateExpiry(itemType: string): string {
  const now = new Date();

  let days = 30;

  if (itemType === "listing") days = 60;
  if (itemType === "classified") days = 30;
  if (itemType === "job") days = 15;
  if (itemType === "meal") days = 7;

  const expires = new Date(now);
  expires.setDate(now.getDate() + days);

  return expires.toISOString();
}