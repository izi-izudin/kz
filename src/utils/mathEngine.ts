/**
 * PanzKalkulator Safe Math Parser & Engine
 * Built without eval() using Shunting-Yard algorithm and RPN evaluator.
 */

// Helper to round small floating point inaccuracy (e.g. 0.1 + 0.2 = 0.30000000000000004)
export function sanitizeNumber(num: number, precision = 12): number {
  if (isNaN(num) || !isFinite(num)) return num;
  // If close to an integer within 1e-12, snap to integer (fixes sin(180 deg) ~ 0)
  const nearestInt = Math.round(num);
  if (Math.abs(num - nearestInt) < 1e-12) {
    return nearestInt;
  }
  return Number(parseFloat(num.toPrecision(precision)).toString());
}

export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('Faktorial hanya untuk bilangan bulat tak negatif');
  }
  if (n > 170) return Infinity; // JS Number overflow
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export interface ParseContext {
  angleUnit?: 'deg' | 'rad';
}

type TokenType = 'NUMBER' | 'OP' | 'FUNC' | 'LPAREN' | 'RPAREN' | 'POSTFIX_OP';

interface Token {
  type: TokenType;
  value: string;
}

const OPERATORS: Record<string, { precedence: number; assoc: 'L' | 'R'; args: 2 }> = {
  '+': { precedence: 2, assoc: 'L', args: 2 },
  '-': { precedence: 2, assoc: 'L', args: 2 },
  '*': { precedence: 3, assoc: 'L', args: 2 },
  '/': { precedence: 3, assoc: 'L', args: 2 },
  '%': { precedence: 3, assoc: 'L', args: 2 },
  '^': { precedence: 4, assoc: 'R', args: 2 },
};

const FUNCTIONS = new Set([
  'sin', 'cos', 'tan',
  'asin', 'acos', 'atan',
  'sinh', 'cosh', 'tanh',
  'sqrt', 'cbrt',
  'log', 'ln',
  'abs', 'exp',
  'fact',
]);

export function tokenize(rawExpr: string): Token[] {
  const tokens: Token[] = [];
  // Standardize symbols
  const expr = rawExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'pi')
    .trim();

  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number or constant
    if (/\d/.test(ch) || ch === '.') {
      let numStr = '';
      while (i < expr.length && (/[\d.]/.test(expr[i]))) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Alphabetic words (functions, pi, e)
    if (/[a-zA-Z]/.test(ch)) {
      let word = '';
      while (i < expr.length && /[a-zA-Z0-9]/.test(expr[i])) {
        word += expr[i];
        i++;
      }
      word = word.toLowerCase();

      if (word === 'pi') {
        tokens.push({ type: 'NUMBER', value: String(Math.PI) });
      } else if (word === 'e') {
        tokens.push({ type: 'NUMBER', value: String(Math.E) });
      } else if (FUNCTIONS.has(word)) {
        tokens.push({ type: 'FUNC', value: word });
      } else {
        throw new Error(`Simbol tidak dikenal: ${word}`);
      }
      continue;
    }

    // Factorial postfix
    if (ch === '!') {
      tokens.push({ type: 'POSTFIX_OP', value: '!' });
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Unary minus handling (e.g. at start or after operator/left paren)
    if (ch === '-') {
      const prev = tokens[tokens.length - 1];
      if (!prev || prev.type === 'OP' || prev.type === 'LPAREN') {
        // Treat as unary negative number: consume following number or token
        i++;
        let numStr = '-';
        while (i < expr.length && (/[\d.]/.test(expr[i]))) {
          numStr += expr[i];
          i++;
        }
        if (numStr === '-') {
          // It's negation of expression: equivalent to (-1) *
          tokens.push({ type: 'NUMBER', value: '-1' });
          tokens.push({ type: 'OP', value: '*' });
        } else {
          tokens.push({ type: 'NUMBER', value: numStr });
        }
        continue;
      }
    }

    // Standard binary operators
    if (ch in OPERATORS) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    throw new Error(`Karakter tidak valid: "${ch}"`);
  }

  return tokens;
}

// Convert Infix to RPN via Shunting-Yard
export function toRPN(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const opStack: Token[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'NUMBER') {
      output.push(token);
    } else if (token.type === 'FUNC') {
      opStack.push(token);
    } else if (token.type === 'POSTFIX_OP') {
      output.push(token);
    } else if (token.type === 'OP') {
      const o1 = token;
      while (opStack.length > 0) {
        const top = opStack[opStack.length - 1];
        if (top.type === 'FUNC') {
          output.push(opStack.pop()!);
          continue;
        }
        if (top.type === 'OP') {
          const o2 = top;
          const p1 = OPERATORS[o1.value].precedence;
          const p2 = OPERATORS[o2.value].precedence;
          const assoc = OPERATORS[o1.value].assoc;

          if ((assoc === 'L' && p1 <= p2) || (assoc === 'R' && p1 < p2)) {
            output.push(opStack.pop()!);
            continue;
          }
        }
        break;
      }
      opStack.push(o1);
    } else if (token.type === 'LPAREN') {
      opStack.push(token);
    } else if (token.type === 'RPAREN') {
      let matched = false;
      while (opStack.length > 0) {
        const top = opStack.pop()!;
        if (top.type === 'LPAREN') {
          matched = true;
          break;
        }
        output.push(top);
      }
      if (!matched) {
        throw new Error('Tanda kurung buka dan tutup tidak sesuai');
      }
      // If function is on top of stack, pop it
      if (opStack.length > 0 && opStack[opStack.length - 1].type === 'FUNC') {
        output.push(opStack.pop()!);
      }
    }
  }

  while (opStack.length > 0) {
    const top = opStack.pop()!;
    if (top.type === 'LPAREN' || top.type === 'RPAREN') {
      throw new Error('Tanda kurung buka dan tutup tidak sesuai');
    }
    output.push(top);
  }

  return output;
}

