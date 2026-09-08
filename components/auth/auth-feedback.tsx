export type AuthFeedbackState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type AuthFeedbackProps = {
  status: AuthFeedbackState;
};

export function AuthFeedback({ status }: AuthFeedbackProps) {
  if (status.kind !== "success" && status.kind !== "error") {
    return null;
  }

  return (
    <p
      className={`rounded-control border px-3 py-2.5 text-xs leading-5 ${
        status.kind === "success"
          ? "border-success/20 bg-success/5 text-success"
          : "border-danger/20 bg-danger/5 text-danger"
      }`}
      role="status"
    >
      {status.message}
    </p>
  );
}
