# Chapter 9: Exception Handling & try-with-resources

## 1. Core Java 21 Exam Objectives
- Master the `Throwable` hierarchy, differentiating between Checked Exceptions, Unchecked (Runtime) Exceptions, and JVM Errors.
- Write robust error handling using `try-catch-finally` and multi-catch blocks.
- Implement resource management with **try-with-resources** and understand the `AutoCloseable` interface.
- Understand resource closing order and how **Suppressed Exceptions** are managed.
- Utilize Assertions (`assert`) and configure their runtime execution.

---

## 2. Deep-Dive Concepts

### Exception Classification
- **`Error`:** Severe JVM problems (e.g., `OutOfMemoryError`, `StackOverflowError`). Applications should not catch them. They are unchecked.
- **`RuntimeException` (Unchecked):** Programming logic bugs (e.g., `NullPointerException`, `ArrayIndexOutOfBoundsException`). Do not require explicit handling.
- **`Exception` (Checked):** Environmental failures (e.g., `IOException`, `SQLException`). The compiler forces you to handle them via a `try-catch` block or declare them in the method signature (`throws`).

### Try-With-Resources (TWR) Rules
Introduced in Java 7 to replace manual resource cleanup in `finally` blocks, TWR guarantees resource closure.
1. **AutoCloseable contract:** Any class initialized in the `try(...)` parenthesis must implement the `java.lang.AutoCloseable` interface (which defines a single `close()` method throwing `Exception`).
2. **Closing Order:** Resources declared in TWR are closed in **reverse order of their declaration**.
3. **Implicit finality:** Variables declared in TWR are implicitly `final` and cannot be reassigned inside the try block.

```
TWR Declaration:
try (Resource A = new Resource(); Resource B = new Resource()) {
    // Execution Flow
}
Closing Flow:
[End of Try Block] ---> Close Resource B ---> Close Resource A
```

---

## 3. JVM Internals & Memory Layout

### Exception Masking in `finally` Blocks
If a `try` block throws an exception, and the `finally` block *also* throws an exception, the original exception is **masked** (completely discarded) and lost. The JVM only propagates the exception thrown by the `finally` block.

### Suppressed Exceptions in TWR
TWR prevents exception masking. 
- If the `try` block throws an exception (e.g. `IOException`), and during the automatic closing of resources, the `close()` method also throws an exception (e.g. `CloseException`), the original exception is **propagated**.
- The `close()` exception is not lost; it is added to the original exception's **Suppressed Exception list**.
- You can access these suppressed exceptions using `primaryException.getSuppressed()`.

```
+--------------------------------------------------------------+
| TWR EXCEPTION HANDLING LIFECYCLE                             |
|                                                              |
| 1. Try block throws: IOException (Primary)                   |
| 2. JVM calls Resource.close()                                |
| 3. close() throws: CloseException                            |
| 4. JVM catches CloseException and attaches it:               |
|    IOException.addSuppressed(CloseException)                 |
| 5. IOException propagates up the call stack                  |
+--------------------------------------------------------------+
```

---

## 4. Tricky OCP Exam Questions

### Question 1: Try-With-Resources Closing Order and Exception Catching
What is the output of executing the following program?
```java
class Resource implements AutoCloseable {
    private String name;
    public Resource(String name) { this.name = name; }
    public void close() {
        System.out.print("Close" + name + " ");
    }
}

public class TWRFlow {
    public static void main(String[] args) {
        try (Resource r1 = new Resource("A"); Resource r2 = new Resource("B")) {
            System.out.print("Try ");
            throw new RuntimeException("Error");
        } catch (Exception e) {
            System.out.print("Catch ");
        } finally {
            System.out.print("Finally");
        }
    }
}
```
- A. `Try Catch CloseB CloseA Finally`
- B. `Try CloseB CloseA Catch Finally`
- C. `Try CloseA CloseB Catch Finally`
- D. `Try Catch Finally CloseB CloseA`

**Answer: B**
**Detailed Explanation:**
- In a try-with-resources statement, resources declared in the header are automatically closed **before** control transfers to any matching `catch` or `finally` blocks of the same try statement.
- **Step 1:** The body of the `try` block executes and prints `"Try "`.
- **Step 2:** A `RuntimeException` is thrown inside the try block.
- **Step 3:** Before looking for a catch block, the JVM automatically closes the initialized resources in the **reverse order of their declaration**:
  - `r2` ("B") is closed first, printing `"CloseB "`.
  - `r1` ("A") is closed second, printing `"CloseA "`.
