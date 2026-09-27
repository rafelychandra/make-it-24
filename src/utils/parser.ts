export interface EvaluationResult {
  success: boolean;
  value?: number;
  error?: string;
  numbersUsed?: number[];
}

/**
 * Tokenizes the expression string.
 */
export function tokenize(expr: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const char = expr[i];
    if (char === ' ' || char === '\t') {
      i++;
      continue;
    }
    if ('+-*/()'.includes(char)) {
      result.push(char);
      i++;
      continue;
    }
    if (/[0-9]/.test(char)) {
      let numStr = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        // Prevent typing double dots
        if (expr[i] === '.' && numStr.includes('.')) {
          throw new Error('Invalid decimal number format.');
        }
        numStr += expr[i];
        i++;
      }
      result.push(numStr);
      continue;
    }
    // Any other character is invalid
    throw new Error(`Character "${char}" is not supported.`);
  }
  return result;
}

/**
 * Validates syntax, extracts numbers used, and evaluates the mathematical formula safely.
 */
export function evaluateExpression(expr: string, targetNumbers: number[]): EvaluationResult {
  try {
    const tokens = tokenize(expr);
    if (tokens.length === 0) {
      return { success: false, error: 'Please enter a math expression first.' };
    }

    // Extract numbers used
    const numbersUsed: number[] = [];
    tokens.forEach(token => {
      if (!'+-*/()'.includes(token)) {
        const val = parseFloat(token);
        if (!isNaN(val)) {
          numbersUsed.push(val);
        }
      }
    });

    // Validate that the user used exactly 4 numbers
    if (numbersUsed.length !== 4) {
      return {
        success: false,
        error: `You must use exactly 4 numbers. Currently using: ${numbersUsed.length} numbers.`,
        numbersUsed
      };
    }

    // Check if the exact numbers match the targets
    const sortedTargets = [...targetNumbers].sort((a, b) => a - b);
    const sortedUsed = [...numbersUsed].sort((a, b) => a - b);
    
    for (let k = 0; k < 4; k++) {
      if (sortedTargets[k] !== sortedUsed[k]) {
        return {
          success: false,
          error: `The numbers used do not match the available numbers/cards.`,
          numbersUsed
        };
      }
    }

    // Evaluate standard parser
    let index = 0;

    function peek(): string | undefined {
      return tokens[index];
    }

    function consume(expected?: string): string {
      const token = tokens[index];
      if (token === undefined) {
        throw new Error('Incomplete formula expression.');
      }
      if (expected && token !== expected) {
        throw new Error(`Expected "${expected}" but found "${token}".`);
      }
      index++;
      return token;
    }

    function parseExpression(): number {
      let val = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = consume();
        const right = parseTerm();
        if (op === '+') val += right;
        else val -= right;
      }
      return val;
    }

    function parseTerm(): number {
      let val = parseFactor();
      while (peek() === '*' || peek() === '/') {
        const op = consume();
        const right = parseFactor();
        if (op === '*') {
          val *= right;
        } else {
          if (Math.abs(right) < 1e-9) {
            throw new Error('Division by zero is not allowed.');
          }
          val /= right;
        }
      }
      return val;
    }

    function parseFactor(): number {
      const token = peek();
      if (token === '(') {
        consume('(');
        const val = parseExpression();
        consume(')');
        return val;
      }
      if (token !== undefined && !'+-*/()'.includes(token)) {
        const val = parseFloat(consume());
        if (isNaN(val)) {
          throw new Error('Invalid number found.');
        }
        return val;
      }
      throw new Error(`Unexpected operator or dangling parenthesis at "${token || 'end of formula'}".`);
    }

    const value = parseExpression();
    if (index < tokens.length) {
      throw new Error('Extra unprocessed characters found.');
    }

    return {
      success: true,
      value,
      numbersUsed
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error parsing mathematical formula.'
    };
  }
}
