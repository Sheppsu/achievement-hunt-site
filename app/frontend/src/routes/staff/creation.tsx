import { Helmet } from "react-helmet";
import React, { ReactNode, useCallback } from "react";
import {
  EXPR_FUNCTION_ARGS,
  EXPR_FUNCTIONS,
  makeBlankNamedExpr,
  makeBlankSolutionAlgorithm,
  makeBlankVal,
  makeBlankVar,
  SolutionAlgorithmData,
  SolutionAlgorithmExpr,
  SolutionAlgorithmNamedExpr,
  SolutionAlgorithmFuncExpr,
  SolutionAlgorithmFuncType,
  SolutionAlgorithmValidation,
  SolutionAlgorithmVar,
  VAR_TYPES,
} from "util/solutionAlgorithm.ts";
import TextInput from "components/inputs/TextInput.tsx";
import Dropdown from "components/inputs/Dropdown.tsx";
import { IoIosAddCircle } from "react-icons/io";
import Checkbox from "components/inputs/Checkbox.tsx";

const EXPR_TYPES = [
  "func",
  "string",
  "number",
  "boolean",
  "variable",
  "null",
] as const;
type ExprType = (typeof EXPR_TYPES)[number];

export default class CreationViewNew extends React.Component {
  private algorithm: SolutionAlgorithmData;

  constructor() {
    super({});

    this.algorithm = makeBlankSolutionAlgorithm();
  }

  private addVar() {
    this.algorithm.vars.push(makeBlankVar());
    this.forceUpdate();
  }

  private addExpr() {
    this.algorithm.exprs.push(makeBlankNamedExpr());
    this.forceUpdate();
  }

  private addVal() {
    this.algorithm.validation.push(makeBlankVal());
    this.forceUpdate();
  }

