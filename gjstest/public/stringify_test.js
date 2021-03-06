// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jacobsa@google.com (Aaron Jacobs)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function StringifyTest() { }
registerTestSuite(StringifyTest);

StringifyTest.prototype.PrimitiveTypes = function() {
  expectEq('null', stringify(null));
  expectEq('undefined', stringify(undefined));

  expectEq('false', stringify(false));
  expectEq('true', stringify(true));

  expectEq('0', stringify(0));
  expectEq('1.5', stringify(1.5));
  expectEq('-1', stringify(-1));
  expectEq('NaN', stringify(NaN));
};

StringifyTest.prototype.Strings = function() {
  expectEq("''", stringify(''));
  expectEq("'taco burrito'", stringify('taco burrito'));
  expectEq("'taco\\nburrito\\nenchilada'",
           stringify('taco\nburrito\nenchilada'));
};

StringifyTest.prototype.RegExps = function() {
  expectEq('/taco.*burrito/', stringify(/taco.*burrito/));
};

StringifyTest.prototype.Errors = function() {
  var error = new TypeError('taco burrito');
  expectEq('TypeError: taco burrito', stringify(error));
};

StringifyTest.prototype.Dates = function() {
  var date = new Date(1985, 2, 18);
  expectEq(date.toString(), stringify(date));
};

StringifyTest.prototype.Functions = function() {
  function fooBar(baz) {
    doSomething(baz);
    return baz + 1;
  };

  expectEq('function fooBar(baz)', stringify(fooBar));
  expectEq('function ()', stringify(function() {}));
  expectEq('function (foo, bar)', stringify(function(foo, bar) {}));
};

StringifyTest.prototype.Objects = function() {
  expectEq('{}', stringify({}));
  expectEq('{ foo: 1, bar: 2 }', stringify({ foo: 1, bar: 2 }));

  var multiLevelObj = {
      foo: 1,
      bar: { baz: 2 }
  };
  expectEq('{ foo: 1, bar: { baz: 2 } }', stringify(multiLevelObj));
};

StringifyTest.prototype.SelfReferences = function() {
  // Object
  var selfReferentialObject = {foo: 1, bar: [17]};
  selfReferentialObject.bar.push(selfReferentialObject);

  expectEq('{ foo: 1, bar: [ 17, (cyclic reference) ] }',
           stringify(selfReferentialObject));

  // Array
  var selfReferentialArray = [1, {foo: 17}];
  selfReferentialArray[1].bar = selfReferentialArray;

  expectEq('[ 1, { foo: 17, bar: (cyclic reference) } ]',
           stringify(selfReferentialArray));
};

StringifyTest.prototype.SelfReferencePropertyCleared = function() {
  // Object
  var obj = {foo: 1, bar: {baz: 19}};

  stringify(obj);

  expectFalse('__gjstest_stringify_already_seen' in obj);
  expectFalse('__gjstest_stringify_already_seen' in obj.bar);

  // Array
  var arr = [0, [1, 2]];

  stringify(arr);

  expectFalse('__gjstest_stringify_already_seen' in arr);
  expectFalse('__gjstest_stringify_already_seen' in arr[1]);
};

StringifyTest.prototype.Arrays = function() {
  expectEq('[]', stringify([]));
  expectEq('[ 1, \'foo\\nbar\' ]', stringify([ 1, 'foo\nbar' ]));
  expectEq('[ [ 1 ], { foo: 2 } ]', stringify([ [1], { foo: 2 } ]));
};

StringifyTest.prototype.ArrayWithMissingElements = function() {
  // Cause indexes 1, 3, and 4 to be missing.
  var a = [];
  a[0] = 'foo';
  a[2] = 'bar';
  a.length = 5;

  expectEq('[ \'foo\', , \'bar\', ,  ]', stringify(a));
};

StringifyTest.prototype.ArgumentObjects = function() {
  function grabArgs() { return arguments; }

  expectEq('[]', stringify(grabArgs()));
  expectEq('[ 1, \'foo\\nbar\' ]', stringify(grabArgs(1, 'foo\nbar')));
  expectEq('[ [ 1 ], { foo: 2 } ]', stringify(grabArgs([1], { foo: 2 })));
};

StringifyTest.prototype.UserDefinedClass = function() {
  function MyClass() {}
  MyClass.prototype.toString = function() { return 'MyClass: taco'; };
  var instance = new MyClass;

  expectEq('MyClass: taco', stringify(instance));
};
