import { Helmet } from "react-helmet";
import React, {
  JSX,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  makeBlankSolutionAlgorithm,
  SolutionAlgorithmData,
  compileCode,
  HIGHLIGHT_COLORS,
  makeBlankVar,
  makeBlankVal,
  makeBlankNamedExpr,
  SolutionAlgorithmNamedExpr,
  SolutionAlgorithmVar,
  SolutionAlgorithmExpr,
  SolutionAlgorithmValidation,
  VAR_TYPES,
} from "util/solutionAlgorithm.ts";
import TextInput from "components/inputs/TextInput.tsx";
import Dropdown from "components/inputs/Dropdown.tsx";
import { IoIosAddCircle } from "react-icons/io";
import Checkbox from "components/inputs/Checkbox.tsx";
import Button from "components/inputs/Button.tsx";
import TextArea from "components/inputs/TextArea.tsx";
import {
  useCreateAchievement,
  useEditAchievement,
  useGetAlgorithmDocs,
} from "api/query.ts";
import {
  StaffAchievementType,
  TAG_DESCRIPTIONS,
} from "api/types/AchievementType.ts";
import { cleanTags, interweavingPush } from "util/helperFunctions.ts";
import classNames from "classnames";
// @ts-ignore
import getCaretCoordinates from "textarea-caret";
import {
  AlgorithmDocsType,
  AlgorithmFuncDocType,
} from "api/types/AlgorithmDocsType.ts";
import Select from "react-select";

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

type AchievementPayloadType = Omit<CompactAchievementPayloadType, "tags"> & {
  mode: string;
  tags: string[];
};

function makeDefaultPayload(): AchievementPayloadType {
  return {
    id: null,
    name: "",
    description: "",
    solution: "",
    tags: [],
    beatmaps: [],
    solutionAlgorithm: makeBlankSolutionAlgorithm(),
    algorithmEnabled: false,
    mode: "any",
  };
}

// return mode and actual tags
function parseModeAndTags(tags: string): [string, string] {
  const parsedTags = [];
  let mode = "any";
  for (const tag of cleanTags(tags)) {
    // this is only a client-side tag
    if (tag === "playtestable") {
      continue;
    }

    if (tag.startsWith("mode-")) {
      mode = tag;
    } else {
      parsedTags.push(tag);
    }
  }

  return [parsedTags.join(","), mode];
}

function parseTagsString(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}

function makeAchievementPayload(
  achievement: StaffAchievementType,
): AchievementPayloadType {
  const [tags, mode] = parseModeAndTags(achievement.tags);
  return {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    solution: achievement.solution,
    tags: parseTagsString(tags),
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
    tags: parseTagsString(tags),
    mode,
  };
}

function convertToCompactPayload(
  payload: AchievementPayloadType,
): CompactAchievementPayloadType {
  let [cleanTags, _] = parseModeAndTags(payload.tags.join(","));
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
  algorithmReq: ReturnType<typeof useGetAlgorithmDocs>;
};

class CreationViewComponent extends React.Component<ViewProps> {
  private payload: AchievementPayloadType;
  private timeoutId: number | null = null;
  private changeNote = "";
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

  save() {
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
  }

  forceUpdate() {
    this.save();
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

  private updateExpr(i: number, newData: Partial<SolutionAlgorithmNamedExpr>) {
    const algorithm = this.payload.solutionAlgorithm;
    algorithm.exprs = algorithm.exprs
      .slice(0, i)
      .concat([{ ...algorithm.exprs[i], ...newData }])
      .concat(algorithm.exprs.slice(i + 1));
    this.save();
  }

  private removeVal(i: number) {
    const algorithm = this.payload.solutionAlgorithm;
    algorithm.validation = algorithm.validation
      .slice(0, i)
      .concat(algorithm.validation.slice(i + 1));

    this.forceUpdate();
  }

  private editAchievement<K extends keyof AchievementPayloadType>(
    attr: K,
    value: AchievementPayloadType[K],
  ) {
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
      change_note: this.changeNote.trim(),
    };
  }

