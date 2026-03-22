export function PrivacyNotice() {
  return (
    <div className="mt-6 max-w-sm text-center text-sm text-muted-foreground space-y-2">
      <p>
        This app requires your Steam profile and game details to be set to{" "}
        <strong>Public</strong>.
      </p>
      <p>
        If your library appears empty after login, please update your{" "}
        <a
          href="https://steamcommunity.com/my/edit/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          Steam Privacy Settings
        </a>{" "}
        and try again.
      </p>
    </div>
  );
}
