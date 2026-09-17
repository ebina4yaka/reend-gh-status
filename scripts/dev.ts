const api = Bun.spawn(["bun", "run", "dev:api"], { stdio: ["inherit", "inherit", "inherit"] });
const web = Bun.spawn(["bun", "run", "dev:web"], { stdio: ["inherit", "inherit", "inherit"] });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    api.kill(signal);
    web.kill(signal);
  });
}

await Promise.all([api.exited, web.exited]);
