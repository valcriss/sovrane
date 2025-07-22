# Tests Backend Sovrane

Ce répertoire contient la configuration et les tests pour le backend de l'application Sovrane.

## Structure des tests

```
tests/
├── setup.ts                           # Configuration globale des tests
├── sample.test.ts                     # Tests d'exemple
├── domain/
│   ├── entities/
│   │   ├── User.test.ts              # Tests pour l'entité User
│   │   └── Role.test.ts              # Tests pour l'entité Role
│   └── ports/
│       └── UserRepositoryPort.test.ts # Tests pour l'interface UserRepositoryPort
└── adapters/
    └── repositories/
        └── PrismaUserRepository.test.ts # Tests pour l'implémentation Prisma
```

## Scripts disponibles

- `npm test` : Lance tous les tests avec couverture de code
- `npm run test:watch` : Lance les tests en mode watch
- `npm run test:ci` : Lance les tests pour l'intégration continue

## Configuration

### Jest

La configuration Jest se trouve dans `jest.config.js` et inclut :
- Support TypeScript avec `ts-jest`
- Couverture de code avec seuils à 70%
- Rapports de couverture en format text, lcov et html
- Setup global des tests

### TypeScript

Configuration TypeScript spécifique aux tests dans `tsconfig.json`.

## Types de tests

### Tests d'entités (Domain)
- Tests unitaires pour les entités `User` et `Role`
- Validation des constructeurs et propriétés
- Tests de comportement métier

### Tests de ports (Interfaces)
- Tests d'implémentation mock pour valider les contrats d'interface
- Tests de cohérence des opérations CRUD
- Scénarios d'intégration complets

### Tests d'adaptateurs (Infrastructure)
- Tests d'intégration avec Prisma
- Mocking des dépendances externes
- Validation des mappings de données

## Couverture de code

Les tests maintiennent une couverture de 100% sur :
- Statements (instructions)
- Branches (embranchements)
- Functions (fonctions)
- Lines (lignes)

Le répertoire `coverage/` est automatiquement généré et ignoré par Git.

## Bonnes pratiques

1. **Organisation** : Les tests suivent la même structure que le code source
2. **Isolation** : Chaque test est indépendant et peut être exécuté séparément
3. **Mocking** : Utilisation de `jest-mock-extended` pour les mocks complexes
4. **Nommage** : Noms de tests descriptifs et conventions AAA (Arrange, Act, Assert)
5. **Setup/Teardown** : Nettoyage approprié dans `beforeEach`/`afterEach`

## Développement

Pour ajouter de nouveaux tests :

1. Créer le fichier de test dans la structure appropriée
2. Suivre le pattern `*.test.ts` ou `*.spec.ts`
3. Importer les entités avec les chemins relatifs corrects
4. Utiliser les utilitaires de setup partagés si nécessaire

## Dépendances de test

- `jest` : Framework de test
- `@types/jest` : Types TypeScript pour Jest
- `ts-jest` : Preset TypeScript pour Jest
- `jest-mock-extended` : Utilitaires de mocking avancés
