{
  description = "reend-gh-status — HUD-styled GitHub statistics terminal (Bun + Elysia + Cloudflare Workers)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    # bun overlay that tracks the latest upstream release (oven-sh/bun's own
    # flake only exposes a devShell, not a package/overlay). Adds `pkgs.bun-bin`
    # (`bun-bin.latest`), updated every 12h by the overlay's CI.
    bun = {
      url = "github:so1ve/js-toolchain-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      bun,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system}.extend bun.overlays.default;
        bun-bin = pkgs.bun-bin.latest;
      in
      {
        packages.default = pkgs.runCommand "reend-gh-status-toolchain" {
          nativeBuildInputs = [ pkgs.makeWrapper ];
        } ''
          mkdir -p "$out/bin"
          for dir in ${bun-bin}/bin ${pkgs.nodejs}/bin ${pkgs.git}/bin ${pkgs.openssl}/bin; do
            cp -s "$dir"/* "$out/bin/"
          done
        '';

        devShells.default = pkgs.mkShell {
          packages = [
            bun-bin
            pkgs.nodejs # compatibility for tools expecting node
            pkgs.git
            pkgs.openssl # openssl rand -hex 32 などの生成用
          ];
          shellHook = ''
            echo "reend-gh-status dev shell: bun $(bun --version)"
            [ -d node_modules ] || echo "run 'bun install' first"
            git config core.hooksPath .githooks
          '';
        };
      }
    );
}
