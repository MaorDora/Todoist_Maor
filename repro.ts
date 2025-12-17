
function spreadGeneric<T>(data: T) {
    const copy = { ...data };
}

function spreadUnknown(data: unknown) {
    const copy = { ...data }; // This usually works in newer TS versions (translates to empty object if not object), but let's check
}
