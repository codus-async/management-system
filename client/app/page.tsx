import { DemoForm } from "@/components/demo-form";
import { StateShowcase } from "@/components/state-showcase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Design system foundation
        </h1>
        <p className="text-muted-foreground">
          Tokens, the shell, and the base components every screen builds on.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Demo form</CardTitle>
            <CardDescription>
              React Hook Form and Zod 4 over the Field primitive. Submit it
              empty to see the errors and where focus lands.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DemoForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>State patterns</CardTitle>
            <CardDescription>
              The shared loading, empty, and error treatments, plus a table that
              uses tabular figures for numbers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StateShowcase />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
