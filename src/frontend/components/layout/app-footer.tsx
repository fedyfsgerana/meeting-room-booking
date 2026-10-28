import {
  APP_NAME,
  APP_VERSION,
  DEVELOPER_NAME,
  COPYRIGHT_YEAR,
} from "@/lib/app-info";

export function AppFooter() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <span>
          © {COPYRIGHT_YEAR} {DEVELOPER_NAME}
        </span>
        <span>
          {APP_NAME} versi {APP_VERSION}
        </span>
      </div>
    </footer>
  );
}
