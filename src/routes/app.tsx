import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { meQuery, qk } from "@/lib/queries";
import { safeEnsureQueryData } from "@/lib/safe-loader";
import { EMPTY_ME } from "@/lib/query-fallbacks";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ context, location }) => {
    const me = await safeEnsureQueryData(context.queryClient, {
      queryKey: qk.me,
      queryFn: meQuery().queryFn,
      fallback: EMPTY_ME,
    });
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