// Evaluate RPN
export function evaluateRPN(rpn: Token[], ctx: ParseContext = {}): number {
  const stack: number[] = [];
  const isDeg = ctx.angleUnit !== 'rad';

  for (const token of rpn) {
    if (token.type === 'NUMBER') {
      const val = parseFloat(token.value);
      if (isNaN(val)) throw new Error(`Angka tidak valid: ${token.value}`);
      stack.push(val);
    } else if (token.type === 'POSTFIX_OP') {
      if (token.value === '!') {
        if (stack.length < 1) throw new Error('Operasi faktorial membutuhkan angka');
        const a = stack.pop()!;
        stack.push(factorial(a));
      }
    } else if (token.type === 'FUNC') {
      if (stack.length < 1) throw new Error(`Fungsi ${token.value} membutuhkan argumen`);
      const arg = stack.pop()!;
      let res = 0;

      switch (token.value) {
        case 'sin': {
          const rad = isDeg ? (arg * Math.PI) / 180 : arg;
          res = Math.sin(rad);
          break;
        }
        case 'cos': {
          const rad = isDeg ? (arg * Math.PI) / 180 : arg;
          res = Math.cos(rad);
          break;
        }
        case 'tan': {
          const rad = isDeg ? (arg * Math.PI) / 180 : arg;
          // check for undefined angles: 90, 270 deg
          if (isDeg && Math.abs(arg % 180) === 90) {
            throw new Error('Nilai tan tidak terdefinisi pada 90°');
          }
          res = Math.tan(rad);
          break;
        }
        case 'asin': {
          if (arg < -1 || arg > 1) throw new Error('Argumen asin harus berada di antara -1 dan 1');
          res = Math.asin(arg);
          if (isDeg) res = (res * 180) / Math.PI;
          break;
        }
        case 'acos': {
          if (arg < -1 || arg > 1) throw new Error('Argumen acos harus berada di antara -1 dan 1');
          res = Math.acos(arg);
          if (isDeg) res = (res * 180) / Math.PI;
          break;
        }
        case 'atan': {
          res = Math.atan(arg);
          if (isDeg) res = (res * 180) / Math.PI;
          break;
        }
        case 'sinh':
          res = Math.sinh(arg);
          break;
        case 'cosh':
          res = Math.cosh(arg);
          break;
        case 'tanh':
          res = Math.tanh(arg);
          break;
        case 'sqrt':
          if (arg < 0) throw new Error('Tidak dapat menghitung akar kuadrat dari bilangan negatif');
          res = Math.sqrt(arg);
          break;
        case 'cbrt':
          res = Math.cbrt(arg);
          break;
        case 'log':
          if (arg <= 0) throw new Error('Logaritma basis 10 hanya untuk bilangan positif');
          res = Math.log10(arg);
          break;
        case 'ln':
          if (arg <= 0) throw new Error('Logaritma natural hanya untuk bilangan positif');
          res = Math.log(arg);
          break;
        case 'abs':
          res = Math.abs(arg);
          break;
        case 'exp':
          res = Math.exp(arg);
          break;
        case 'fact':
          res = factorial(arg);
          break;
        default:
          throw new Error(`Fungsi tidak didukung: ${token.value}`);
      }
      stack.push(sanitizeNumber(res));
    } else if (token.type === 'OP') {
      if (stack.length < 2) throw new Error(`Operasi ${token.value} membutuhkan dua angka`);
      const b = stack.pop()!;
      const a = stack.pop()!;
      let res = 0;

      switch (token.value) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) {
            throw new Error('Error: Pembagian dengan nol');
          }
          res = a / b;
          break;
        case '%':
          // Modulo or percentage calculation
          res = a % b;
          break;
        case '^':
          res = Math.pow(a, b);
          break;
      }
      stack.push(sanitizeNumber(res));
    }
  }

  if (stack.length !== 1) {
    throw new Error('Format persamaan matematika tidak lengkap');
  }

  return sanitizeNumber(stack[0]);
}

/**
 * Main safe evaluation entry point
 */
export function safeEvaluate(expression: string, ctx: ParseContext = {}): { success: boolean; result?: number; error?: string } {
  try {
    if (!expression || !expression.trim()) {
      return { success: true, result: 0 };
    }
    const tokens = tokenize(expression);
    if (tokens.length === 0) {
      return { success: true, result: 0 };
    }
    const rpn = toRPN(tokens);
    const result = evaluateRPN(rpn, ctx);
    return { success: true, result };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error perhitungan' };
  }
}

/**
 * Number formatting with thousand separator according to locale
 */
export function formatDisplayNumber(numStr: string, separator: 'dot' | 'comma' = 'dot', maxDecimals = -1): string {
  if (!numStr || numStr === 'Error' || numStr.includes('Error')) return numStr;
  if (numStr === '-' || numStr === '.') return numStr;

  const parts = numStr.split('.');
  let integerPart = parts[0];
  let decimalPart = parts[1];

  // Optional decimal truncation
  if (maxDecimals >= 0 && decimalPart && decimalPart.length > maxDecimals) {
    decimalPart = decimalPart.slice(0, maxDecimals);
  }

  const isNeg = integerPart.startsWith('-');
  if (isNeg) integerPart = integerPart.substring(1);

  // Add thousand separators
  const thousandChar = separator === 'dot' ? '.' : ',';
  const decimalChar = separator === 'dot' ? ',' : '.';

  const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandChar);

  let result = (isNeg ? '-' : '') + formattedInt;
  if (decimalPart !== undefined) {
    result += decimalChar + decimalPart;
  }
  return result;
}
