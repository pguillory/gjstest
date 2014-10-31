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

#include "gjstest/internal/cpp/test_case.h"

#include "base/logging.h"
#include "base/stringprintf.h"
#include "base/timer.h"
#include "gjstest/internal/cpp/v8_utils.h"

using v8::Context;
using v8::Function;
using v8::Handle;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::TryCatch;
using v8::Value;

namespace gjstest {

// Get a reference to the function of the supplied name.
Local<Function> TestCase::GetFunctionNamed(const string& name) const {
  const Local<Value> result = ExecuteJs(isolate_, name, "");
  CHECK(result->IsFunction()) << "Error getting reference to " << name;
  return Local<Function>::Cast(result);
}

// Log the supplied string to the test's output.
static Handle<Value> LogString(
    TestCase* test_case,
    const v8::FunctionCallbackInfo<Value>& cb_info) {
  CHECK_EQ(1, cb_info.Length());
  const string message = ConvertToString(cb_info[0]);
  StringAppendF(&test_case->output, "%s\n", message.c_str());

  return v8::Undefined(Isolate::GetCurrent());
}

// Record the test as having failed, and extract a failure message from the JS
// arguments and append it to the existing messages, if any.
static Handle<Value> RecordFailure(
    TestCase* test_case,
    const v8::FunctionCallbackInfo<Value>& cb_info) {
  CHECK_EQ(1, cb_info.Length());
  const string message = ConvertToString(cb_info[0]);

  test_case->succeeded = false;
  StringAppendF(&test_case->output, "%s\n\n", message.c_str());
  StringAppendF(&test_case->failure_output, "%s\n\n", message.c_str());

  return v8::Undefined(Isolate::GetCurrent());
}

TestCase::TestCase(
    v8::Isolate* const isolate,
    const Handle<Function>& test_function)
    : isolate_(CHECK_NOTNULL(isolate)),
      test_function_(test_function) {
  CHECK(test_function_->IsFunction());
}

void TestCase::Run() {
  CycleTimer timer;
  timer.Start();

  // Assume we succeeded by default.
  succeeded = true;

  // Grab references to runTest, getCurrentStack, and the TestEnvironment
  // constructor.
  const Local<Function> run_test = GetFunctionNamed("gjstest.internal.runTest");

  const Local<Function> get_current_stack =
      GetFunctionNamed("gjstest.internal.getCurrentStack");

  const Local<Function> test_env_constructor =
      GetFunctionNamed("gjstest.internal.TestEnvironment");

  // Create log and reportFailure functions.
  V8FunctionCallback log_cb =
      std::bind(
          &LogString,
          this,
          std::placeholders::_1);

  const Local<Function> log =
      MakeFunction(
          isolate_,
          "log",
          &log_cb);

  V8FunctionCallback report_failure_cb =
      std::bind(
          &RecordFailure,
          this,
          std::placeholders::_1);

  const Local<Function> report_failure =
      MakeFunction(
          isolate_,
          "reportFailure",
          &report_failure_cb);

  // Create a test environment.
  Handle<Value> test_env_args[] = { log, report_failure, get_current_stack };
  const Local<Object> test_env =
      test_env_constructor->NewInstance(
          arraysize(test_env_args),
          test_env_args);
  CHECK(!test_env.IsEmpty());

  // Run the test.
  TryCatch try_catch;
  Handle<Value> args[] = { test_function_, test_env };
  const Local<Value> result =
      run_test->Call(
          Isolate::GetCurrent()->GetCurrentContext()->Global(),
          arraysize(args),
          args);

  // Was there an exception while running the test?
  if (result.IsEmpty()) {
    succeeded = false;

    const string description = DescribeError(try_catch);
    StringAppendF(&output, "%s\n", description.c_str());
    StringAppendF(&failure_output, "%s\n", description.c_str());
  }

  // Record the test time.
  timer.Stop();
  duration_ms = timer.GetInMs();
}

}  // namespace gjstest
