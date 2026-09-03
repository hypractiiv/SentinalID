// Shared, monotonically-increasing case ID generator so both the live
// Verify flow and (eventually) any backend-issued IDs stay consistent
// in shape. Purely client-side/in-memory — resets on page reload, same
// as the rest of the session history.
let counter = 100;

export function generateCaseId() {
  counter += 1;
  return `VER-${String(counter).padStart(6, "0")}`;
}
