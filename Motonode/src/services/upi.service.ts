const UPI_REGEX = /^[\w.-]+@[\w]+$/;

export function validateUpiFormat(upiId: string): boolean {
  return UPI_REGEX.test(upiId.trim());
}
