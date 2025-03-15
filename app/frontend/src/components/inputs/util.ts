type AnyDict = { [_k: string]: any };

export function splitProps(
  props: AnyDict,
  elementDefaults: AnyDict,
  otherDefaults: AnyDict,
): [AnyDict, AnyDict] {
  const elementProps: AnyDict = {};
  const otherProps: AnyDict = {};

  for (const [k, v] of Object.entries(props)) {
    if (k in elementDefaults) {
      elementProps[k] = v;
    } else if (k in otherDefaults) {
      otherProps[k] = v;
    } else {
      elementProps[k] = v;
    }
  }

  for (const [k, v] of Object.entries(elementDefaults)) {
    if (!(k in elementProps)) {
      elementProps[k] = v;
    }
  }

  for (const [k, v] of Object.entries(otherDefaults)) {
    if (!(k in otherProps)) {
      otherProps[k] = v;
    }
  }

  return [elementProps, otherProps];
}
