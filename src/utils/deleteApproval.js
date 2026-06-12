const DELETE_PIN_PATTERN = /^\d{4}$/;
const MIN_DELETE_REASON_LENGTH = 5;

const normalizeReason = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const normalizePin = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .slice(0, 4);

const requestDeleteApproval = ({ itemName = "this item", itemLabel = "item" } = {}) => {
  const deletePinRaw = window.prompt(
    `Enter 4-digit delete PIN to delete "${itemName}".`,
  );
  if (deletePinRaw === null) return null;

  const deletePin = normalizePin(deletePinRaw);
  if (!DELETE_PIN_PATTERN.test(deletePin)) {
    return { error: "Delete PIN must be exactly 4 digits." };
  }

  const reasonRaw = window.prompt(
    `Enter reason for deleting this ${itemLabel}. This will be stored in the audit table.`,
  );
  if (reasonRaw === null) return null;

  const deleteReason = normalizeReason(reasonRaw);
  if (deleteReason.length < MIN_DELETE_REASON_LENGTH) {
    return {
      error: `Delete reason must be at least ${MIN_DELETE_REASON_LENGTH} characters.`,
    };
  }

  const confirmed = window.confirm(
    `Delete "${itemName}"?\n\nReason: ${deleteReason}\n\nThis action will be audited.`,
  );
  if (!confirmed) return null;

  return {
    delete_pin: deletePin,
    delete_reason: deleteReason,
  };
};

export { requestDeleteApproval };
