import app from "./app";

const rawPort = process.env["PORT"] || "5000";
const port = Number(rawPort);

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export default app;
