import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { meQuery } from "@/lib/queries";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQuery());
    if (!me.user) {
      throw redirect({
        to: "/login",
        search: { next: location.href },
      });
    }
    return { user: me.user };
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
