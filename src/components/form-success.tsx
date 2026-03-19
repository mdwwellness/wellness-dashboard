"use client";

type FormSuccessProps = {
  message?: string;
};

export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-sm text-green-600" role="status">
      {message}
    </p>
  );
}
