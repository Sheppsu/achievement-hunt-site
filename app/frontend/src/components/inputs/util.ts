type AnyDict = Record<string, any>;

export function splitProps<
  T1 extends Partial<{ [K in keyof T2]: T1[K] }> &
    Partial<{ [K in keyof T3]: T1[K] }>,
  T2 extends AnyDict,
  T3 extends AnyDict,
>(
  props: T1,
  elementDefaults: T2,
  otherDefaults: T3,
): [
  Required<{ [K in keyof T2]: Exclude<T1[K], undefined> }> & AnyDict,
  Required<{ [K in keyof T3]: Exclude<T1[K], undefined> }>,
] {
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

  return [
    elementProps as Required<{ [K in keyof T2]: Exclude<T1[K], undefined> }>,
    otherProps as Required<{ [K in keyof T3]: Exclude<T1[K], undefined> }>,
  ];
}
