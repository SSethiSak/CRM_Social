import { NextResponse } from "next/server";
import { AppError } from "./errors";
import { ZodError } from "zod";

export function handleError(error: unknown) {
  console.error("Error:", error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation error",
        details: error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // Custom app errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Prisma errors
  if (error instanceof Error && error.name.startsWith("Prisma")) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Default error
  const message =
    error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
