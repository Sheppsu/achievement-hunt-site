// variable typing
import { AlgorithmDocsType } from "api/types/AlgorithmDocsType.ts";

export const VAR_TYPES = ["singular", "list"] as const;
export type SolutionAlgorithmVarType = (typeof VAR_TYPES)[number];
type SolutionAlgorithmVarBase = {
  type: SolutionAlgorithmVarType;
  name: string;
};
export type SolutionAlgorithmSingularVar = SolutionAlgorithmVarBase & {
  type: "singular";
};
export type SolutionAlgorithmListVar = SolutionAlgorithmVarBase & {
  type: "list";
  max_size: number | null;
};
export type SolutionAlgorithmVar =
  | SolutionAlgorithmSingularVar
  | SolutionAlgorithmListVar;

// expression typing
export type SolutionAlgorithmExpr =
  | SolutionAlgorithmFuncExpr
  | number
  | string
  | boolean
  | null;
export type SolutionAlgorithmFuncExpr = {
  func: string;
  args: SolutionAlgorithmExpr[];
};
export type SolutionAlgorithmNamedExpr = {
  name: string;
  value: SolutionAlgorithmExpr;
  // possibly not present on older achievements
  code?: string;
};

// validation typing
export type SolutionAlgorithmValidation = {
  index: number | null;
  indexType: "variable" | "expr";
};

export type SolutionAlgorithmData = {
  vars: SolutionAlgorithmVar[];
  exprs: SolutionAlgorithmNamedExpr[];
  validation: SolutionAlgorithmValidation[];
};

export function makeBlankSolutionAlgorithm(): SolutionAlgorithmData {
  return {
    vars: [],
    exprs: [],
    validation: [],
  };
}

export function makeBlankVar(): SolutionAlgorithmVar {
  return {
    type: "singular",
    name: "",
  };
}

export function makeBlankNamedExpr(): SolutionAlgorithmNamedExpr {
  return {
    name: "",
    value: null,
    code: "",
  };
}

export function makeBlankVal(): SolutionAlgorithmValidation {
  return {
    index: null,
    indexType: "variable",
  };
}

function parsePrimitiveExpr(text: string): null | boolean | number | undefined {
  switch (text) {
    case "null":
      return null;
    case "true":
      return true;
    case "false":
      return false;
    default: {
      const num = parseFloat(text);
      if (!isNaN(num)) {
        return num;
      }
    }
  }
}

export const HIGHLIGHT_COLORS = {
  func: "#fff990",
  str: "#93ff84",
  number: "#68bbff",
  null: "#f39e45",
  boolean: "#f39e45",
} as const;

export type CodeHighlight = {
  type: keyof typeof HIGHLIGHT_COLORS;
  rng: [number, number];
};

// strict is whether to raise errors.
// on non-strict mode, it will return
// incomplete compilation + highlighting
export function compileCode(
  text: string,
  strict: boolean = true,
  validFuncs: string[],
): [SolutionAlgorithmExpr, CodeHighlight[], boolean] {
  let parsedExpr: SolutionAlgorithmFuncExpr = {
    func: "",
    args: [],
  };
  const highlighting: CodeHighlight[] = [];

  // stack of expr objects to avoid recursion
  const stack: SolutionAlgorithmFuncExpr[] = [parsedExpr];

  // last parsed expression
  // comma consumes the expression
  let lastExpr: SolutionAlgorithmExpr = null;
  let lastExprConsumed = true;

  // lower index for substring-ing
  let lowerI = 0;
  // if current index is inside a string
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    // expression object that we're inside
    const parentExpr = stack[stack.length - 1];

    // invalid code
    if (parentExpr === undefined) {
      return [null, highlighting, false];
    }

    // function call
    if (text[i] == "(") {
      const funcName = text.substring(lowerI, i);
      const expr: SolutionAlgorithmFuncExpr = {
        func: funcName,
        args: [],
      };
      if (validFuncs.includes(funcName)) {
        highlighting.push({
          type: "func",
          rng: [lowerI, i],
        });
      }
      stack.push(expr);
      lowerI = i + 1;
    } else if (text[i] == '"') {
      // string parsing
      if (i > 0 && text[i - 1] == "\\") {
        continue;
      }
      if (!inString) {
        lowerI = i;
        inString = true;
      } else {
        lastExpr = text
          .substring(lowerI + 1, i)
          .replace("\\n", "\n")
          .replace("\\\\", "\\")
          .replace('\\"', '"');
        lastExprConsumed = false;
        inString = false;
        highlighting.push({
          type: "str",
          rng: [lowerI, i + 1],
        });
      }
    } else if (text[i] == "," || text[i] == ")") {
      // check if we need to parse the last expr
      if (lastExprConsumed) {
        while (lowerI + 1 < text.length && text[lowerI] === " ") {
          lowerI += 1;
        }
        const trimmed = text.substring(lowerI, i).trim();
        const expr = parsePrimitiveExpr(trimmed);
        if (expr === undefined && text[i] === ",") {
          if (strict) {
            throw new Error("Unexpected comma");
          } else {
            return [
              parsedExpr.args.length == 0 ? null : parsedExpr.args[0],
              highlighting,
              false,
            ];
          }
        } else if (expr !== undefined) {
          lastExpr = expr;
          lastExprConsumed = false;
          highlighting.push({
            // @ts-ignore
            type: expr === null ? "null" : typeof expr,
            rng: [lowerI, lowerI + trimmed.length],
          });
        }
        // if expression is undefined and current char is ")",
        // then we assume it's an empty function call
      }

      if (!lastExprConsumed) {
        parentExpr.args.push(lastExpr);
      }
      if (text[i] == ")") {
        lastExpr = stack.pop()!;
        lastExprConsumed = false;
      } else {
        lastExpr = null;
        lastExprConsumed = true;
      }

      lowerI = i + 1;
    }
  }

  // account for expressions that don't involve functions
  if (parsedExpr.args.length == 0) {
    if (!lastExprConsumed) {
      parsedExpr.args.push(lastExpr);
    } else {
      const trimmed = text.substring(lowerI).trim();
      const expr = parsePrimitiveExpr(trimmed);
      if (expr !== undefined) {
        parsedExpr.args.push(expr);
        highlighting.push({
          // @ts-ignore
          type: expr === null ? "null" : typeof expr,
          rng: [lowerI, lowerI + trimmed.length],
        });
      }
    }
  }

  if (inString) {
    highlighting.push({
      type: "str",
      rng: [lowerI, text.length],
    });
  }

  let successfulCompilation = true;
  if (parsedExpr.args.length !== 1) {
    if (strict) {
      throw new Error("Expected exactly one expression");
    } else {
      successfulCompilation = false;
    }
  }

  return [
    parsedExpr.args.length == 0 ? null : parsedExpr.args[0],
    highlighting,
    successfulCompilation,
  ];
}
