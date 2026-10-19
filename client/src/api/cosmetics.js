/**
 * Cosmetics API Wrapper
 */

export async function getCosmetics() {
  const res = await fetch('/api/cosmetics');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch cosmetics');
  }
  return res.json();
}

export async function purchaseCosmetic(id) {
  const res = await fetch(`/api/cosmetics/${id}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData?.error?.message || 'Failed to purchase cosmetic');
    err.code = errorData?.error?.code;
    throw err;
  }
  return res.json();
}

export async function equipCosmetic(id) {
  const res = await fetch(`/api/cosmetics/${id}/equip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData?.error?.message || 'Failed to equip cosmetic');
    err.code = errorData?.error?.code;
    throw err;
  }
  return res.json();
}
