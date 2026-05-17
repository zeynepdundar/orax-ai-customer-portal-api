import path from "path";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import i18nextMiddleware from "i18next-http-middleware";

import { configureHandlebars } from "./config/handlebars";
import { initI18n, i18n } from "./config/i18n";
import { attachLocals } from "./middleware/locals";

import indexRouter from "./routes/index";
import authRouter from "./routes/auth";
import dashboardRouter from "./routes/dashboard";
import inventoryRouter from "./routes/inventory";
import wareviewRouter from "./routes/wareview";
import inboundRouter from "./routes/inbound-orders";
import outboundRouter from "./routes/outbound-orders";
import reportsRouter from "./routes/reports";
import materialsRouter from "./routes/materials";
import customersRouter from "./routes/customers";
import settingsRouter from "./routes/settings";

declare module "express-session" {
  interface SessionData {
    isLoggedIn?: boolean;
    user?: { name: string; email: string };
    sidebarOpen?: boolean;
  }
}

export async function createApp(): Promise<Application> {
  await initI18n();

  const app = express();

  // View engine
  configureHandlebars(app);

  // Core middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "orax-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // i18n: detects locale from ?lng query, cookie, header, or fallback
  app.use(i18nextMiddleware.handle(i18n));

  // Static assets — serve compiled CSS, JS, images
  app.use(express.static(path.join(__dirname, "public")));

  // Make t(), locale, currentPath, session available to every view
  app.use(attachLocals);

  // Routes
  app.use("/", indexRouter);
  app.use("/", authRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/inventory", inventoryRouter);
  app.use("/wareview", wareviewRouter);
  app.use("/inbound-orders", inboundRouter);
  app.use("/outbound-orders", outboundRouter);
  app.use("/reports", reportsRouter);
  app.use("/materials", materialsRouter);
  app.use("/customers", customersRouter);
  app.use("/settings", settingsRouter);

  // Healthcheck
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "Orax AI Customer Portal" });
  });

  // 404
  app.use((req: Request, res: Response) => {
    res.status(404).render("pages/404", { layout: "app", title: "Not Found" });
  });

  // Error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).render("pages/500", {
      layout: "app",
      title: "Server Error",
      error: process.env.NODE_ENV === "production" ? null : err.message,
    });
  });

  return app;
}
