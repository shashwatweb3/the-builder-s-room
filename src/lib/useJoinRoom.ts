import { useNavigate, useRouterState } from "@tanstack/react-router";

/** Scroll to the join section on the current page, or land on home first. */
export function useJoinRoom() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return () => {
    const scroll = () =>
      document.getElementById("join")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (pathname === "/") {
      scroll();
      return;
    }
    void navigate({ to: "/" });
    window.setTimeout(scroll, 160);
  };
}
