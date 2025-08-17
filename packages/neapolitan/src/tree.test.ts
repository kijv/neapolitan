import { createTree, lazyTransformTree } from './tree'
import { describe, expect, test } from 'bun:test'

describe('createTree', () => {
  test('creates empty tree when no initial data provided', () => {
    const tree = createTree()
    expect(tree.toJSON()).toEqual([])
  })

  test('creates tree with initial data', () => {
    const tree = createTree([
      { key: 'name', value: 'John', tree: 'user' },
      { key: 'age', value: 30, tree: 'user' },
      { key: 'debug', value: true, tree: 'config' },
    ])

    expect(tree.get('user.name')).toBe('John')
    expect(tree.get('user.age')).toBe(30)
    expect(tree.get('config.debug')).toBe(true)
  })

  test('handles dot notation paths', () => {
    const tree = createTree()
    tree.setValue('app.config.theme', 'dark')
    tree.setValue('app.config.language', 'en')

    expect(tree.getValue('app.config.theme')).toBe('dark')
    expect(tree.getValue('app.config.language')).toBe('en')
  })

  test('handles slash notation paths', () => {
    const tree = createTree()
    tree.setValue('path/to/file', 'content')
    tree.setValue('path/to/another', 'data')

    expect(tree.getValue('path/to/file')).toBe('content')
    expect(tree.getValue('path/to/another')).toBe('data')
  })

  test('handles mixed dot and slash notation', () => {
    const tree = createTree()
    tree.setValue('api.endpoints/users', '/api/users')
    tree.setValue('api.endpoints/posts', '/api/posts')

    expect(tree.getValue('api.endpoints/users')).toBe('/api/users')
    expect(tree.getValue('api.endpoints/posts')).toBe('/api/posts')
  })

  test('overwrites existing values', () => {
    const tree = createTree([{ key: 'value', value: 'original', tree: 'test' }])
    tree.setValue('test.value', 'updated')

    expect(tree.getValue('test.value')).toBe('updated')
  })

  test('loads additional data into existing tree', () => {
    const tree = createTree([{ key: 'key', value: 'value', tree: 'initial' }])
    tree.load([
      { key: 'key', value: 'newValue', tree: 'new' },
      { key: 'another', value: 'anotherValue', tree: 'initial' },
    ])

    expect(tree.get('initial.key')).toBe('value')
    expect(tree.get('new.key')).toBe('newValue')
    expect(tree.get('initial.another')).toBe('anotherValue')
  })

  test('toJSON returns flattened structure with tree keys', () => {
    const tree = createTree([
      { key: 'name', value: 'Alice', tree: 'user' },
      { key: 'theme', value: 'light', tree: 'user.settings' },
      { key: 'debug', value: false, tree: 'config' },
    ])

    const json = tree.toJSON()
    expect(json).toEqual([
      { key: 'name', value: 'Alice', tree: 'user' },
      { key: 'theme', value: 'light', tree: 'user.settings' },
      { key: 'debug', value: false, tree: 'config' },
    ])
  })

  test('handles undefined values', () => {
    const tree = createTree()
    expect(tree.getValue('nonexistent.path')).toBeUndefined()
  })

  test('preserves existing children when setting values', () => {
    const tree = createTree()
    tree.setValue('parent.child1', 'value1')
    tree.setValue('parent.child2', 'value2')
    tree.setValue('parent', 'parentValue')

    expect(tree.getValue('parent')).toBe('parentValue')
    expect(tree.getValue('parent.child1')).toBe('value1')
    expect(tree.getValue('parent.child2')).toBe('value2')
  })

  test('handles complex nested structures with subtrees', () => {
    const tree = createTree([
      { key: 'host', value: 'localhost', tree: 'database' },
      { key: 'port', value: 5432, tree: 'database' },
      { key: 'username', value: 'admin', tree: 'database.credentials' },
      { key: 'password', value: 'secret', tree: 'database.credentials' },
      { key: 'api', value: '/api/v1', tree: 'server.routes' },
      { key: 'health', value: '/health', tree: 'server.routes' },
    ])

    expect(tree.get('database.host')).toBe('localhost')
    expect(tree.get('database.port')).toBe(5432)
    expect(tree.get('database.credentials.username')).toBe('admin')
    expect(tree.get('database.credentials.password')).toBe('secret')
    expect(tree.get('server.routes.api')).toBe('/api/v1')
    expect(tree.get('server.routes.health')).toBe('/health')
  })

  test('handles subtree creation and access', () => {
    const tree = createTree([
      { key: 'username', value: 'alice', tree: 'auth.user' },
      { key: 'token', value: 'abc123', tree: 'auth.session' },
      { key: 'level', value: 'debug', tree: 'config.logging' },
    ])

    // Access subtrees
    const authTree = tree.getTree('auth')
    expect(authTree).toBeDefined()

    const userSubtree = tree.get('auth.user')
    expect(userSubtree).toBeDefined()

    // Verify values can be accessed through main tree
    expect(tree.get('auth.user.username')).toBe('alice')
    expect(tree.get('auth.session.token')).toBe('abc123')
    expect(tree.get('config.logging.level')).toBe('debug')
  })

  test('creates nested subtrees on demand', () => {
    const tree = createTree()

    // Create a deeply nested subtree
    tree.setTree('app.modules.auth')
    tree.setValue('app.modules.auth.enabled', true)
    tree.setValue('app.modules.auth.provider', 'oauth')

    expect(tree.getValue('app.modules.auth.enabled')).toBe(true)
    expect(tree.getValue('app.modules.auth.provider')).toBe('oauth')

    const authSubtree = tree.getTree('app.modules.auth')
    expect(authSubtree).toBeDefined()
  })
})

