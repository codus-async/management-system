"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Textarea } from "@/components/ui/textarea";

const OWNER_OPTIONS = [
  { value: "ada", label: "Ada Nwosu" },
  { value: "ben", label: "Ben Adeyemi" },
  { value: "chidi", label: "Chidi Okafor" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

const demoTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the task a title")
    .max(80, "Keep the title under 80 characters"),
  owner: z
    .enum(["", ...OWNER_OPTIONS.map((option) => option.value)], {
      message: "Pick an owner",
    })
    .refine((value) => value !== "", { message: "Pick an owner" }),
  due: z.iso.date({ message: "Pick a due date" }),
  priority: z.enum(
    PRIORITY_OPTIONS.map((option) => option.value),
    { message: "Pick a priority" },
  ),
  notes: z.string().max(280, "Keep notes under 280 characters").optional(),
  chase: z.boolean(),
});

type DemoTaskInput = z.input<typeof demoTaskSchema>;
type DemoTaskOutput = z.output<typeof demoTaskSchema>;

const DEFAULT_VALUES: DemoTaskInput = {
  title: "",
  owner: "",
  due: "",
  priority: "medium",
  notes: "",
  chase: false,
};

function fieldIds(name: string) {
  const base = `demo-task-${name}`;
  return {
    input: base,
    label: `${base}-label`,
    description: `${base}-description`,
    error: `${base}-error`,
  };
}

function DemoForm() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<DemoTaskInput, unknown, DemoTaskOutput>({
    resolver: zodResolver(demoTaskSchema),
    defaultValues: DEFAULT_VALUES,
    shouldFocusError: true,
  });

  const onSubmit = handleSubmit(() => {
    toast.add({
      title: "Task drafted",
      description: "Nothing is saved yet. This is the demo form.",
      type: "success",
    });
    reset(DEFAULT_VALUES);
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex w-full max-w-xl flex-col gap-5"
    >
      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => {
          const ids = fieldIds("title");
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={ids.input}>Title</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  id={ids.input}
                  aria-invalid={fieldState.invalid || undefined}
                  aria-describedby={
                    fieldState.invalid ? ids.error : ids.description
                  }
                />
                <FieldDescription id={ids.description}>
                  What has to happen, in one line.
                </FieldDescription>
                <FieldError id={ids.error}>
                  {fieldState.error?.message}
                </FieldError>
              </FieldContent>
            </Field>
          );
        }}
      />

      <Controller
        control={control}
        name="owner"
        render={({ field, fieldState }) => {
          const ids = fieldIds("owner");
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={ids.input}>Owner</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                  name={field.name}
                  disabled={field.disabled}
                >
                  <SelectTrigger
                    id={ids.input}
                    ref={field.ref}
                    aria-invalid={fieldState.invalid || undefined}
                    aria-describedby={
                      fieldState.invalid ? ids.error : undefined
                    }
                    className="w-full"
                  >
                    <SelectValue placeholder="Pick an owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id={ids.error}>
                  {fieldState.error?.message}
                </FieldError>
              </FieldContent>
            </Field>
          );
        }}
      />

      <Controller
        control={control}
        name="due"
        render={({ field, fieldState }) => {
          const ids = fieldIds("due");
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={ids.input}>Due date</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  type="date"
                  id={ids.input}
                  value={field.value ?? ""}
                  aria-invalid={fieldState.invalid || undefined}
                  aria-describedby={fieldState.invalid ? ids.error : undefined}
                />
                <FieldError id={ids.error}>
                  {fieldState.error?.message}
                </FieldError>
              </FieldContent>
            </Field>
          );
        }}
      />

      <Controller
        control={control}
        name="priority"
        render={({ field, fieldState }) => {
          const ids = fieldIds("priority");
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={ids.input}>Priority</FieldLabel>
              <FieldContent>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "medium")}
                  name={field.name}
                  disabled={field.disabled}
                >
                  <SelectTrigger
                    id={ids.input}
                    ref={field.ref}
                    aria-invalid={fieldState.invalid || undefined}
                    aria-describedby={
                      fieldState.invalid ? ids.error : undefined
                    }
                    className="w-full"
                  >
                    <SelectValue placeholder="Pick a priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id={ids.error}>
                  {fieldState.error?.message}
                </FieldError>
              </FieldContent>
            </Field>
          );
        }}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => {
          const ids = fieldIds("notes");
          return (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={ids.input}>Notes</FieldLabel>
              <FieldContent>
                <Textarea
                  {...field}
                  id={ids.input}
                  value={field.value ?? ""}
                  aria-invalid={fieldState.invalid || undefined}
                  aria-describedby={
                    fieldState.invalid ? ids.error : ids.description
                  }
                />
                <FieldDescription id={ids.description}>
                  Optional. Up to 280 characters.
                </FieldDescription>
                <FieldError id={ids.error}>
                  {fieldState.error?.message}
                </FieldError>
              </FieldContent>
            </Field>
          );
        }}
      />

      <Controller
        control={control}
        name="chase"
        render={({ field, fieldState }) => {
          const ids = fieldIds("chase");
          return (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id={ids.input}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                ref={field.ref}
                name={field.name}
                aria-labelledby={ids.label}
                aria-invalid={fieldState.invalid || undefined}
                aria-describedby={fieldState.invalid ? ids.error : undefined}
              />
              <FieldLabel htmlFor={ids.input} id={ids.label}>
                Chase this if there is no reply
              </FieldLabel>
              <FieldError id={ids.error}>
                {fieldState.error?.message}
              </FieldError>
            </Field>
          );
        }}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          Save draft
        </Button>
        <Button type="button" variant="ghost" onClick={() => reset()}>
          Reset
        </Button>
      </div>
    </form>
  );
}

export { DemoForm, demoTaskSchema };
export type { DemoTaskInput, DemoTaskOutput };
