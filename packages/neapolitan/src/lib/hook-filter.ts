import * as R from 'remeda';
import * as filter from '@rolldown/pluginutils';
import type { GeneralHookFilter, HookFilterExtension } from 'rolldown';
import type { StringOrRegExp } from '../declaration';
import { arraify } from '../util';

function generateAtomMatcher(kind: 'code' | 'id', matcher: StringOrRegExp) {
  return kind === 'code' ? filter.code(matcher) : filter.id(matcher);
}

function transformFilterMatcherToFilterExprs(
  filterOption: HookFilterExtension<'transform'>['filter'],
): filter.TopLevelFilterExpression[] | undefined {
  if (!filterOption) {
    return undefined;
  }
  if (Array.isArray(filterOption)) {
    return filterOption;
  }
  const { id, code, moduleType } = filterOption;

  const ret: filter.TopLevelFilterExpression[] = [];
  let idIncludes: filter.TopLevelFilterExpression[] = [];
  let idExcludes: filter.TopLevelFilterExpression[] = [];
  let codeIncludes: filter.TopLevelFilterExpression[] = [];
  let codeExcludes: filter.TopLevelFilterExpression[] = [];
  if (id) {
    [idIncludes, idExcludes] = R.partition(
      generalHookFilterMatcherToFilterExprs(id, 'id') ?? [],
      (m) => m.kind === 'include',
    );
  }
  if (code) {
    [codeIncludes, codeExcludes] = R.partition(
      generalHookFilterMatcherToFilterExprs(code, 'code') ?? [],
      (m) => m.kind === 'include',
    );
  }
  ret.push(...idExcludes);
  ret.push(...codeExcludes);

  const andExprList: filter.FilterExpression[] = [];
  if (moduleType) {
    const moduleTypes = Array.isArray(moduleType)
      ? moduleType
      : (moduleType.include ?? []);
    andExprList.push(
      filter.or(...moduleTypes.map((m) => filter.moduleType(m))),
    );
  }
  if (idIncludes.length) {
    andExprList.push(filter.or(...idIncludes.map((item) => item.expr)));
  }

  if (codeIncludes.length) {
    andExprList.push(filter.or(...codeIncludes.map((item) => item.expr)));
  }

  if (andExprList.length) {
    ret.push(filter.include(filter.and(...andExprList)));
  }
  return ret;
}

// Convert `exclude` and `include` to tokens of FilterExpr
// Array of `BindingFilterToken` will be converted to `FilterExpr` finally,
// use `generalHookFilterToFilterExprs` instead of `generalHookFilterToFilterArrayOfArrayBindingFilterToken` would be concise
export function generalHookFilterMatcherToFilterExprs<T extends StringOrRegExp>(
  matcher: GeneralHookFilter<T>,
  stringKind: 'code' | 'id',
): filter.TopLevelFilterExpression[] | undefined {
  if (typeof matcher === 'string' || matcher instanceof RegExp) {
    return [filter.include(generateAtomMatcher(stringKind, matcher))];
  }
  if (Array.isArray(matcher)) {
    return matcher.map((m) =>
      filter.include(generateAtomMatcher(stringKind, m)),
    );
  }
  const ret: filter.TopLevelFilterExpression[] = [];
  if (matcher.exclude) {
    ret.push(
      ...arraify(matcher.exclude).map((m) =>
        filter.exclude(generateAtomMatcher(stringKind, m)),
      ),
    );
  }
  if (matcher.include) {
    ret.push(
      ...arraify(matcher.include).map((m) =>
        filter.include(generateAtomMatcher(stringKind, m)),
      ),
    );
  }
  return ret;
}

export function loadFilterToFilterExprs(
  filterOption?: HookFilterExtension<'load'>['filter'],
): filter.TopLevelFilterExpression[] | undefined {
  if (!filterOption) {
    return undefined;
  }
  if (Array.isArray(filterOption)) {
    return filterOption;
  }
  return filterOption.id
    ? generalHookFilterMatcherToFilterExprs(filterOption.id, 'id')
    : undefined;
}

export function transformFilterToFilterExprs(
  filterOption?: HookFilterExtension<'transform'>['filter'],
): filter.TopLevelFilterExpression[] | undefined {
  if (!filterOption) {
    return undefined;
  }

  return transformFilterMatcherToFilterExprs(filterOption);
}
