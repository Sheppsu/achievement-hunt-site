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
import Button from "components/inputs/Button.tsx";
import TextArea from "components/inputs/TextArea.tsx";
import { useCreateAchievement, useEditAchievement } from "api/query.ts";
import { StaffAchievementType } from "api/types/AchievementType.ts";
import { cleanTags } from "util/helperFunctions.ts";

const EXPR_TYPES = [
  "func",
  "string",
  "number",
  "boolean",
  "variable",
  "null",
] as const;
type ExprType = (typeof EXPR_TYPES)[number];

type CompactAchievementPayloadType = {
  id: number | null;
  name: string;
  description: string;
  solution: string;
  tags: string;
  beatmaps: {
    id: number;
    hide: boolean;
  }[];
  solutionAlgorithm: SolutionAlgorithmData;
  algorithmEnabled: boolean;
};

type AchievementPayloadType = CompactAchievementPayloadType & {
  mode: string;
};

function makeDefaultPayload(): AchievementPayloadType {
  return {
    id: null,
    name: "",
    description: "",
    solution: "",
    tags: "",
    beatmaps: [],
    solutionAlgorithm: makeBlankSolutionAlgorithm(),
    algorithmEnabled: false,
    mode: "any",
  };
}

function parseModeAndTags(tags: string): [string, string] {
  const parsedTags = [];
  let mode = "any";
  for (const tag of cleanTags(tags)) {
    if (tag.startsWith("mode-")) {
      mode = tag;
    } else {
      parsedTags.push(tag);
    }
  }

  return [parsedTags.join(", "), mode];
}

function makeAchievementPayload(achievement: StaffAchievementType) {
  const [tags, mode] = parseModeAndTags(achievement.tags);
  return {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    solution: achievement.solution,
    tags,
    beatmaps: achievement.beatmaps.map((item) => ({
      id: item.info.id,
      hide: item.hide,
    })),
    solutionAlgorithm: achievement.solution_algorithm,
    algorithmEnabled: achievement.algorithm_enabled,
    mode,
  };
}

function parseCompactAchievementPayload(
  payload: CompactAchievementPayloadType,
): AchievementPayloadType {
  const [tags, mode] = parseModeAndTags(payload.tags);
  return {
    ...payload,
    tags,
    mode,
  };
}

function convertToCompactPayload(
  payload: AchievementPayloadType,
): CompactAchievementPayloadType {
  let [cleanTags, _] = parseModeAndTags(payload.tags);
  if (payload.mode !== "any") {
    cleanTags = cleanTags + "," + payload.mode;
  }
  return {
    ...payload,
    tags: cleanTags,
  };
}

type ViewProps = {
  createAchievement: ReturnType<typeof useCreateAchievement>;
  editAchievement: ReturnType<typeof useEditAchievement> | null;
  achievement?: StaffAchievementType;
  setView: (value: any) => void;
};

class CreationViewComponent extends React.Component<ViewProps> {
  private readonly payload: AchievementPayloadType;
  private timeoutId: number | null = null;
  state = {
    saving: false,
  };

  constructor(props: ViewProps) {
    super(props);

    if (this.props.achievement === undefined) {
      let stored = localStorage.getItem("savedCreationData");
      const saveData: AchievementPayloadType =
        stored === null
          ? makeDefaultPayload()
          : parseCompactAchievementPayload(JSON.parse(stored));
      if (saveData.solutionAlgorithm === null) {
        saveData.solutionAlgorithm = makeBlankSolutionAlgorithm();
      }
      this.payload = saveData;
    } else {
      this.payload = makeAchievementPayload(this.props.achievement);
    }
  }