  private saveAchievement() {
    if (this.state.saving) {
      return;
    }
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

  private resetToDefault(keepId: boolean) {
    const achievementId = keepId ? this.payload.id : null;
    this.payload = makeDefaultPayload();
    this.payload.id = achievementId;
    this.forceUpdate();
  }

  private getAlgorithmType() {
    return this.payload.tags.includes("password") ? "password" : "score";
  }

  render() {
    let docsElm;
    if (this.props.algorithmReq.isLoading) {
      docsElm = <h2>Loading...</h2>;
    } else if (this.props.algorithmReq.data === undefined) {
      docsElm = <h2>Failed to load</h2>;
    } else {
      // variable func is an "internal" func
      docsElm = this.props.algorithmReq.data[this.getAlgorithmType()]
        .filter((func) => func.name !== "variable")
        .map((func) => <FunctionDoc key={func.name} doc={func} />);
    }

    return (
      <>
        <Helmet>
          <title>CTA - Staff Creation</title>
        </Helmet>
        <div className="staff-creation__page">
          {this.payload.algorithmEnabled ? (
            <div className="staff-creation__page-col docs">
              <h2 className="staff-creation__section-header-text">
                Function Docs
              </h2>
              {docsElm}
            </div>
          ) : (
            ""
          )}
          <div className="staff-creation__page-col">
            {this.payload.id !== null ? (
              <>
                <h2 className="staff-creation__section-header-text">
                  (Currently editing an achievement)
                </h2>
                <Button
                  children="Stop editing"
                  onClick={() => this.resetToDefault(false)}
                />
              </>
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
            {this.payload.id !== null ? (
              <TextArea
                placeholder="Change note for this edit"
                className="staff-creation__input"
                value={this.changeNote}
                setValue={(value) => {
                  this.changeNote = value;
                  this.forceUpdate();
                }}
              />
            ) : (
              ""
            )}
            <Select
              isMulti
              name="tags"
              options={Object.keys(TAG_DESCRIPTIONS).map((tag) => ({
                label: tag,
                value: tag,
              }))}
              unstyled
              className="staff-creation__multi-select"
              classNamePrefix="staff-creation__multi-select"
              onChange={(value) =>
                this.editAchievement(
                  "tags",
                  value.map((item) => item.value),
                )
              }
              value={this.payload.tags.map((tag) => ({
                label: tag,
                value: tag,
              }))}
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
                          updateExpr={(
                            newData: Partial<SolutionAlgorithmNamedExpr>,
                          ) => this.updateExpr(i, newData)}
                          variables={this.payload.solutionAlgorithm.vars}
                          docs={this.props.algorithmReq.data}
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
                      <div className="staff-creation__remove-holder" key={i}>
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
            <div className="staff-creation__entry">
              <Button
                holdToUse={true}
                unavailable={this.state.saving}
                children="Submit"
                className="staff-creation__input"
                onClick={() => this.saveAchievement()}
              />
              <Button
                holdToUse={true}
                caution={true}
                children="Reset to default"
                className="staff-creation__input"
                onClick={() => this.resetToDefault(true)}
              />
            </div>
          </div>
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
  const algorithmReq = useGetAlgorithmDocs();
  return (
    <CreationViewComponent
      achievement={achievement}
      createAchievement={createAchievement}
      editAchievement={editAchievement}
      setView={setView}
      algorithmReq={algorithmReq}
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

function isValidFuncChar(char: string) {
  const code = char.charCodeAt(0);
  return (
    (code > 47 && code < 58) || // numeric (0-9)
    (code > 64 && code < 91) || // upper alpha (A-Z)
    (code > 96 && code < 123) || // lower alpha (a-z)
    char === "_"
  );
}

function CodeEditor({
  value,
  setValue,
  onCompile,
  docs,
}: {
  value: string;
  setValue: (value: string) => void;
  onCompile: (compilation: SolutionAlgorithmExpr) => void;
  docs: AlgorithmDocsType | undefined;
}) {
  const [autofillPos, setAutofillPos] = useState<null | [number, number]>(null);
  const [autofillValues, setAutofillValues] = useState<string[]>([]);

  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback(() => {
    if (taRef.current !== null) {
      taRef.current.style.height = "auto";
      taRef.current.style.height =
        Math.min(Math.max(40, taRef.current.scrollHeight), 600) + "px";
    }
  }, [taRef.current]);

  const onChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      // set contents of autofill container
      let phrase = null;
      for (let i = evt.target.selectionEnd - 1; i > 0; i--) {
        const c = evt.target.value[i];
        if (!isValidFuncChar(c)) {
          phrase = evt.target.value
            .substring(i + 1, evt.target.selectionEnd)
            .toLowerCase();
          break;
        }
      }
      if (phrase === null) {
        phrase = evt.target.value
          .substring(0, evt.target.selectionEnd)
          .toLowerCase();
      }
      let matches: string[] = [];
      if (phrase.length > 0) {
        matches = docs!.score
          .filter((func) => func.name.toLowerCase().startsWith(phrase))
          .map((func) => func.name);
      }
      setAutofillValues(matches);

      // set position of autofill container (if we have any matches)
      if (matches.length > 0) {
        const caret = getCaretCoordinates(evt.target, evt.target.selectionEnd);
        setAutofillPos([Math.max(0, caret.left - 16), caret.top + 20]);
      } else {
        setAutofillPos(null);
      }

      // adjust height of code container
      setValue(evt.target.value);
      adjustHeight();
    },
    [setValue, docs],
  );

  const validFuncs = useMemo(() => {
    if (docs === undefined) {
      return [];
    }

    return docs.score.map((func) => func.name);
  }, [docs]);

  const highlightedCode = useMemo(() => {
    const [compilation, highlights, success] = compileCode(
      value,
      false,
      validFuncs,
    );
    if (success) {
      onCompile(compilation);
    }
    const elements: (string | JSX.Element)[] = [];

    let lastI = 0;
    for (const highlight of highlights) {
      interweavingPush(
        elements,
        value.substring(lastI, highlight.rng[0]).split("\n"),
        <br />,
      );
      const color = HIGHLIGHT_COLORS[highlight.type];
      // this is kinda goofy but if there are multiple characters inside
      // a single span, then the text in the textarea and div wrap differently.
      // I couldn't find any css settings that fixed it, so this is my solution
      for (let i = highlight.rng[0]; i < highlight.rng[1]; i++) {
        if (value[i] == "\n") {
          elements.push(<br />);
        } else {
          elements.push(
            <span className="staff-creation__input coding" style={{ color }}>
              {value[i]}
            </span>,
          );
        }
      }
      lastI = highlight.rng[1];
    }

    interweavingPush(elements, value.substring(lastI).split("\n"), <br />);

    return elements;
  }, [value, validFuncs]);

  useEffect(() => {
    adjustHeight();
  }, [taRef.current]);

  if (docs === undefined) {
    return <h1>Loading editor...</h1>;
  }

  // positioning for autofill container
  const autofillStyling =
    autofillPos === null
      ? undefined
      : { left: autofillPos[0] + "px", top: autofillPos[1] + "px" };

  return (
    <div className="staff-creation__input coding">
      <div className="staff-creation__input coding-display">
        {...highlightedCode}
      </div>
      <textarea
        ref={taRef}
        spellCheck={false}
        className="staff-creation__input coding"
        onChange={onChange}
        value={value}
      />
      <div
        className={classNames("staff-creation__input coding-autofill", {
          show: autofillStyling !== undefined,
        })}
        style={autofillStyling}
      >
        {autofillValues.map((name) => (
          <div className="staff-creation__autofill-item" key={name}>
            {name}
          </div>
        ))}
      </div>
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

function NamedExprEntry({
  entry,
  forceUpdate,
  variables,
  docs,
  updateExpr,
}: {
  entry: SolutionAlgorithmNamedExpr;
  forceUpdate: () => void;
  variables: SolutionAlgorithmVar[];
  docs: AlgorithmDocsType | undefined;
  updateExpr: (newData: Partial<SolutionAlgorithmNamedExpr>) => void;
}) {
  const [code, setCode] = useState(entry.code ?? "");
  const updateCode = useCallback(
    (value: string) => {
      setCode(value);
      updateExpr({ code: value });
    },
    [setCode, entry],
  );
  const onCompile = useCallback(
    (compilation: SolutionAlgorithmExpr) => {
      updateExpr({ value: compilation });
    },
    [entry],
  );
  const editName = useCallback(
    (value: any) => {
      // @ts-ignore
      updateExpr({ name: value });
      forceUpdate();
    },
    [entry, forceUpdate],
  );

  return (
    <div className="staff-creation__entry--col">
      <TextInput
        value={entry.name}
        placeholder="Label"
        className="staff-creation__input"
        onChange={(evt) => editName(evt.currentTarget.value)}
      />
      <CodeEditor
        value={code}
        setValue={updateCode}
        onCompile={onCompile}
        docs={docs}
      />
    </div>
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
  const namedExpressions = useMemo(
    () => expressions.map((expr, idx) => [expr.name, `e-${idx}`]),
    [expressions],
  );
  const vars = useMemo(
    () => variables.map((v, idx) => [v.name, `v-${idx}`]),
    [variables],
  );
  const options = useMemo(
    () => Object.fromEntries(vars.concat(namedExpressions)),
    [namedExpressions, vars],
  );

  const editVal = useCallback(
    (val: string) => {
      const [indexType, index] = val.split("-");
      entry.index = parseInt(index);
      entry.indexType = indexType === "v" ? "variable" : "expr";
      forceUpdate();
    },
    [entry, forceUpdate],
  );

  useEffect(() => {
    const optionVals = Object.values<string>(options);
    if (entry.index === null && optionVals.length > 0) {
      editVal(optionVals[0]);
    }
  }, [entry.index, options]);

  let value =
    entry.index === null
      ? undefined
      : (entry.indexType === "variable" ? "v" : "e") + `-${entry.index}`;
  return (
    <div className="staff-creation__entry--col">
      <Dropdown
        options={options}
        value={value}
        className="staff-creation__dropdown"
        onChange={(evt) => editVal(evt.currentTarget.value)}
      />
    </div>
  );
}

function FunctionDoc({ doc }: { doc: AlgorithmFuncDocType }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="staff-creation__func-doc">
      <p
        className="staff-creation__func-doc-name"
        onClick={() => setOpen((v) => !v)}
      >
        {doc.name}({doc.args.map((arg) => arg.name).join(", ")})
      </p>
      {open ? (
        <div className="staff-creation__func-doc-details">
          <div className="staff-creation__func-doc-details-indent"></div>
          <div className="staff-creation__func-doc-content">
            <p className="staff-creation__func-doc-description">
              {doc.description}
            </p>
            {doc.args.map((arg) => (
              <p
                key={arg.name}
                className="staff-creation__func-doc-description"
              >
                <b>{arg.name}</b> ({arg.type.join(" | ")}): {arg.description}
              </p>
            ))}
            <p className="staff-creation__func-doc-description">
              <b>Returns:</b> {doc.returns.join(" | ")}
            </p>
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