  render() {
    return (
      <>
        <Helmet>
          <title>CTA - Staff Creation</title>
        </Helmet>
        <div className="staff-creation__page">
          <div className="staff-creation__section">
            <div className="staff-creation__section-header">
              <h2 className="staff-creation__section-header-text">Variables</h2>
              <IoIosAddCircle
                className="clickable"
                size={32}
                onClick={() => this.addVar()}
              />
            </div>
            <div className="staff-creation__section-container">
              {this.algorithm.vars.map((v, i) => (
                <VarEntry
                  key={i}
                  entry={v}
                  forceUpdate={() => this.forceUpdate()}
                />
              ))}
            </div>
          </div>
          <div className="staff-creation__section">
            <div className="staff-creation__section-header">
              <h2 className="staff-creation__section-header-text">
                Expressions
              </h2>
              <IoIosAddCircle
                className="clickable"
                size={32}
                onClick={() => this.addExpr()}
              />
            </div>
            <div className="staff-creation__section-container">
              {this.algorithm.exprs.map((e, i) => (
                <NamedExprEntry
                  key={i}
                  entry={e}
                  forceUpdate={() => this.forceUpdate()}
                  variables={this.algorithm.vars}
                />
              ))}
            </div>
          </div>
          <div className="staff-creation__section">
            <div className="staff-creation__section-header">
              <h2 className="staff-creation__section-header-text">
                Validations
              </h2>
              <IoIosAddCircle
                className="clickable"
                size={32}
                onClick={() => this.addVal()}
              />
            </div>
            <div className="staff-creation__section-container">
              {this.algorithm.validation.map((v, i) => (
                <ValidationEntry
                  key={i}
                  entry={v}
                  forceUpdate={() => this.forceUpdate()}
                  expressions={this.algorithm.exprs}
                  variables={this.algorithm.vars}
                />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
}

function CustomCheckbox({
  label,
  value,
  setValue,
}: {
  label?: string;
  value: boolean;
  setValue: (value: boolean) => void;
}) {
  return (
    <div className="staff-creation__checkbox-container">
      {label === undefined ? (
        ""
      ) : (
        <p className="staff-creation__checkbox-label">{label}</p>
      )}
      <Checkbox
        className="staff-creation__checkbox"
        checked={value}
        onChange={(evt) => setValue(evt.currentTarget.checked)}
      />
    </div>
  );
}

function VarEntry({
  entry,
  forceUpdate,
}: {
  entry: SolutionAlgorithmVar;
  forceUpdate: () => void;
}) {
  const editVar = useCallback(
    (
      attr: string,
      evt: React.FormEvent<HTMLSelectElement | HTMLInputElement>,
    ) => {
      // @ts-ignore
      entry[attr] = evt.currentTarget.value;
      forceUpdate();
    },
    [entry, forceUpdate],
  );

  const options = Object.fromEntries(VAR_TYPES.map((v) => [v, v]));

  return (
    <div className="staff-creation__entry--col">
      <div className="staff-creation__entry">
        <Dropdown
          options={options}
          value={entry.type}
          className="staff-creation__dropdown"
          onChange={(evt) => editVar("type", evt)}
        />
        <TextInput
          placeholder="Name"
          className="staff-creation__input"
          onChange={(evt) => editVar("name", evt)}
        />
        {entry.type == "list" ? (
          <TextInput
            className="staff-creation__input"
            type="number"
            placeholder="Max Size"
            onChange={(evt) => editVar("max_size", evt)}
          />
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

function getExprType(expr: SolutionAlgorithmExpr): ExprType {
  if (typeof expr === "object") {
    if (expr === null) {
      return "null";
    } else if (expr.func === "variable") {
      return "variable";
    }
    return "func";
  } else {
    return typeof expr as ExprType;
  }
}

function getDefaultValueForExprType(exprType: ExprType | "expr") {
  switch (exprType) {
    case "func":
      return {
        func: "attribute" as SolutionAlgorithmFuncType,
        args: [""],
      };
    case "variable":
      return {
        func: "variable" as SolutionAlgorithmFuncType,
        args: [0],
      };
    case "string":
      return "";
    case "boolean":
      return false;
    case "number":
      return 0;
    default:
      return null;
  }
}

function transformExprInputArray(inputs: (ReactNode | ReactNode[])[]) {
  const result = [];
  let lowerI = 0;
  for (const [i, input] of inputs.entries()) {
    if (Array.isArray(input)) {
      if (lowerI !== i) {
        result.push(
          <div className="staff-creation__entry">
            {inputs.slice(lowerI, i)}
          </div>,
        );
      }
      result.push(transformExprInputArray(input as ReactNode[]));
      lowerI = i + 1;
    }
  }
  result.push(
    <div className="staff-creation__entry">{inputs.slice(lowerI)}</div>,
  );
  return <div className="staff-creation__entry--col">{result}</div>;
}

function createExprInput(
  expr: SolutionAlgorithmExpr,
  exprType: ExprType,
  variables: SolutionAlgorithmVar[],
  setValue: (expr: SolutionAlgorithmExpr) => void,
  forceUpdate: () => void,
) {
  function setFuncValue(evt: React.FormEvent<HTMLSelectElement>) {
    const func = evt.currentTarget.value as SolutionAlgorithmFuncType;
    setValue({
      func,
      args: EXPR_FUNCTION_ARGS[func].map((info) =>
        getDefaultValueForExprType(info.type),
      ),
    });
  }

  switch (exprType) {
    case "func": {
      // slice to remove variable option (used internally to reference variables)
      const options = Object.fromEntries(
        EXPR_FUNCTIONS.slice(1).map((v) => [v, v]),
      );
      return [
        <Dropdown
          options={options}
          value={(expr as SolutionAlgorithmFuncExpr).func}
          className="staff-creation__dropdown"
          onChange={setFuncValue}
        />,
        createArgsEntry(
          expr as SolutionAlgorithmFuncExpr,
          forceUpdate,
          variables,
        ),
      ];
    }
    case "variable": {
      const options = Object.fromEntries(
        variables.map((v, i) => [v.name, i.toString()]),
      );
      return [
        <Dropdown
          options={options}
          value={(expr as SolutionAlgorithmFuncExpr).args[0]!.toString()}
          className="staff-creation__dropdown"
          onChange={(evt) =>
            setValue({
              ...(expr as SolutionAlgorithmFuncExpr),
              args: [parseInt(evt.currentTarget.value)],
            })
          }
        />,
        "",
      ];
    }
    case "string": {
      return [
        <TextInput
          placeholder="Value"
          className="staff-creation__input"
          value={expr}
          onChange={(evt) => setValue(evt.currentTarget.value)}
        />,
      ];
    }
    case "number": {
      return [
        <TextInput
          placeholder="Value"
          type="number"
          className="staff-creation__input"
          value={expr}
          onChange={(evt) => setValue(parseInt(evt.currentTarget.value))}
        />,
      ];
    }
    case "boolean": {
      return [
        <CustomCheckbox
          value={expr as boolean}
          setValue={(value) => setValue(value)}
        />,
      ];
    }
    case "null": {
      return [""];
    }
  }
}

function createFreeExprInput(
  expr: SolutionAlgorithmExpr,
  variables: SolutionAlgorithmVar[],
  setValue: (expr: SolutionAlgorithmExpr) => void,
  forceUpdate: () => void,
) {
  const exprType = getExprType(expr);
  const editExprType = (newType: ExprType) => {
    setValue(getDefaultValueForExprType(newType));
  };

  const exprInput = createExprInput(
    expr,
    exprType,
    variables,
    setValue,
    forceUpdate,
  );
  return [
    <Dropdown
      options={{
        Function: "func",
        String: "string",
        Number: "number",
        Boolean: "boolean",
        Variable: "variable",
        Null: "null",
      }}
      value={exprType}
      className="staff-creation__dropdown"
      onChange={(evt) => editExprType(evt.currentTarget.value as ExprType)}
    />,
    // @ts-ignore
  ].concat(exprInput);
}

function NamedExprEntry({
  entry,
  forceUpdate,
  variables,
}: {
  entry: SolutionAlgorithmNamedExpr;
  forceUpdate: () => void;
  variables: SolutionAlgorithmVar[];
}) {
  const setExprValue = useCallback((value: SolutionAlgorithmExpr) => {
    entry.value = value;
    forceUpdate();
  }, []);
  const exprInputs = createFreeExprInput(
    entry.value,
    variables,
    setExprValue,
    forceUpdate,
  );

  const editName = useCallback(
    (value: any) => {
      // @ts-ignore
      entry.name = value;
      forceUpdate();
    },
    [entry, forceUpdate],
  );

  return transformExprInputArray(
    [
      <TextInput
        placeholder="Name"
        className="staff-creation__input"
        onChange={(evt) => editName(evt.currentTarget.value)}
      />,
    ].concat(exprInputs),
  );
}

function ValidationEntry({
  entry,
  forceUpdate,
  expressions,
  variables,
}: {
  entry: SolutionAlgorithmValidation;
  forceUpdate: () => void;
  expressions: SolutionAlgorithmNamedExpr[];
  variables: SolutionAlgorithmVar[];
}) {
  const namedExpressions = expressions.map((expr, idx) => [
    expr.name,
    `e-${idx}`,
  ]);
  const vars = variables.map((v, idx) => [v.name, `v-${idx}`]);
  const options = Object.fromEntries(vars.concat(namedExpressions));

  const setAssertion = useCallback(
    (expr: SolutionAlgorithmExpr) => {
      entry.assertion = expr;
      forceUpdate();
    },
    [entry],
  );
  const exprInputs = createFreeExprInput(
    entry.assertion,
    variables,
    setAssertion,
    forceUpdate,
  );

  const editVal = useCallback(
    (evt: React.FormEvent<HTMLSelectElement>) => {
      const [indexType, index] = evt.currentTarget.value.split("-");
      entry.index = parseInt(index);
      entry.indexType = indexType === "v" ? "variable" : "expr";
      forceUpdate();
    },
    [entry, forceUpdate],
  );

  return transformExprInputArray(
    [
      <Dropdown
        options={options}
        value={(entry.indexType === "variable" ? "v" : "e") + `-${entry.index}`}
        className="staff-creation__dropdown"
        onChange={editVal}
      />,
      <p className="staff-creation__entry-subtitle">=</p>,
    ].concat(exprInputs),
  );
}

function createArgsEntry(
  expr: SolutionAlgorithmFuncExpr,
  forceUpdate: () => void,
  variables: SolutionAlgorithmVar[],
): ReactNode[] {
  const argInfo = EXPR_FUNCTION_ARGS[expr.func];

  const setArgValue = (index: number, value: SolutionAlgorithmExpr) => {
    expr.args = expr.args
      .slice(0, index)
      .concat([value])
      .concat(expr.args.slice(index + 1));
    forceUpdate();
  };

  const result = [];
  for (const [i, info] of argInfo.entries()) {
    const subtitle = (
      <p className="staff-creation__entry-subtitle">{info.descriptor}</p>
    );
    if (info.type === "expr") {
      result.push(
        subtitle,
        createFreeExprInput(
          expr.args[i],
          variables,
          (value) => setArgValue(i, value),
          forceUpdate,
        ),
      );
    } else {
      result.push(
        subtitle,
        createExprInput(
          expr.args[i],
          info.type as ExprType,
          variables,
          (value) => setArgValue(i, value),
          forceUpdate,
        ),
      );
    }
  }
  return result;
}
