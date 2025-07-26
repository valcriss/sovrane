import fs from 'fs';
import path from 'path';

interface SecurityRequirement {
  bearerAuth?: unknown;
}

interface OperationObject {
  security?: SecurityRequirement[];
  requestBody?: unknown;
  responses: Record<string, unknown>;
}

interface PathsObject {
  [route: string]: Record<string, OperationObject>;
}

interface OpenAPISpec {
  paths: PathsObject;
}

interface BruFile {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
  };
  test: { script: string };
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function sanitizeName(method: string, route: string, suffix?: string): string {
  let name = `${method}-${route}`
    .replace(/[{}]/g, '')
    .replace(/\//g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  if (suffix) {
    name += `-${suffix}`;
  }
  return name;
}

function buildUrl(route: string, notFound = false): string {
  return (
    '{{baseUrl}}' +
    route.replace(/\{([^}]+)\}/g, notFound ? '{{notFoundId}}' : '{{$1}}')
  );
}

function createBruFiles(spec: OpenAPISpec, baseDir: string): void {
  const requestsDir = path.join(baseDir, 'requests');
  const envDir = path.join(baseDir, 'environments');
  ensureDir(requestsDir);
  ensureDir(envDir);

  const envContent = {
    baseUrl: 'http://localhost:3000/api',
    token: 'valid_token',
    restrictedToken: 'low_priv_token',
    notFoundId: '00000000-0000-0000-0000-000000000000',
  };
  fs.writeFileSync(
    path.join(envDir, 'local.env.json'),
    JSON.stringify(envContent, null, 2)
  );

  const collectionContent = { name: 'Sovrane API' };
  fs.writeFileSync(
    path.join(baseDir, 'collection.bru'),
    JSON.stringify(collectionContent, null, 2)
  );

  for (const [route, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const methodUpper = method.toUpperCase();
      const needsAuth = operation.security?.some((s) => s.bearerAuth !== undefined);
      const hasBody = !!operation.requestBody && ['POST', 'PUT', 'PATCH'].includes(methodUpper);
      const successCode = Object.keys(operation.responses || {})
        .map((c) => parseInt(c, 10))
        .find((c) => c >= 200 && c < 300) ?? 200;

      const baseRequest: BruFile['request'] = {
        method: methodUpper,
        url: buildUrl(route),
        headers: {},
      };

      if (needsAuth) {
        baseRequest.headers.Authorization = 'Bearer {{token}}';
      }
      if (hasBody) {
        baseRequest.headers['Content-Type'] = 'application/json';
        baseRequest.body = {};
      }

      const baseName = sanitizeName(method, route);
      const baseBru: BruFile = {
        request: baseRequest,
        test: { script: `response.status === ${successCode}` },
      };
      fs.writeFileSync(
        path.join(requestsDir, `${baseName}.bru`),
        JSON.stringify(baseBru, null, 2)
      );

      for (const codeStr of Object.keys(operation.responses || {})) {
        const code = parseInt(codeStr, 10);
        if (code >= 200 && code < 300) {
          continue;
        }
        const errRequest: BruFile['request'] = {
          method: methodUpper,
          url: buildUrl(route),
          headers: { ...baseRequest.headers },
        };
        if (code === 401) {
          delete errRequest.headers.Authorization;
        } else if (code === 403) {
          errRequest.headers.Authorization = 'Bearer {{restrictedToken}}';
        } else if (code === 404) {
          errRequest.url = buildUrl(route, true);
        } else if (code === 400 && hasBody) {
          errRequest.body = {};
        }

        const errBru: BruFile = {
          request: errRequest,
          test: { script: `response.status === ${code}` },
        };
        const errName = sanitizeName(method, route, codeStr);
        fs.writeFileSync(
          path.join(requestsDir, `${errName}.bru`),
          JSON.stringify(errBru, null, 2)
        );
      }
    }
  }
}

function main(): void {
  const specPath = path.join(__dirname, '..', 'openapi.json');
  const spec: OpenAPISpec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const baseDir = path.join(__dirname, '..', 'bruno');
  createBruFiles(spec, baseDir);
}

main();
