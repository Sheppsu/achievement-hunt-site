type ExprType =
  | "null"
  | "any"
  | "var"
  | "expr"
  | "int"
  | "float"
  | "str"
  | "bool";
export type AlgorithmFuncArgDocType = {
  name: string;
  description: string;
  type: ExprType[];
};
export type AlgorithmFuncDocType = {
  name: string;
  description: string;
  args: AlgorithmFuncArgDocType[];
  returns: ExprType[];
};
export type AlgorithmDocsType = {
  score: AlgorithmFuncDocType[];
};
