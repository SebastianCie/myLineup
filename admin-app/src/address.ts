interface AddressLike {
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

/** Formatiert Straße/PLZ/Ort/Land zu "Straße, PLZ Ort, Land" und lässt fehlende Teile weg. */
export function formatAddress(a: AddressLike): string {
  const line1 = a.street?.trim() || "";
  const cityLine = [a.postalCode?.trim(), a.city?.trim()].filter(Boolean).join(" ");
  return [line1, cityLine, a.country?.trim()].filter(Boolean).join(", ");
}
