/**
 * Project-specific rules as an ESLint-compatible oxlint JS plugin.
 * Loaded via "jsPlugins" in .oxlintrc.json; rules are referenced as "project/<name>":
 * project/ban-switch, project/ban-let, project/require-const-type-annotation,
 * project/ban-try-catch, project/no-fetch, project/ban-eden-fetch,
 * project/no-use-effect, project/cognitive-complexity.
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

const banEdenFetch: {
  create: (context: ReportContext) => {
    ImportDeclaration: (node: { source: { value: string } }) => void;
  };
  meta: { docs: { description: string } };
} = {
  create: (
    context: ReportContext,
  ): { ImportDeclaration: (node: { source: { value: string } }) => void } => ({
    ImportDeclaration: (node: { source: { value: string } }): void => {
      if (node.source.value.startsWith("@elysiajs/eden/fetch")) {
        context.report({
          message: "Eden Fetch is banned. Use Eden Treaty (treaty<App> from @elysiajs/eden).",
          node,
        });
      }
    },
  }),
  meta: {
    docs: { description: "Eden Fetch is banned. Use Eden Treaty instead." },
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

interface UseEffectCallee {
  type: string;
  name?: string;
}

const noUseEffect: {
  create: (context: ReportContext) => {
    CallExpression: (node: { callee: UseEffectCallee }) => void;
  };
  meta: { docs: { description: string } };
} = {
  create: (
    context: ReportContext,
  ): { CallExpression: (node: { callee: UseEffectCallee }) => void } => ({
    CallExpression: (node: { callee: UseEffectCallee }): void => {
      const { callee } = node;
      if (callee.type === "Identifier" && callee.name === "useEffect") {
        context.report({
          message:
            "useEffect is discouraged. Derive values during render or handle them in event handlers (react.dev/learn/you-might-not-need-an-effect). Synchronizing with external systems (e.g. URL.revokeObjectURL cleanup) is a legitimate exception — disable this rule for that line.",
          node,
        });
      }
    },
  }),
  meta: {
    docs: {
      description:
        "useEffect is discouraged; derive during render or handle in event handlers. External-system sync is a legitimate exception (disable per line).",
    },
  },
};

// Ponytail: threshold is a constant (edit here), not a rule option —
// Oxlint JS-plugin option plumbing isn't worth it for one number.
const MAX_COGNITIVE_COMPLEXITY: number = 15;

interface AstNode {
  type?: string;
  operator?: string;
  [key: string]: unknown;
}

function isAstNode(value: unknown): boolean {
  return Boolean(value) && typeof value === "object" && typeof (value as AstNode).type === "string";
}

function childNodes(node: unknown): AstNode[] {
  const out: AstNode[] = [];
  for (const value of Object.values(node as Record<string, unknown>)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (isAstNode(item)) {
        out.push(item as AstNode);
      }
    }
  }
  return out;
}

function isFunctionNode(node: AstNode): boolean {
  const type: string = node.type ?? "";
  return (
    type === "FunctionDeclaration" ||
    type === "FunctionExpression" ||
    type === "ArrowFunctionExpression"
  );
}

function isLoopNode(node: AstNode): boolean {
  const type: string = node.type ?? "";
  return (
    type === "ForStatement" ||
    type === "ForInStatement" ||
    type === "ForOfStatement" ||
    type === "WhileStatement" ||
    type === "DoWhileStatement"
  );
}

/** Sonar-style cognitive complexity of a function body, excluding nested
 * functions (they are scored separately). Increments: +1 per if/loop/switch/
 * catch/ternary plus +1 per nesting level (`else if` counts once); +1 per
 * `&&`/`||` sequence and again on operator change.
 * ponytail: `seen` guards against cyclic parent references in the
 * oxlint-provided AST; `""` is the "no previous operator" sentinel because
 * this file bans `undefined`. */
