/**
 * High-Precision Fixed-Point Numeric Arithmetic Utilities
 * Enforces zero floating-point arithmetic errors for all financial calculations.
 * Internal precision: 8 decimal places (1 USDT = 100,000,000 units)
 */

export const LEDGER_DECIMALS = 8;
export const MULTIPLIER = BigInt(10 ** LEDGER_DECIMALS);

export class LedgerMath {
  /**
   * Converts a decimal string (e.g. "80.50", "0.000001") into an integer BigInt
   */
  public static toUnits(amount: string | number): bigint {
    const str = String(amount).trim();
    if (!str || isNaN(Number(str))) {
      throw new Error(`Invalid numeric amount for ledger: "${amount}"`);
    }

    const [wholePart, fractionalPart = ''] = str.split('.');
    const isNegative = wholePart.startsWith('-');
    const cleanWhole = isNegative ? wholePart.slice(1) : wholePart;

    const paddedFraction = (fractionalPart + '0'.repeat(LEDGER_DECIMALS)).slice(0, LEDGER_DECIMALS);
    const combinedStr = `${cleanWhole}${paddedFraction}`;
    const units = BigInt(combinedStr);

    return isNegative ? -units : units;
  }

  /**
   * Converts an integer BigInt back to an exact fixed-point string with specified decimals
   */
  public static fromUnits(units: bigint, decimals: number = 8): string {
    const isNegative = units < 0n;
    const absUnits = isNegative ? -units : units;

    const unitsStr = absUnits.toString().padStart(LEDGER_DECIMALS + 1, '0');
    const whole = unitsStr.slice(0, unitsStr.length - LEDGER_DECIMALS);
    const fraction = unitsStr.slice(unitsStr.length - LEDGER_DECIMALS, unitsStr.length - LEDGER_DECIMALS + decimals);

    const result = decimals > 0 ? `${whole}.${fraction}` : whole;
    return isNegative ? `-${result}` : result;
  }

  /**
   * Adds two decimal strings exactly
   */
  public static add(a: string | number, b: string | number): string {
    const unitsA = this.toUnits(a);
    const unitsB = this.toUnits(b);
    return this.fromUnits(unitsA + unitsB);
  }

  /**
   * Subtracts decimal b from decimal a (a - b)
   */
  public static subtract(a: string | number, b: string | number): string {
    const unitsA = this.toUnits(a);
    const unitsB = this.toUnits(b);
    return this.fromUnits(unitsA - unitsB);
  }

  /**
   * Multiplies a decimal amount by a scalar factor
   */
  public static multiply(a: string | number, scalar: number): string {
    const unitsA = this.toUnits(a);
    const scalarUnits = BigInt(Math.round(scalar * 10000));
    const resultUnits = (unitsA * scalarUnits) / 10000n;
    return this.fromUnits(resultUnits);
  }

  /**
   * Returns true if a > b
   */
  public static isGreaterThan(a: string | number, b: string | number): boolean {
    return this.toUnits(a) > this.toUnits(b);
  }

  /**
   * Returns true if a >= b
   */
  public static isGreaterThanOrEqual(a: string | number, b: string | number): boolean {
    return this.toUnits(a) >= this.toUnits(b);
  }

  /**
   * Returns true if a == b
   */
  public static isEqual(a: string | number, b: string | number): boolean {
    return this.toUnits(a) === this.toUnits(b);
  }

  /**
   * Formats a fixed decimal to user-friendly dollar string (e.g. "$80.00")
   */
  public static formatDollar(amount: string | number): string {
    const units = this.toUnits(amount);
    const formatted = this.fromUnits(units, 2);
    return `$${Number(formatted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