  forceUpdate() {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      localStorage.setItem(
        "savedCreationData",
        JSON.stringify(convertToCompactPayload(this.payload)),
      );
    }, 500);

    super.forceUpdate();
  }

  private addVar() {
    this.payload.solutionAlgorithm.vars.push(makeBlankVar());
    this.forceUpdate();
  }

  private addExpr() {
    this.payload.solutionAlgorithm.exprs.push(makeBlankNamedExpr());
    this.forceUpdate();
  }

  private addVal() {
    this.payload.solutionAlgorithm.validation.push(makeBlankVal());
    this.forceUpdate();
  }

  private removeVar(i: number) {
    const algorithm = this.payload.solutionAlgorithm;
    algorithm.vars = algorithm.vars
      .slice(0, i)
      .concat(algorithm.vars.slice(i + 1));

    function fixExpr(expr: SolutionAlgorithmExpr) {
      const exprType = getExprType(expr);
      if (exprType === "variable") {
        expr = expr as SolutionAlgorithmFuncExpr;
        const refI = expr.args[0] as number | null;
        if (refI === null) {
          return;
        }
        if (refI === i) {
          expr.args = [null];
        } else if (refI > i) {
          expr.args = [refI - 1];
        }
      } else if (exprType === "func") {
        for (const arg of (expr as SolutionAlgorithmFuncExpr).args) {
          fixExpr(arg);
        }
      }
    }

    for (const expr of algorithm.exprs) {
      fixExpr(expr.value);
    }
    for (const val of algorithm.validation) {
      fixExpr(val.assertion);
      if (val.indexType === "variable" && val.index !== null) {
        if (val.index === i) {
          val.index = null;
        } else if (val.index > i) {
          val.index -= 1;
        }
      }
    }

    this.forceUpdate();
  }

  private removeExpr(i: number) {
    const algorithm = this.payload.solutionAlgorithm;
    algorithm.exprs = algorithm.exprs
      .slice(0, i)
      .concat(algorithm.exprs.slice(i + 1));

    for (const val of algorithm.validation) {
      if (val.indexType == "expr" && val.index !== null) {
        if (val.index === i) {
          val.index = null;
        } else if (val.index > i) {
          val.index -= 1;
        }
      }
    }

    this.forceUpdate();
  }

  private removeVal(i: number) {
    const algorithm = this.payload.solutionAlgorithm;
    algorithm.validation = algorithm.validation
      .slice(0, 1)
      .concat(algorithm.validation.slice(i + 1));

    this.forceUpdate();
  }

  private editAchievement(attr: string, value: any) {
    // @ts-ignore
    this.payload[attr] = value;
    this.forceUpdate();
  }

  private editBeatmapId(
    beatmap: { id: number },
    evt: React.ChangeEvent<HTMLInputElement>,
  ) {
    const newValue = evt.target.value;
    const numValue = newValue.trim().length === 0 ? 0 : parseInt(newValue);
    if (isNaN(numValue)) {
      evt.preventDefault();
      return;
    }
    beatmap.id = numValue;

    this.forceUpdate();
  }

  private addBeatmap() {
    this.payload.beatmaps.push({
      id: 0,
      hide: false,
    });
    this.forceUpdate();
  }

  private removeBeatmap(i: number) {
    this.payload.beatmaps = this.payload.beatmaps
      .slice(0, i)
      .concat(this.payload.beatmaps.slice(i + 1));
    this.forceUpdate();
  }

  // payload sent to the server
  private createFinalPayload() {
    const payload = convertToCompactPayload(this.payload);
    return {
      name: payload.name,
      description: payload.description,
      solution: payload.solution,
      tags: payload.tags,
      beatmaps: payload.beatmaps,
      solution_algorithm: payload.solutionAlgorithm,
      algorithm_enabled: payload.algorithmEnabled,
    };
  }

  private saveAchievement() {
    this.setState({
      saving: true,
    });

    // editAchievement should be guaranteed defined when id is not null
    const saveAchievement =
      this.payload.id === null
        ? this.props.createAchievement
        : this.props.editAchievement;
    saveAchievement!.mutate(this.createFinalPayload(), {
      onSuccess: (_data) => {
        localStorage.removeItem("savedCreationData");
        this.props.setView({ name: "achievements", props: {} });
      },
      onSettled: () => {
        this.setState({
          saving: false,
        });
      },
    });
  }

  render() {
    return (
      <>
        <Helmet>
          <title>CTA - Staff Creation</title>
        </Helmet>
        <div className="staff-creation__page">
          {this.payload.id !== null ? (
            <h2 className="staff-creation__section-header-text">
              (Currently editing an achievement)
            </h2>
          ) : (
            ""
          )}
          <h2 className="staff-creation__section-header-text">
            Achievement Info
          </h2>
          <TextInput
            placeholder="Title"
            className="staff-creation__input extended"
            value={this.payload.name}
            onChange={(evt) =>
              this.editAchievement("name", evt.currentTarget.value)
            }
          />
          <TextArea
            placeholder="Description"
            className="staff-creation__input"
            value={this.payload.description}
            setValue={(value) => this.editAchievement("description", value)}
          />
          <TextArea
            placeholder="Solution explanation"
            className="staff-creation__input"
            value={this.payload.solution}
            setValue={(value) => this.editAchievement("solution", value)}
          />
          <TextInput
            placeholder="Comma-separated tags"
            className="staff-creation__input extended"
            value={this.payload.tags}
            onChange={(evt) =>
              this.editAchievement("tags", evt.currentTarget.value)
            }
          />
          <div className="staff-creation__entry">
            <p>Mode:</p>
            <Dropdown
              className="staff-creation__input"
              options={{
                Any: "any",
                Standard: "mode-o",
                Taiko: "mode-t",
                Mania: "mode-m",
                Catch: "mode-f",
              }}
              onChange={(e: React.FormEvent<HTMLSelectElement>) => {
                this.editAchievement("mode", e.currentTarget.value);
              }}
              value={this.payload.mode}
            />
          </div>

          <div className="staff-creation__entry">
            <CustomCheckbox
              label="Enable solution algorithm"
              value={this.payload.algorithmEnabled}
              setValue={(value) =>
                this.editAchievement("algorithmEnabled", value)
              }
            />
          </div>
          <div className="staff-creation__section-section">
            <div className="staff-creation__section-header">
              <h2 className="staff-creation__section-header-text">
                Attached Beatmaps
              </h2>
              <IoIosAddCircle
                className="clickable"
                size={32}
                onClick={() => this.addBeatmap()}
              />
            </div>
            <div className="staff-creation__section-container">
              {this.payload.beatmaps.map((beatmap, i) => (
                <div className="staff-creation__remove-holder">
                  <Button
                    children="Remove"
                    holdToUse={true}
                    caution={true}
                    onClick={() => this.removeBeatmap(i)}
                  />
                  <div className="staff-creation__entry--col">
                    <div className="staff-creation__entry">
                      <TextInput
                        placeholder="Beatmap id"
                        className="staff-creation__input"
                        value={beatmap.id}
                        onChange={(evt) => this.editBeatmapId(beatmap, evt)}
                      />
                      <CustomCheckbox
                        label="Secret"
                        value={beatmap.hide}
                        setValue={(value) => {
                          beatmap.hide = value;
                          this.forceUpdate();
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {this.payload.algorithmEnabled ? (
            <>
              <div className="staff-creation__section">
                <div className="staff-creation__section-header">
                  <h2 className="staff-creation__section-header-text">
                    Variables
                  </h2>
                  <IoIosAddCircle
                    className="clickable"
                    size={32}
                    onClick={() => this.addVar()}
                  />
                </div>
                <div className="staff-creation__section-container">
                  {this.payload.solutionAlgorithm.vars.map((v, i) => (
                    <div className="staff-creation__remove-holder">
                      <Button
                        children="Remove"
                        holdToUse={true}
                        caution={true}
                        onClick={() => this.removeVar(i)}
                      />
                      <VarEntry
                        entry={v}
                        forceUpdate={() => this.forceUpdate()}
                      />
                    </div>
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
                  {this.payload.solutionAlgorithm.exprs.map((e, i) => (
                    <div className="staff-creation__remove-holder">
                      <Button
                        children="Remove"
                        holdToUse={true}
                        caution={true}
                        onClick={() => this.removeExpr(i)}
                      />
                      <NamedExprEntry
                        entry={e}
                        forceUpdate={() => this.forceUpdate()}
                        variables={this.payload.solutionAlgorithm.vars}
                      />
                    </div>
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
                  {this.payload.solutionAlgorithm.validation.map((v, i) => (
                    <div className="staff-creation__remove-holder">
                      <Button
                        children="Remove"
                        holdToUse={true}
                        caution={true}
                        onClick={() => this.removeVal(i)}
                      />
                      <ValidationEntry
                        entry={v}
                        forceUpdate={() => this.forceUpdate()}
                        expressions={this.payload.solutionAlgorithm.exprs}
                        variables={this.payload.solutionAlgorithm.vars}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            ""
          )}
          <Button
            holdToUse={true}
            unavailable={this.state.saving}
            children="Submit"
            className="staff-creation__input"
            onClick={() => this.saveAchievement()}
          />
        </div>
      </>
    );
  }
}

function useEditCurrentAchievement(achievement?: StaffAchievementType) {
  if (achievement !== undefined) {
    return useEditAchievement(achievement.id);
  } else {
    const storage = localStorage.getItem("savedCreationData");
    if (storage === null) {
      return null;
    }

    const savedData = parseCompactAchievementPayload(JSON.parse(storage));
    if (savedData.id === null) {
      return null;
    }

    return useEditAchievement(savedData.id);
  }
}

export default function CreationView({
  setView,
  achievement,
}: {
  setView: (value: any) => void;
  achievement?: StaffAchievementType;
}) {
  const createAchievement = useCreateAchievement();
  const editAchievement = useEditCurrentAchievement(achievement);
  return (
    <CreationViewComponent
      achievement={achievement}
      createAchievement={createAchievement}
      editAchievement={editAchievement}
      setView={setView}
    />
  );
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
          value={entry.name}
          placeholder="Name"
          className="staff-creation__input"
          onChange={(evt) => editVar("name", evt)}
        />
        {entry.type == "list" ? (
          <TextInput
            value={entry.max_size}
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
        args: [null],
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
      const args = (expr as SolutionAlgorithmFuncExpr).args;
      const value = args[0] === null ? undefined : args[0].toString();
      return [
        <Dropdown
          options={options}
          value={value}
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
        value={entry.name}
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

  const value =
    entry.index === null
      ? undefined
      : (entry.indexType === "variable" ? "v" : "e") + `-${entry.index}`;
  return transformExprInputArray(
    [
      <Dropdown
        options={options}
        value={value}
        className="staff-creation__dropdown"
        onChange={editVal}
      />,
      <Dropdown
        options={{ "=": "=" }}
        value="="
        className="staff-creation__dropdown"
      />,
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
