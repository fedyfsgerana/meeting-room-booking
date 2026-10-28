export type ActionResult<TField extends string = string> =
  | { ok: true; message?: string; id?: number }
  | {
      ok: false;
      message?: string;
      fieldErrors?: Partial<Record<TField, string>>;
    };

export function fieldErrorsFrom<TField extends string>(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
) {
  const errors: Partial<Record<TField, string>> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors))
      errors[field as TField] = issue.message;
  }
  return errors;
}
