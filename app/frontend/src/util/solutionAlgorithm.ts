// variable typing
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
export const EXPR_FUNCTIONS = [
  "variable",
  "attribute",
  "assign",
  "length",
  "sum",
  "ifelse",
] as const;
export const EXPR_FUNCTION_ARGS = {
  variable: [
    {
      descriptor: "Variable name",
      type: "variable",
    },
  ],
  attribute: [
    {
      descriptor: "Attribute name",
      type: "string",
    },
  ],
  assign: [
    {
      descriptor: "Variable",
      type: "variable",
    },
    {
      descriptor: "New value",
      type: "expr",
    },
  ],
  length: [
    {
      descriptor: "Expression",
      type: "expr",
    },
  ],
  sum: [
    {
      descriptor: "Expression",
      type: "expr",
    },
  ],
  ifelse: [
    {
      descriptor: "Evaluated expression",
      type: "expr",
    },
    {
      descriptor: "If true",
      type: "expr",
    },
    {
      descriptor: "If false",
      type: "expr",
    },
  ],
} as const;
export type SolutionAlgorithmFuncType = (typeof EXPR_FUNCTIONS)[number];
export type SolutionAlgorithmExpr =
  | SolutionAlgorithmFuncExpr
  | number
  | string
  | boolean
  | null;
export type SolutionAlgorithmFuncExpr = {
  func: SolutionAlgorithmFuncType;
  args: SolutionAlgorithmExpr[];
};
export type SolutionAlgorithmNamedExpr = {
  name: string;
  value: SolutionAlgorithmExpr;
};

// validation typing
export type SolutionAlgorithmValidation = {
  assertion: SolutionAlgorithmExpr;
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
  };
}

export function makeBlankVal(): SolutionAlgorithmValidation {
  return {
    assertion: null,
    index: null,
    indexType: "variable",
  };
}
