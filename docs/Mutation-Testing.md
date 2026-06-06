# Mutation Testing Guide

## What is Mutation Testing?

Mutation testing is a technique to evaluate the quality of your test suite by introducing small changes (mutations) to your source code and checking if your tests can detect these changes. It helps answer the question: "How good are my tests at catching bugs?"

## Principles

### How It Works

1. **Mutants Creation**: The tool automatically creates modified versions of your code (mutants)
2. **Test Execution**: Each mutant is tested against your test suite
3. **Classification**: Mutants are classified as:
   - **Killed**: Tests detected the mutation (good!)
   - **Survived**: Tests passed despite the mutation (potential test gap)
   - **Timeout**: Tests took too long (usually infinite loops)
   - **No Coverage**: No tests covered the mutated code

### Common Mutation Types

- **Arithmetic**: `+` → `-`, `*` → `/`
- **Relational**: `>` → `>=`, `==` → `!=`
- **Logical**: `&&` → `||`, `!` removed
- **Conditional**: `if (condition)` → `if (true)` or `if (false)`
- **Assignment**: `x = y` → `x = 0`

## Usage in This Project

### Running Mutation Tests

```bash
# In a specific package
npm run test:mutation -w packages/<name>
```

### Configuration

Mutation testing is configured in `packages/<name>/stryker.conf.json`:

```json
{
  "testRunner": "vitest",
  "mutate": ["src/**/*.ts", "!src/**/*.spec.ts", "!src/**/*.test.ts"],
  "plugins": ["@stryker-mutator/vitest-runner", "@stryker-mutator/typescript-checker"]
}
```

### Understanding Results

**Mutation Score = (Killed Mutants / Total Mutants) × 100**

- **90-100%**: Excellent test coverage
- **80-90%**: Good coverage with room for improvement
- **60-80%**: Adequate but needs attention
- **< 60%**: Poor coverage, significant test gaps

### Example Output

```
File                   | % Mutation score | # killed | # survived
-----------------------|------------------|----------|------------
example-calculator.ts  |            91.30 |       21 |          2
```

## Interpreting Survived Mutants

When mutants survive, it indicates potential test gaps:

### Example: Survived Mutant

```typescript
// Original code
return a > b ? a : b;

// Survived mutant
return a >= b ? a : b;
```

**Why it survived**: Tests didn't cover the edge case where `a === b`.

**Solution**: Add test case:

```typescript
it('should handle equal values correctly', () => {
  expect(calculator.max(5, 5)).toBe(5);
});
```

## Best Practices

### 1. Start with Good Unit Tests

Mutation testing complements, doesn't replace, good testing practices:

- Write tests first (TDD)
- Aim for high code coverage
- Test edge cases and error conditions

### 2. Focus on High-Value Code

Prioritize mutation testing for:

- Critical business logic
- Complex algorithms
- Error-prone areas

### 3. Don't Chase 100%

- Some mutants are equivalent to the original (false positives)
- Focus on meaningful survived mutants
- 85-95% is typically a good target

### 4. Use Results to Improve Tests

- Analyze survived mutants to identify missing test cases
- Look for patterns in survived mutants
- Add tests for uncovered scenarios

## Integration with CI/CD

Consider adding mutation testing to your pipeline:

```yaml
# Example GitHub Actions step
- name: Run Mutation Tests
  run: npm run test:mutation -w packages/<name>
  continue-on-error: true # Don't fail build on low scores initially
```

## Viewing Reports

After running mutation tests, view the detailed HTML report:

- **Location**: `packages/<name>/reports/mutation/mutation.html`
- **Content**: Per-file breakdown, survived mutants, test execution details

## Performance Considerations

- Mutation testing is computationally expensive
- Run on critical modules or before releases
- Use `--incremental` flag for faster subsequent runs
- Consider running in parallel with `maxConcurrentTestRunners`

## Resources

- [Stryker Mutator Documentation](https://stryker-mutator.io/)
- [Mutation Testing Concepts](https://en.wikipedia.org/wiki/Mutation_testing)
- [Testing Best Practices](https://martinfowler.com/articles/practical-test-pyramid.html)