- **Step 4:** The JVM now processes the thrown exception. The `catch (Exception e)` block matches, executes, and prints `"Catch "`.
- **Step 5:** The `finally` block executes and prints `"Finally"`.
- Combined output: `Try CloseB CloseA Catch Finally`.

---

### Question 2: Multi-Catch Block Constraints
Which of the following `catch` block declarations will cause a compile-time error? (Select all that apply)
- A. `catch (IOException | SQLException e)`
- B. `catch (FileNotFoundException | IOException e)`
- C. `catch (ArithmeticException | NullPointerException e)`
- D. `catch (Exception | RuntimeException e)`

**Answer: B, D**
**Detailed Explanation:**
- In a multi-catch block (`catch (TypeA | TypeB e)`), the declared exceptions **cannot have a parent-child inheritance relationship**.
- If two exceptions belong to the same inheritance hierarchy:
  - Catching them in a multi-catch is redundant because the parent exception type would already catch the subclass exception. The compiler flags this as a compilation error.
- **B fails to compile:** `FileNotFoundException` is a subclass of `IOException`.
- **D fails to compile:** `RuntimeException` is a subclass of `Exception`.
- **A compiles:** `IOException` and `SQLException` are independent subclasses of `Exception`.
- **C compiles:** `ArithmeticException` and `NullPointerException` are independent subclasses of `RuntimeException`.

---

### Question 3: Return Value Evaluation inside finally Block
What is the return value of `test()` when the following program is run?
```java
public class ReturnFlow {
    public static int test() {
        int x = 10;
        try {
            return x;
        } finally {
            x = 20;
        }
    }
    public static void main(String[] args) {
        System.out.println(test());
    }
}
```
- A. `10`
- B. `20`
- C. Fails to compile because `x` is modified after return.
- D. Throws a NullPointerException at runtime.

**Answer: A**
**Detailed Explanation:**
- When a `return` statement is encountered in a `try` block:
  - The return expression (`x`, which is `10`) is evaluated.
  - The evaluated value (`10`) is stored in a temporary local variable (copied for return).
  - Control then transfers to the `finally` block before the method actually returns.
