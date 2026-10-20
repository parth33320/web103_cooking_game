export async function getSuppliers() {
  const res = await fetch('/api/suppliers');
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Failed to fetch suppliers');
  }
  return res.json();
}
