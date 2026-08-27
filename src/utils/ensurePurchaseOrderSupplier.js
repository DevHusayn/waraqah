/**
 * Ensures a supplier record exists for purchase order form data and returns its id.
 * Creates a new supplier when the typed name does not match a saved supplier.
 */
export async function ensurePurchaseOrderSupplier(
    { supplierId, supplierName },
    suppliers,
    { createSupplier, createIfMissing = true } = {}
) {
    const name = String(supplierName || '').trim();

    if (supplierId) {
        const existing = suppliers.find((supplier) => String(supplier.id) === String(supplierId));
        if (existing) return String(supplierId);
    }

    if (!name) return null;

    const match = suppliers.find(
        (supplier) => String(supplier.name || '').trim().toLowerCase() === name.toLowerCase()
    );
    if (match) return String(match.id);

    if (!createIfMissing || !createSupplier) return null;

    const created = await createSupplier(name);
    return String(created.id);
}