describe('lazyTransformTree', () => {
  test('transforms values lazily', () => {
    const tree = createTree([
      { key: 'name', value: 'alice', tree: 'user' },
      { key: 'age', value: '25', tree: 'user' },
      { key: 'debug', value: 'true', tree: 'config' },
    ])

    let transformCallCount = 0
    const transformedTree = lazyTransformTree(tree, (value) => {
      transformCallCount++
      return typeof value === 'string' ? value.toUpperCase() : value
    })

    // No transformations yet
    expect(transformCallCount).toBe(0)

    // First access triggers transformation
    expect(transformedTree.get('user.name')).toBe('ALICE')
    expect(transformCallCount).toBe(1)

    // Second access uses cached value
    expect(transformedTree.get('user.name')).toBe('ALICE')
    expect(transformCallCount).toBe(1)

    // Different key triggers new transformation
    expect(transformedTree.get('user.age')).toBe('25')
    expect(transformCallCount).toBe(2)
  })

  test('returns undefined for non-existent keys', () => {
    const tree = createTree([{ key: 'key', value: 'value', tree: 'existing' }])

    const transformedTree = lazyTransformTree(tree, (value) => {
      return value?.toString().toUpperCase()
    })

    expect(transformedTree.getValue('nonexistent.key')).toBeUndefined()
  })

  test('preserves original tree methods', () => {
    const tree = createTree([{ key: 'value', value: 'original', tree: 'test' }])

    const transformedTree = lazyTransformTree(tree, (value) => {
      return value?.toString().toUpperCase()
    })

    // Original tree methods should still work
    expect(typeof transformedTree.setValue).toBe('function')
    expect(typeof transformedTree.load).toBe('function')
    expect(typeof transformedTree.toJSON).toBe('function')

    // Setting new values should work
    transformedTree.setValue('new.key', 'test')
    expect(transformedTree.getValue('new.key')).toBe('TEST')
  })

  test('handles complex transformations with subtrees', () => {
    const tree = createTree([
      { key: 'one', value: '1', tree: 'numbers' },
      { key: 'two', value: '2', tree: 'numbers' },
      { key: 'hello', value: 'world', tree: 'strings' },
    ])

    const transformedTree = lazyTransformTree(tree, (value) => {
      if (value) {
        const next = value.toString()
        // Convert number strings to actual numbers, uppercase other strings
        if (/^\d+$/.test(next)) {
          return parseInt(next, 10)
        }
        return next.toUpperCase()
      }
      return value
    })

    expect(transformedTree.get('numbers.one')).toBe(1)
    expect(transformedTree.get('numbers.two')).toBe(2)
    expect(transformedTree.get('strings.hello')).toBe('WORLD')
  })

  test('caches transformations per key', () => {
    const tree = createTree([
      { key: 'key1', value: 'value1', tree: 'test' },
      { key: 'key2', value: 'value2', tree: 'test' },
    ])

    const transformCalls: string[] = []
    const transformedTree = lazyTransformTree(tree, (value) => {
      transformCalls.push(value)
      return value?.toString().toUpperCase()
    })

    // Access same key multiple times
    transformedTree.get('test.key1')
    transformedTree.get('test.key1')
    transformedTree.get('test.key2')
    transformedTree.get('test.key1')

    // Should only transform each unique value once
    expect(transformCalls).toEqual(['value1', 'value2'])
  })
})