- Inside the `finally` block, `x = 20;` modifies the local variable `x` to `20`.
- However, this does **not** change the already-copied return value of `10`.
- Therefore, the method completes and returns `10`.
- *(Note: If the return type were a mutable object, and the finally block modified the object's internal properties, the change would be visible. If the finally block executed a new return statement, e.g. `return 30;`, it would override the previous return value).*

---

### Question 4: Exception Masking in finally Block
What is the output of executing the following program?
```java
public class MaskFlow {
    public static void main(String[] args) {
        try {
            try {
                throw new ArithmeticException("A");
            } finally {
                throw new NullPointerException("B");
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }
}
```
- A. `A`
- B. `B`
- C. `A` followed by `B`
- D. `B` with `A` as a suppressed exception.

**Answer: B**
**Detailed Explanation:**
- If a block of code throws an exception, and the associated `finally` block **also throws an exception**, the original exception from the `try` block is **masked (discarded)**.
- The JVM can only propagate a single exception from a block. Since the `finally` block is executed last, its exception takes precedence and propagates, while the `ArithmeticException` is lost.
- The outer `catch (Exception e)` block catches the exception propagated from the inner try-finally block, which is the `NullPointerException` with the message `"B"`.
- Output: `B`.

---

### Question 5: TWR Suppressed Exceptions Retrieval
Given the resource and execution code:
```java
class CustomRes implements AutoCloseable {
    public void close() throws Exception {
        throw new Exception("CloseError");
    }
}

public class SuppressedTest {
    public static void main(String[] args) {
        try (CustomRes r = new CustomRes()) {
            throw new Exception("TryError");
        } catch (Exception e) {
            System.out.print(e.getMessage() + " " + e.getSuppressed().length);
        }
    }
}
```
What is printed?
- A. `CloseError 1`
- B. `TryError 1`
- C. `TryError 0`
- D. `CloseError 0`

**Answer: B**
**Detailed Explanation:**
- When an exception is thrown in a try-with-resources block, it is treated as the **primary exception**.
- During the automatic resource cleanup, if the `close()` method throws another exception, the JVM catches the close exception and attaches it to the primary exception's **suppressed list** using `addSuppressed()`.
- Therefore, the primary exception (`TryError`) propagates and is caught by the `catch (Exception e)` block.
- The message of `e` is `"TryError"`.
- The suppressed exception list contains the `CloseError` exception, so `e.getSuppressed().length` evaluates to `1`.
- Output: `TryError 1`.

---

### Question 6: Catch Block Redundant checked exception compile error
Which of the following code blocks fails to compile?
- A. `try {} catch (Exception e) {}`
- B. `try {} catch (RuntimeException e) {}`
- C. `try {} catch (java.io.IOException e) {}`
- D. `try { throw new java.io.IOException(); } catch (java.io.IOException e) {}`

**Answer: C**
**Detailed Explanation:**
- In Java, the compiler checks for unreachable `catch` blocks.
- If a `try` block does **not** contain any code that can throw a specific **checked exception** (like `IOException`), declaring a `catch` block for that checked exception is a **compile-time error**. The compiler knows it is dead code.
- **C fails to compile** because the try block is empty and can never throw an `IOException`.
- **A and B compile:** The compiler allows catching `Exception`, `Throwable`, and any unchecked exceptions (like `RuntimeException` subclasses) in any try block, even if the block is empty.
- **D compiles:** The try block explicitly throws `IOException`.

---

### Question 7: Try-with-Resources Effectively Final variables (Java 9+)
Consider the following TWR structures:
```java
// Option I
Resource r = new Resource();
try (r) { }

// Option II
final Resource r = new Resource();
try (r) { }

// Option III
Resource r = new Resource();
try (r) {
    r = new Resource(); // Line 10
}
```
Assuming `Resource` implements `AutoCloseable`, which of the options will cause a compile-time error?
- A. Option I only
- B. Option III only
- C. Option I and III only
- D. All options compile successfully.

**Answer: B**
**Detailed Explanation:**
- Since Java 9, you can reference an existing variable inside a try-with-resources header (e.g. `try (r)`) without redeclaring it, provided the variable is **final** or **effectively final** (never reassigned after initialization).
- **Option I compiles:** `r` is never reassigned, so it is effectively final.
- **Option II compiles:** `r` is explicitly declared `final`.
- **Option III fails to compile:** Inside the `try` block, the statement `r = new Resource();` reassigns `r`. This violates the effectively final requirement of TWR variables. The compiler flags this reassignment.

---

### Question 8: Throw null reference behavior
What is the result of executing the following statement?
```java
throw null;
```
- A. Fails to compile.
- B. Compiles successfully, but throws a `NullPointerException` at runtime.
- C. Terminated silently.
- D. Compiles successfully, but throws a `NullArgumentException` at runtime.

**Answer: B**
**Detailed Explanation:**
- The statement `throw null;` is syntactically valid because `null` can represent any reference type, including subclasses of `Throwable`. Therefore, it compiles without errors.
- At runtime, when the JVM executes the throw instruction and encounters a null reference instead of a valid `Throwable` object, it immediately throws a **`NullPointerException`** instead.

---

### Question 9: AssertionError Catching Design
What is the output of executing the following program with assertions enabled (`-ea`)?
```java
public class AssertCatch {
    public static void main(String[] args) {
        int x = 5;
        try {
            assert x < 3 : "CheckFailed";
        } catch (Throwable t) {
            System.out.println(t.getMessage());
        }
    }
}
```
- A. `CheckFailed`
- B. Nothing is printed.
- C. Fails to compile because `AssertionError` is not a subclass of `Throwable`.
- D. The program crashes with an unhandled exception.

**Answer: A**
**Detailed Explanation:**
- When an assertion fails, the JVM throws an `AssertionError`.
- `AssertionError` inherits from `Error`, which inherits from `Throwable`.
- Since the catch block catches `Throwable`, it catches the thrown `AssertionError`.
- `t.getMessage()` retrieves the detail message expression value, which is `"CheckFailed"`.
- Output: `CheckFailed`.

---

### Question 10: Multi-catch Exception Variable Immutability
What is the result of compiling the following class?
```java
import java.io.*;
public class MultiCatchVar {
    public static void main(String[] args) {
        try {
            if (true) throw new IOException();
        } catch (IOException | NullPointerException e) {
            e = new IOException(); // Line 6
        }
    }
}
```
- A. Compiles successfully.
- B. Fails to compile at Line 6 because `e` is implicitly final.
- C. Fails to compile because `IOException` and `NullPointerException` are incompatible.
- D. Throws a ClassCastException at runtime.

**Answer: B**
**Detailed Explanation:**
- In a multi-catch block, the caught exception parameter (`e` in `catch (IOException | NullPointerException e)`) is **implicitly final**.
- You cannot reassign or modify the exception variable `e` inside the catch block.
- Therefore, Line 6 (`e = new IOException();`) causes a compile-time error: `multi-catch parameter e may not be assigned`.

---

### Question 11: Exception thrown in Static Initializer vs Instance
What happens when you attempt to compile and run the following program?
```java
public class StaticException {
    static {
        if (true) throw new NullPointerException("StaticError");
    }
    public static void main(String[] args) {
        System.out.println("Main");
    }
}
```
- A. Prints `Main`.
- B. Throws a `NullPointerException` at runtime.
- C. Throws a `java.lang.ExceptionInInitializerError` at runtime.
- D. Fails to compile because static blocks cannot throw exceptions.

**Answer: C**
**Detailed Explanation:**
- When an unhandled runtime exception (like `NullPointerException`) is thrown inside a static initialization block, the JVM class loader catches it and wraps it inside a **`java.lang.ExceptionInInitializerError`**.
- This error occurs when the class is first loaded, before the `main` method starts executing.
- Therefore, the application terminates with an `ExceptionInInitializerError`.

---

### Question 12: Try-Catch-Finally return overriding rules
What is the return value of the following method?
```java
public static int getVal() {
    try {
        throw new Exception();
    } catch (Exception e) {
        return 1;
    } finally {
        return 2;
    }
}
```
- A. `1`
- B. `2`
- C. Throws an Exception at runtime.
- D. Fails to compile because `return` in `finally` blocks is illegal.

**Answer: B**
**Detailed Explanation:**
- A `finally` block always executes.
- If the `finally` block executes a `return` statement, it **overrides** any previous return or throw statement pending in the `try` or `catch` blocks.
- In this method:
  - The `try` block throws an exception.
  - The `catch` block catches it and schedules a return value of `1`.
  - Before returning, the `finally` block runs and executes `return 2;`.
  - The return of `2` overrides the catch block return of `1`. The method returns `2`.

---

### Question 13: AutoCloseable close method checked exception overrides
Which of the following is a valid override of the `close()` method declared in the `AutoCloseable` interface? (Select all that apply)
- A. `public void close() throws Exception {}`
- B. `public void close() throws java.io.IOException {}`
- C. `public void close() {}`
- D. `private void close() {}`
- E. `public void close() throws RuntimeException {}`

**Answer: A, B, C, E**
**Detailed Explanation:**
- The `AutoCloseable` interface declares the method: `public void close() throws Exception;`.
- Subclasses overriding this method can:
  - Declare the same exception (`throws Exception`).
  - Declare a narrower checked exception (like `throws IOException`).
  - Declare any unchecked exceptions (like `throws RuntimeException`).
  - Declare **no exceptions** at all (e.g. `public void close()`). This is highly recommended to avoid forcing callers to use try-catch blocks.
- **D is incorrect:** It restricts access from `public` to `private`.

---

### Question 14: Try-with-Resources Partial Failure
What happens if the initialization of `r2` fails (throws an exception) in the following statement?
`try (Res r1 = new Res("A"); Res r2 = new Res("B")) { ... }`
- A. `r1` is left open because the try block never executed.
- B. `r1` is automatically closed, and then the initialization exception of `r2` is thrown.
- C. The JVM crashes with an unhandled double exception.
- D. Both `r1` and `r2` are closed.

**Answer: B**
**Detailed Explanation:**
- In a try-with-resources statement, if a resource fails to initialize (e.g. `r2` constructor throws an exception):
  - The JVM immediately stops further initialization.
  - It automatically **closes any resources that were already successfully initialized** (here, `r1` is closed).
  - Then, the exception thrown by `r2`'s constructor is propagated.
- Therefore, `r1` is guaranteed to be closed safely.

---

### Question 15: Checked Exception Inheritance Classification
Which of the following classes inherits directly from `Throwable` but is classified as a **checked exception**?
- A. `java.lang.Error`
- B. `java.lang.RuntimeException`
- C. `java.lang.Exception` (excluding RuntimeException subclasses)
- D. `java.lang.NullPointerException`

**Answer: C**
**Detailed Explanation:**
- The class `Throwable` has two main subclasses: `Error` and `Exception`.
- `Error` and its subclasses are unchecked.
- `Exception` and its subclasses, **excluding subclasses of `RuntimeException`**, are checked exceptions.
- `RuntimeException` subclasses are unchecked.
- Therefore, C is correct.

---

### Question 16: AssertionError Constructor parameters
Which of the following is a valid syntax for an assertion statement in Java? (Select all that apply)
- A. `assert (x > 0);`
- B. `assert x > 0 : "Invalid";`
- C. `assert x > 0 : new Object();`
- D. `assert x > 0 : voidMethod();` // voidMethod() returns void

**Answer: A, B, C**
**Detailed Explanation:**
- The assertion syntax is `assert <booleanExpression> : <messageExpression>;`.
- The message expression can be any expression that **evaluates to a value** (like a String, primitive, or object). This value is converted to a String and passed to the `AssertionError` constructor if the assertion fails.
- **D is invalid** because a method returning `void` does not evaluate to any value, causing a compile-time error.

---

### Question 17: Implicit Checked Exception throws in Main method
What happens if a program throws a checked exception inside the `main` method, but the `main` signature does not declare it in a `throws` clause?
- A. The code compiles but logs a warning.
- B. The code fails to compile.
- C. The exception is silently ignored at runtime.
- D. The JVM automatically wraps it in a RuntimeException.

**Answer: B**
**Detailed Explanation:**
- Checked exceptions must follow the "handle-or-declare" rule.
- If a checked exception is thrown inside `main`, it must either be caught in a try-catch block or declared in the `main` method signature: `public static void main(String[] args) throws Exception`.
- If neither is done, compilation fails.

---

### Question 18: Uncaught RuntimeException thread behavior
What happens to a running Java application when a thread throws an uncaught `RuntimeException`?
- A. The entire JVM shuts down immediately.
- B. The thread that threw the exception terminates, while other non-daemon threads continue running.
- C. The exception is automatically caught and logged, and the thread continues execution.
- D. The thread enters a suspended state.

**Answer: B**
**Detailed Explanation:**
- If a thread throws an uncaught exception (checked or unchecked), the thread terminates.
- However, this does **not** stop the entire JVM unless it was the only remaining non-daemon thread in the system. Other active threads (like the main thread or user-defined threads) continue execution.

---

### Question 19: Assertion runtime evaluation default
If a Java application is launched without any command-line flags (e.g. `java MyApp`), what is the default status of `assert` statements?
- A. They are evaluated and throw AssertionError on failure.
- B. They are ignored completely at runtime (no performance overhead).
- C. They generate log statements but do not throw errors.
- D. The compiler does not generate bytecode for assertions unless `-ea` is specified at compile-time.

**Answer: B**
**Detailed Explanation:**
- By default, assertions are **disabled** at runtime.
- The JVM skips over assertion bytecodes, meaning they have no performance impact.
- To enable them, you must explicitly pass the `-ea` (or `-enableassertions`) flag to the JVM.

---

### Question 20: Throwing subclass checked exceptions in Overriding
If a parent class method declares `public void run() throws java.io.IOException`, which of the following throws declarations is valid in an overriding subclass method? (Select all that apply)
- A. `public void run() throws Exception`
- B. `public void run() throws java.io.FileNotFoundException`
- C. `public void run() throws RuntimeException`
- D. `public void run() {}`

**Answer: B, C, D**
**Detailed Explanation:**
- An overriding method in a subclass:
  - **Cannot throw broader checked exceptions** (A is invalid because `Exception` is broader than `IOException`).
  - **Can throw narrower checked exceptions** (B is valid because `FileNotFoundException` is a subclass of `IOException`).
  - **Can throw any unchecked exceptions** (C is valid because `RuntimeException` is unchecked).
  - **Can throw no exceptions** (D is valid).
- Therefore, B, C, and D are valid.

