export type AlgorithmFuncArgDocType = {
  name: string;
  description: string;
  type: (null | "any" | "var" | "expr" | "int" | "float" | "str" | "bool")[];
};
export type AlgorithmFuncDocType = {
  name: string;
  description: string;
  args: AlgorithmFuncArgDocType[];
};
export type AlgorithmDocsType = {
  score: AlgorithmFuncDocType[];
};