function scoreFunctionBody(body: AstNode): number {
  const seen: WeakSet<object> = new WeakSet<object>();
  function enter(node: AstNode): boolean {
    if (seen.has(node)) {
      return false;
    }
    seen.add(node);
    return true;
  }

  function scoreOf(node: AstNode, nesting: number, prevLogicalOp: string): number {
    if (!enter(node)) {
      return 0;
    }
    if (isFunctionNode(node)) {
      return 0;
    }
    if (node.type === "IfStatement") {
      return ifScore(node, nesting);
    }
    if (isLoopNode(node)) {
      return loopScore(node, nesting);
    }
    if (node.type === "SwitchStatement") {
      return switchScore(node, nesting);
    }
    if (node.type === "CatchClause") {
      return 1 + nesting + scoreOf(node.body as AstNode, nesting + 1, "");
    }
    if (node.type === "ConditionalExpression") {
      return ternaryScore(node, nesting);
    }
    if (node.type === "LogicalExpression") {
      const op: string = node.operator ?? "";
      const increment: number = op === prevLogicalOp ? 0 : 1 + nesting;
      return (
        increment +
        scoreOf(node.left as AstNode, nesting, op) +
        scoreOf(node.right as AstNode, nesting, op)
      );
    }
    return childNodes(node).reduce(
      (sum: number, child: AstNode) => sum + scoreOf(child, nesting, ""),
      0,
    );
  }

  function ifScore(node: AstNode, nesting: number): number {
    // `else if` chains count once each without an extra nesting penalty.
    const alternate: AstNode | "" = node.alternate as AstNode | "";
    const elseScore: number = alternate
      ? scoreOf(alternate, alternate.type === "IfStatement" ? nesting : nesting + 1, "")
      : 0;
    return (
      1 +
      nesting +
      scoreOf(node.test as AstNode, nesting, "") +
      scoreOf(node.consequent as AstNode, nesting + 1, "") +
      elseScore
    );
  }

  function loopScore(node: AstNode, nesting: number): number {
    return (
      1 +
      nesting +
      childNodes(node).reduce(
        (sum: number, child: AstNode) =>
          sum + scoreOf(child, child === node.body ? nesting + 1 : nesting, ""),
        0,
      )
    );
  }

  function switchScore(node: AstNode, nesting: number): number {
    return (
      1 +
      nesting +
      (node.cases as AstNode[]).reduce(
        (sum: number, clause: AstNode) =>
          sum +
          ((clause.consequent ?? []) as AstNode[]).reduce(
            (inner: number, stmt: AstNode) => inner + scoreOf(stmt, nesting + 1, ""),
            0,
          ),
        0,
      )
    );
  }

  function ternaryScore(node: AstNode, nesting: number): number {
    return (
      1 +
      nesting +
      scoreOf(node.test as AstNode, nesting, "") +
      scoreOf(node.consequent as AstNode, nesting + 1, "") +
      scoreOf(node.alternate as AstNode, nesting + 1, "")
    );
  }

  return scoreOf(body, 0, "");
}

const cognitiveComplexityRule: {
  create: (context: ReportContext) => {
    FunctionDeclaration: (node: unknown) => void;
    FunctionExpression: (node: unknown) => void;
    ArrowFunctionExpression: (node: unknown) => void;
  };
  meta: { docs: { description: string } };
} = {
  create: (context: ReportContext) => {
    function check(node: unknown): void {
      const fn: AstNode & { id?: { name?: string }; body?: unknown } = node as AstNode & {
        id?: { name?: string };
        body?: unknown;
      };
      if (!fn.body || typeof fn.body !== "object") {
        return;
      }
      const score: number = scoreFunctionBody(fn.body as AstNode);
      if (score > MAX_COGNITIVE_COMPLEXITY) {
        context.report({
          message: `Function${fn.id?.name ? ` '${fn.id.name}'` : ""} has a cognitive complexity of ${score} (max ${MAX_COGNITIVE_COMPLEXITY}). Extract smaller functions.`,
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
        "Flags functions whose Sonar-style cognitive complexity exceeds the limit; refactor into smaller named functions.",
    },
  },
};

interface TypeAssertionAnnotation {
  type?: string;
  typeName?: { name?: string } | unknown;
}

interface TypeAssertionNode {
  type?: string;
  typeAnnotation?: TypeAssertionAnnotation;
}

const banTypeAssertion: {
  create: (context: ReportContext) => {
    TSAsExpression: (node: TypeAssertionNode) => void;
    TSTypeAssertion: (node: unknown) => void;
  };
  meta: { docs: { description: string } };
} = {
  create: (context: ReportContext) => ({
    TSAsExpression: (node: TypeAssertionNode): void => {
      const ta: TypeAssertionAnnotation = node.typeAnnotation ?? {};
      const typeName: unknown = ta.typeName;
      const name: string =
        typeName && typeof typeName === "object" && "name" in typeName
          ? ((typeName as { name?: string }).name ?? "")
          : "";
      // `as const` is a const assertion, not a type assertion — permit it.
      if (ta.type === "TSTypeReference" && name === "const") {
        return;
      }
      context.report({
        message:
          "Type assertion (`x as T`) is banned. Narrow with a type guard, or assert the value with valibot/Result, instead of casting.",
        node,
      });
    },
    TSTypeAssertion: (node: unknown): void => {
      context.report({
        message:
          "Type assertion (`<T>x`) is banned. Narrow with a type guard, or assert the value with valibot/Result, instead of casting.",
        node,
      });
    },
  }),
  meta: {
    docs: {
      description:
        "Bans TypeScript type assertions (`x as T` and `<T>x`). `as const` is permitted.",
    },
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
    "ban-eden-fetch": banEdenFetch,
    "ban-let": banLet,
    "ban-switch": banSwitch,
    "ban-try-catch": banTryCatch,
    "ban-type-assertion": banTypeAssertion,
    "cognitive-complexity": cognitiveComplexityRule,
    "no-fetch": noFetch,
    "no-use-effect": noUseEffect,
    "no-void-return": noVoidReturn,
    "require-const-type-annotation": requireConstTypeAnnotation,
  },
};
