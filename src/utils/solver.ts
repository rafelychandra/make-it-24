export interface Term {
  val: number;
  expr: string;
}

/**
 * Solves the 24 game for a given array of exactly 4 numbers.
 * @param numbers Array of 4 numbers
 * @returns A string representation of the solution (e.g. "((3 * 8) + (8 - 8))"), or null if no solution exists.
 */
export function solve24(numbers: number[]): string | null {
  if (numbers.length !== 4) return null;
  const terms: Term[] = numbers.map(n => ({ val: n, expr: n.toString() }));
  const rawSolution = findSolution(terms);
  if (!rawSolution) return null;
  
  // Clean up excessive outer parentheses, if any
  return cleanExpression(rawSolution);
}

function findSolution(terms: Term[]): string | null {
  if (terms.length === 1) {
    if (Math.abs(terms[0].val - 24) < 1e-5) {
      return terms[0].expr;
    }
    return null;
  }

  for (let i = 0; i < terms.length; i++) {
    for (let j = 0; j < terms.length; j++) {
      if (i === j) continue;
      
      const A = terms[i];
      const B = terms[j];

      // Base remaining term list
      const remaining: Term[] = [];
      for (let k = 0; k < terms.length; k++) {
        if (k !== i && k !== j) {
          remaining.push(terms[k]);
        }
      }

      // Try basic arithmetic operations
      // We apply order: A op B
      const ops = ['+', '-', '*', '/'];
      for (const op of ops) {
        if (op === '/' && Math.abs(B.val) < 1e-9) continue; // Prevent division by zero

        let val = 0;
        switch (op) {
          case '+': val = A.val + B.val; break;
          case '-': val = A.val - B.val; break;
          case '*': val = A.val * B.val; break;
          case '/': val = A.val / B.val; break;
        }

        const nextTerms = [
          ...remaining,
          { val, expr: `(${A.expr} ${op} ${B.expr})` }
        ];

        const sol = findSolution(nextTerms);
        if (sol) return sol;
      }
    }
  }

  return null;
}

/**
 * Recursively cleans bracket pairs if they are redundant and wraps the whole term.
 */
function cleanExpression(expr: string): string {
  if (expr.startsWith('(') && expr.endsWith(')')) {
    // Let's count if the opening bracket correctly matches the closing bracket at the end
    let count = 0;
    let isRedundant = true;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === '(') count++;
      else if (expr[i] === ')') count--;
      if (count === 0 && i > 0) {
        isRedundant = false;
        break;
      }
    }
    if (isRedundant) {
      return cleanExpression(expr.slice(1, -1));
    }
  }
  return expr;
}
