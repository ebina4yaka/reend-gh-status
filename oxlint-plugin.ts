/**
 * Project-specific rules as an ESLint-compatible oxlint JS plugin.
 * Loaded via "jsPlugins" in .oxlintrc.json; rules are referenced as "project/<name>":
 * project/ban-switch, project/ban-let, project/require-const-type-annotation,
 * project/ban-try-catch, project/no-fetch.
 *
 * Eden Fetch の禁止、useEffect の禁止、型アサーションの禁止、複雑度の上限は
 * oxlint 組み込みルール（no-restricted-imports / consistent-type-assertions /
 * complexity）で表現できるため、oxlint.config.ts 側に置く。
 */

interface ReportContext {
  report: (descriptor: { message: string; node: unknown }) => void;
}

const banSwitch: {
  create: (context: ReportContext) => { SwitchStatement: (node: unknown) => void };
  meta: { docs: { description: string } };
} = {
  create: (context: ReportContext): { SwitchStatement: (node: unknown) => void } => ({
    SwitchStatement: (node: unknown): void => {
      context.report({ message: "switch is banned. Use ts-pattern (`match`) instead.", node });
    },
  }),
  meta: {
    docs: { description: "switch is banned. Use ts-pattern (`match`) instead." },
  },
};

const banLet: {
  create: (context: ReportContext) => {
    VariableDeclaration: (node: { kind?: "var" | "let" | "const" }) => void;
  };
  meta: { docs: { description: string } };
} = {
  create: (
    context: ReportContext,
  ): { VariableDeclaration: (node: { kind?: "var" | "let" | "const" }) => void } => ({
    VariableDeclaration: (node: { kind?: "var" | "let" | "const" }): void => {
      if (node.kind === "let") {
        context.report({
          message: "let is banned. Use const — derive new values instead of reassigning.",
          node,
        });
      }
    },
  }),
  meta: {
    docs: { description: "let is banned. Use const — derive new values instead of reassigning." },
  },
};

interface Declarator {
  id?: { type?: string; typeAnnotation?: unknown };
  init?: { type?: string };
}

/** Call/new initializers are exempt: their type is already declared by
 * the callee's (return-type-enforced) signature. Duplicating it (e.g.
 * Drizzle tables, better-auth, valibot schemas, hooks) is pure noise.
 * Destructuring patterns and for-in/of declarators are also skipped. */
function needsTypeAnnotation(declarator: Declarator): boolean {
  if (declarator.id?.type !== "Identifier") {
    return false;
  }
  if (!declarator.init) {
    return false;
  }
  if (declarator.init.type === "CallExpression" || declarator.init.type === "NewExpression") {
    return false;
  }
  return !declarator.id.typeAnnotation;
}

const requireConstTypeAnnotation: {
  create: (context: ReportContext) => {
    VariableDeclaration: (node: {
      declarations?: Declarator[];
      kind?: "var" | "let" | "const";
    }) => void;
  };
  meta: { docs: { description: string } };
} = {
  create: (
    context: ReportContext,
  ): {
    VariableDeclaration: (node: {
      declarations?: Declarator[];
      kind?: "var" | "let" | "const";
    }) => void;
  } => ({
    VariableDeclaration: (node): void => {
      if (node.kind !== "const") {
        return;
      }
      for (const declarator of node.declarations ?? []) {
        if (needsTypeAnnotation(declarator)) {
          context.report({
            message: "const declarations must have an explicit type annotation.",
            node,
          });
        }
      }
    },
  }),
  meta: {
    docs: {
      description:
        "const declarations must have an explicit type annotation (except call/new results, whose type the callee already names).",
    },
  },
};

interface FetchCallee {
  type: string;
  name?: string;
  property?: { name?: string };
}

const noFetch: {
  create: (context: ReportContext) => { CallExpression: (node: { callee: FetchCallee }) => void };
  meta: { docs: { description: string } };
} = {
  create: (
    context: ReportContext,
  ): { CallExpression: (node: { callee: FetchCallee }) => void } => ({
    CallExpression: (node: { callee: FetchCallee }): void => {
      const { callee } = node;
      if (
        (callee.type === "Identifier" && callee.name === "fetch") ||
        (callee.type === "MemberExpression" && callee.property?.name === "fetch")
      ) {
        context.report({
          message:
            "fetch is banned in client code. Use the typed Eden Treaty client from @/lib/api (server-side fetch is allowed).",
          node,
        });
      }
    },
  }),
  meta: {
    docs: {
      description:
        "Raw fetch is banned in client code; use the typed Eden Treaty client from @/lib/api. Server-side fetch is allowed.",
    },
  },
};

const banTryCatch: {
  create: (context: ReportContext) => { TryStatement: (node: unknown) => void };
  meta: { docs: { description: string } };
} = {
  create: (context: ReportContext): { TryStatement: (node: unknown) => void } => ({
    TryStatement: (node: unknown): void => {
      context.report({
        message:
          "try/catch is banned. Model failure with Result (true-myth); wrap throwing APIs at the boundary with Result.tryOrElse.",
        node,
      });
    },
  }),
  meta: {
    docs: { description: "try/catch is banned. Use true-myth Result instead." },
  },
};

interface TypeNode {
  type?: string;
  typeName?: { name?: string };
  // Oxlint serializes TSTypeReference's instantiation as typeArguments;
  // Typescript-eslint names it typeParameters. Accept both.
  typeArguments?: { params?: TypeNode[] };
  typeParameters?: { params?: TypeNode[] };
  types?: TypeNode[];
}

interface FuncNode {
  returnType?: { typeAnnotation?: TypeNode };
}

/** `void`, any union containing `void`, and `Promise<...void...>`. */
function containsVoid(typeNode: TypeNode | ""): boolean {
  if (!typeNode) {
    return false;
  }
  if (typeNode.type === "TSVoidKeyword") {
    return true;
  }
  if (typeNode.type === "TSUnionType") {
    return (typeNode.types ?? []).some(containsVoid);
  }
  if (typeNode.type === "TSTypeReference" && typeNode.typeName?.name === "Promise") {
    const args: { params?: TypeNode[] } = typeNode.typeArguments ?? { params: [] };
    return (args.params ?? []).some(containsVoid);
  }
  return false;
}

const noVoidReturn: {
  create: (context: ReportContext) => {
    ArrowFunctionExpression: (node: FuncNode) => void;
    FunctionDeclaration: (node: FuncNode) => void;
    FunctionExpression: (node: FuncNode) => void;
  };
  meta: { docs: { description: string } };
} = {
  create: (context: ReportContext) => {
    function check(node: FuncNode): void {
      if (containsVoid(node.returnType?.typeAnnotation ?? "")) {
        context.report({
          message:
            "void return type is banned. Return the value the function produces; model failure with Result (true-myth) instead of returning nothing. React effect cleanups are a legitimate exception (disable this rule for that line).",
          node,
        });
      }
    }
    return {
      ArrowFunctionExpression: check,
      FunctionDeclaration: check,
      FunctionExpression: check,
    };
  },
  meta: {
    docs: {
      description:
        "Bans `void`, unions containing `void`, and `Promise<void>` as function return types.",
    },
  },
};

export default {
  meta: { name: "project" },
  rules: {
    "ban-let": banLet,
    "ban-switch": banSwitch,
    "ban-try-catch": banTryCatch,
    "no-fetch": noFetch,
    "no-void-return": noVoidReturn,
    "require-const-type-annotation": requireConstTypeAnnotation,
  },
};
