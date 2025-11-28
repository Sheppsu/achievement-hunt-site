// variable typing
export const VAR_TYPES = ["singular", "list"] as const;
export type SolutionAlgorithmVarType = (typeof VAR_TYPES)[number];
type SolutionAlgorithmVarBase = {
  id: number;
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
  id: number;
  name: string;
  value: SolutionAlgorithmExpr;
};

// validation typing
export type SolutionAlgorithmValidation = {
  id: number;
  assertion: SolutionAlgorithmExpr;
  index: number | null;
  indexType: "variable" | "expr";
};

export type SolutionAlgorithmData = {
  vars: SolutionAlgorithmVar[];
  exprs: SolutionAlgorithmNamedExpr[];
  validation: SolutionAlgorithmValidation[];
};

// actions
// export type SolutionAlgorithmActionAddVar = {
//   type: "add-var";
//   data: SolutionAlgorithmVar;
// };
// export type SolutionAlgorithmActionEditVar = {
//   type: "edit-var";
//   index: number;
//   data: SolutionAlgorithmVar;
// };
// export type SolutionAlgorithmActionAddExpr = {
//   type: "add-expr";
//   data: SolutionAlgorithmExpr;
// };
// export type SolutionAlgorithmActionEditExpr = {
//   type: "edit-expr";
//   index: number;
//   data: SolutionAlgorithmExpr;
// };
// export type SolutionAlgorithmActionAddValidation = {
//   type: "add-validation";
//   data: SolutionAlgorithmValidation;
// };
// export type SolutionAlgorithmActionEditValidation = {
//   type: "edit-validation";
//   index: number;
//   data: SolutionAlgorithmValidation;
// };
//
// export type SolutionAlgorithmAction =
//   | SolutionAlgorithmActionAddVar
//   | SolutionAlgorithmActionEditVar
//   | SolutionAlgorithmActionAddExpr
//   | SolutionAlgorithmActionEditExpr
//   | SolutionAlgorithmActionAddValidation
//   | SolutionAlgorithmActionEditValidation;
//
// export function solutionAlgorithmReducer(
//   state: SolutionAlgorithmData,
//   action: SolutionAlgorithmAction,
// ) {
//   switch (action.type) {
//     case "add-var":
//       return {
//         ...state,
//         vars: state.vars.concat([action.data]),
//       };
//     case "edit-var":
//       return {
//         ...state,
//         vars: state.vars
//           .slice(0, action.index)
//           .concat([action.data])
//           .concat(state.vars.slice(action.index + 1)),
//       };
//     case "add-expr":
//       return {
//         ...state,
//         exprs: state.exprs.concat([action.data]),
//       };
//     case "edit-expr":
//       return {
//         ...state,
//         exprs: state.exprs
//           .slice(0, action.index)
//           .concat([action.data])
//           .concat(state.exprs.slice(action.index + 1)),
//       };
//     case "add-validation":
//       return {
//         ...state,
//         validation: state.validation.concat([action.data]),
//       };
//     case "edit-validation":
//       return {
//         ...state,
//         validation: state.validation
//           .slice(0, action.index)
//           .concat([action.data])
//           .concat(state.validation.slice(action.index + 1)),
//       };
//   }
// }

export function makeBlankSolutionAlgorithm(): SolutionAlgorithmData {
  return {
    vars: [],
    exprs: [],
    validation: [],
  };
}

var idCounter = 0;
function getNewId() {
  idCounter += 1;
  return idCounter;
}

export function makeBlankVar(): SolutionAlgorithmVar {
  return {
    id: getNewId(),
    type: "singular",
    name: "",
  };
}

export function makeBlankNamedExpr(): SolutionAlgorithmNamedExpr {
  return {
    id: getNewId(),
    name: "",
    value: null,
  };
}

export function makeBlankVal(): SolutionAlgorithmValidation {
  return {
    id: getNewId(),
    assertion: null,
    index: null,
    indexType: "variable",
  };
}
