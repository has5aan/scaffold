const yaml = require('yamljs')
const path = require('path')

// Load main OpenAPI spec
const openapiPath = path.join(__dirname, '../../openapi/openapi.yaml')
let swaggerSpec = yaml.load(openapiPath)

// Load and merge components from domain-specific schema files
const authSchemasPath = path.join(
  __dirname,
  '../../openapi/components/schemas/auth/auth.yaml'
)
const exampleSchemasPath = path.join(
  __dirname,
  '../../openapi/components/schemas/example/tag.yaml'
)

const authSchemas = yaml.load(authSchemasPath)
const exampleSchemas = yaml.load(exampleSchemasPath)

// Merge all schemas
const allSchemas = {
  ...authSchemas,
  ...exampleSchemas
}

swaggerSpec.components = {
  ...swaggerSpec.components,
  schemas: allSchemas
}

// Load and merge paths from domain-specific folders
const authPathsPath = path.join(__dirname, '../../openapi/paths/auth/auth.yaml')
const exampleTagsPathsPath = path.join(
  __dirname,
  '../../openapi/paths/example/tags.yaml'
)

const authPaths = yaml.load(authPathsPath)
const exampleTagsPaths = yaml.load(exampleTagsPathsPath)

swaggerSpec.paths = {
  ...authPaths.paths,
  ...exampleTagsPaths.paths
}

// Replace environment variables in the spec
const replaceEnvVars = obj => {
  if (typeof obj === 'string') {
    // Replace ${VAR:-default} pattern
    return obj.replace(
      /\$\{([^:}]+):-([^}]+)\}/g,
      (match, varName, defaultValue) => {
        return process.env[varName] || defaultValue
      }
    )
  } else if (Array.isArray(obj)) {
    return obj.map(replaceEnvVars)
  } else if (obj && typeof obj === 'object') {
    const result = {}
    for (const key in obj) {
      result[key] = replaceEnvVars(obj[key])
    }
    return result
  }
  return obj
}

swaggerSpec = replaceEnvVars(swaggerSpec)

module.exports = swaggerSpec
